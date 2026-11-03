import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, signal, untracked, viewChild } from '@angular/core';
import { AudioService } from '../../core/audio/audio.service';
import { PlatformService } from '../../core/platform/platform.service';
import { DuelFx } from '../../engine/audio/vila-audio';
import { cancelRaf, raf } from '../../engine/core/browser';
import { duelHero } from '../../engine/figures/duelist';
import { DuelAnimMode } from '../../engine/scenes/duel-state';
import { SceneCanvas } from '../../shared/scene-canvas/scene-canvas';
import { HeroService } from '../heroes/hero.service';
import { SecretsService } from '../secrets/secrets.service';
import { DuelRecordsService } from './duel-records.service';
import { DuelService } from './duel.service';
import { BLUFFS, KIT } from './rules/kit';
import { LEVEL_IDS, LevelId, LEVELS } from './rules/levels';
import { DuelMatch, planRound } from './rules/match';
import { createMechanic, DuelPort, LoseKind, Mechanic } from './rules/mechanics';

type Phase = 'idle' | 'wait' | 'draw' | 'result';
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

// ================= VII · Duelo ao pôr do sol: espere o sino e acerte o tempo da agulha =================
// As regras (placar, faixas, a mecânica de cada arma) moram em rules/; este componente liga as regras
// à interface (Signals), à cena (o objeto do DuelService, lido a cada quadro), ao som e ao relógio.
// Barra, faixas e marcador mudam a cada quadro e são escritos direto no DOM.
@Component({
  selector: 'section[appDuelo]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector', id: 'duelo', 'aria-labelledby': 't-duelo', '(window:keydown)': 'onKey($event, true)', '(window:keyup)': 'onKey($event, false)', '(window:pointerup)': 'release()', '(window:pointercancel)': 'release()' },
  templateUrl: './duelo.html',
})
export class Duelo {
  private readonly DUEL = inject(DuelService).state;
  private readonly heroes = inject(HeroService);
  private readonly secrets = inject(SecretsService);
  private readonly audio = inject(AudioService);
  private readonly platform = inject(PlatformService);
  private readonly reduceMotion = this.platform.reduceMotion;
  private readonly injector = inject(Injector);

  private readonly scene = viewChild.required(SceneCanvas);
  private readonly sceneFig = viewChild.required('sceneFig', { read: ElementRef<HTMLElement> });
  private readonly invite = viewChild.required<ElementRef<HTMLButtonElement>>('invite');
  private readonly duelBox = viewChild.required<ElementRef<HTMLElement>>('duel');
  private readonly startBtn = viewChild.required<ElementRef<HTMLButtonElement>>('startBtn');
  private readonly againBtn = viewChild.required<ElementRef<HTMLButtonElement>>('again');
  private readonly nextBtn = viewChild.required<ElementRef<HTMLButtonElement>>('next');
  private readonly bar = viewChild.required<ElementRef<HTMLElement>>('bar');
  private readonly zonesBox = viewChild.required<ElementRef<HTMLElement>>('zonesBox');
  private readonly fill = viewChild.required<ElementRef<HTMLElement>>('fill');
  private readonly marker = viewChild.required<ElementRef<HTMLElement>>('marker');

  protected readonly levels = LEVELS;
  protected readonly levelIds = LEVEL_IDS;
  protected readonly level = signal<LevelId>('normal');
  /** regras, botão e arma mudam com o personagem escolhido (mas não no meio de um duelo) */
  private readonly kitHero = signal(this.heroes.id());
  private readonly kitPerson = computed(() => { this.kitHero(); return this.heroes.current(); });
  private readonly weapon = computed(() => duelHero(this.kitPerson()).weapon!);
  protected readonly kit = computed(() => KIT[this.weapon()]);
  protected readonly weaponLine = computed(() => `${this.kitPerson().name} · arma: ${this.kit().arma}`);
  protected readonly bonus = computed(() => this.weapon() === 'pin' ? 'Com o revólver aprimorado do Xavier, a raiva enche mais rápido.' : 'Com o revólver aprimorado do Xavier, as faixas vermelhas ao lado da amarela também valem.');

  protected readonly view = signal<'intro' | 'play' | 'end'>('intro');
  protected readonly armed = signal(false);
  protected readonly inviteHidden = signal(false);
  protected readonly score = signal({ round: 1, you: 0, joao: 0 });
  protected readonly call = signal<{ text: string; cls: string }>({ text: 'Preparar...', cls: '' });
  protected readonly why = signal('');
  protected readonly stamp = signal<{ text: string; ok: boolean } | null>(null);
  protected readonly fireLabel = signal('Atirar');
  protected readonly fireHidden = signal(false);
  protected readonly fireDisabled = signal(false);
  protected readonly nextHidden = signal(true);
  protected readonly nextLabel = signal('Próxima rodada');
  protected readonly endTitle = signal('');
  protected readonly endText = signal('');
  private readonly records = inject(DuelRecordsService);
  protected readonly best = this.records.summary;
  protected playing: LevelId = 'normal';

  private phase: Phase = 'idle';
  private match = new DuelMatch('normal', LEVELS.normal);
  /** a mecânica da arma na rodada (criada no sino) */
  private mech: Mechanic | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private frameId = 0;
  private lastTick = 0;
  private spinSfx: ReturnType<typeof setInterval> | undefined;

  constructor() {
    effect(() => { this.heroes.id(); untracked(() => { if (this.phase === 'idle') this.applyKit(); }); });
    afterNextRender(() => this.scene().whenReady(() => this.scene().pin(this.invite().nativeElement, 196, 50)));
    // timers e quadros só existem no navegador; no SSR (prerender e ng serve) não há o que limpar
    if (this.platform.isBrowser) inject(DestroyRef).onDestroy(() => this.clear());
  }

  // ---------- o que as mecânicas pedem para a tela, a cena e o som ----------
  private readonly port: DuelPort = {
    anim: (mode) => this.anim(mode),
    ensureAnim: (mode) => { if (this.DUEL.anim.mode !== mode) this.anim(mode); },
    animCharge: (k) => { this.DUEL.anim.charge = k; },
    twinShot: (at) => { this.DUEL.anim.shots.push({ side: this.DUEL.anim.shots.length ? 'L' : 'R', at }); },
    sfx: (name) => this.sfx(name),
    marker: (pct) => { this.marker().nativeElement.style.left = pct + '%'; },
    showMarker: () => { this.marker().nativeElement.hidden = false; },
    fill: (k) => { this.fill().nativeElement.style.width = k * 100 + '%'; },
    zonesChanged: () => this.renderZones(),
    cocked: () => { this.fireLabel.set(this.kit().btn2!); this.why.set(this.kit().aim2!); },
    spin: (on) => { if (on) this.spinSfx = setInterval(() => this.sfx('whoosh'), 320); else clearInterval(this.spinSfx); },
    knock: (target, delay = 0) => this.knock(target, delay),
    shake: () => this.shake(),
    later: (fn, ms) => this.later(fn, ms),
    drawing: () => this.phase === 'draw',
    win: (yellow) => this.win(yellow),
    lose: (kind) => this.lose(kind),
  };

  private hasGun = () => this.secrets.hasGun();
  private sfx = (name: DuelFx) => this.audio.fx(name);
  private later(fn: () => void, ms: number): void { this.timers.push(setTimeout(fn, ms)); }
  private clear(): void { this.timers.forEach(clearTimeout); this.timers = []; cancelRaf(this.frameId); clearInterval(this.spinSfx); }
  private focusLater(el: () => ElementRef<HTMLElement>): void { afterNextRender(() => el().nativeElement.focus({ preventScroll: true }), { injector: this.injector }); }

  private applyKit(): void { this.kitHero.set(this.heroes.id()); this.fireLabel.set(this.kit().btn); this.DUEL.anim.weapon = this.weapon(); }
  private setScore(): void { this.score.set({ round: this.match.round, you: this.match.you, joao: this.match.joao }); }
  private setCall(text: string, cls = ''): void { this.call.set({ text, cls }); }
  private shake(): void { const f = this.sceneFig().nativeElement; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  private anim(mode: DuelAnimMode): void { this.DUEL.anim.mode = mode; this.DUEL.anim.at = performance.now(); }

  // o João, encostado no mourão, chama para o duelo
  protected goToRules(): void {
    this.duelBox().nativeElement.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth', block: 'center' });
    this.startBtn().nativeElement.focus({ preventScroll: true });
  }

  protected start(): void {
    this.clear(); this.applyKit();
    this.playing = this.level();
    this.match = new DuelMatch(this.playing, LEVELS[this.playing]);
    this.view.set('play'); this.stamp.set(null); this.inviteHidden.set(true);
    this.DUEL.on = true; this.armed.set(true);
    this.audio.cue('duel');
    this.sceneFig().nativeElement.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    this.nextRound();
  }

  private nextRound(): void {
    this.clear(); this.match.nextRound(); this.setScore();
    const D = this.DUEL;
    D.hat = { you: true, joao: true }; D.flying = []; D.phase = 'wait'; this.phase = 'wait';
    D.anim.shots = []; D.anim.charge = 0; this.anim('wait');
    this.mech = null;
    this.bar().nativeElement.className = 'reflex off'; this.zonesBox().nativeElement.innerHTML = ''; this.fill().nativeElement.style.width = '0%'; this.stamp.set(null);
    this.nextHidden.set(true); this.fireHidden.set(false); this.fireDisabled.set(false); this.fireLabel.set(this.kit().btn);
    this.setCall('Preparar...');
    this.why.set('Mão longe da arma. Espere o sino.');
    const { wait, bluffs } = planRound(this.match.round);
    for (const at of bluffs) {
      this.later(() => {
        if (this.phase !== 'wait') return;
        const b = pick(BLUFFS);
        if (b.startsWith('O João mexeu')) D.twitchAt = performance.now();
        this.why.set(b);
      }, at);
    }
    this.later(() => this.bell(), wait);
  }

  private renderZones(): void {
    const box = this.zonesBox().nativeElement;
    box.innerHTML = '';
    (this.mech?.zones ?? []).forEach((z) => {
      const red = document.createElement('span'); red.className = 'r-zone'; red.style.left = z.s + '%'; red.style.width = z.w + '%'; red.hidden = !this.hasGun();
      const yel = document.createElement('span'); yel.className = 'r-perfect'; yel.style.left = z.mid - z.p / 2 + '%'; yel.style.width = z.p + '%';
      if (z.hit) { yel.classList.add('done'); red.classList.add('done'); }
      box.append(red, yel);
    });
  }

  private bell(): void {
    if (this.phase !== 'wait') return;
    this.phase = 'draw'; this.DUEL.phase = 'draw'; this.DUEL.bellAt = performance.now(); this.anim('draw');
    this.sfx('bell');
    this.setCall(this.kit().call, 'draw'); this.why.set(this.kit().aim);
    const mech = this.mech = createMechanic(this.weapon(), this.port, this.match.level, this.match.round);
    mech.arm(performance.now());
    this.bar().nativeElement.className = 'reflex' + (mech.meter ? ' meter' : '');
    this.renderZones();
    const marker = this.marker().nativeElement;
    marker.style.left = '0%';
    marker.hidden = mech.markerHidden;
    this.lastTick = mech.t0; this.frameId = raf(this.tick);
  }

  private readonly tick = (now: number): void => {
    const mech = this.mech;
    if (this.phase !== 'draw' || !mech) return;
    const dt = Math.min(0.05, (now - this.lastTick) / 1000); this.lastTick = now;
    if (!mech.step(now, dt)) return;
    if (now - mech.t0 >= mech.deadline) { this.lose('slow'); return; }
    this.frameId = raf(this.tick);
  };

  // apertou (ou tocou): antes do sino perde a rodada; depois, depende da arma
  private press(): void {
    if (this.phase === 'wait') { this.early(); return; }
    if (this.phase !== 'draw' || !this.mech) return;
    this.mech.press(performance.now(), this.hasGun());
  }

  // soltou: só o laço usa (é aí que ele voa)
  protected release(): void {
    if (this.phase !== 'draw' || !this.mech) return;
    this.mech.release(performance.now(), this.hasGun());
  }

  // quem leva o tiro (ou o laço, ou o rolo) perde o chapéu, às vezes com um atraso para a arma chegar
  private knock(target: 'you' | 'joao', delay = 0): void {
    const go = () => {
      this.DUEL.hat[target] = false;
      const fly = target === 'joao' ? '#9a6a3c' : duelHero(this.heroes.current()).flyHat;
      if (fly) this.DUEL.flying.push(target === 'joao' ? { x: 214, y: 58, vx: 1.3, vy: -2.4, r: 0, col: fly, ground: 112 } : { x: 110, y: 58, vx: -1.3, vy: -2.4, r: 0, col: fly, ground: 112 });
    };
    if (delay) this.later(go, delay); else go();
  }
  private joaoFires(): void { const D = this.DUEL; D.shotBy = 'joao'; D.shotAt = performance.now(); D.phase = 'joao'; this.sfx('shot'); this.knock('you'); }

  private early(): void {
    this.clear(); this.phase = 'result'; this.match.joaoWins(); this.setScore();
    this.joaoFires();
    this.setCall('Desclassificado!');
    this.why.set('Você se mexeu antes do sino. Rodada para o João.');
    this.stamp.set({ text: 'Antes do sino!', ok: false });
    this.after();
  }

  private win(yellow: boolean): void {
    this.clear(); this.phase = 'result'; this.match.youWin(yellow); this.setScore();
    this.bar().nativeElement.classList.add('hit');
    const D = this.DUEL;
    D.shotBy = 'you'; D.shotAt = performance.now(); D.phase = 'you';
    this.mech!.winEffects();
    const [call, st, why] = yellow ? this.kit().yellow : this.kit().red;
    this.setCall(call, yellow ? 'perfect' : 'draw');
    this.why.set(why);
    this.stamp.set({ text: st, ok: true });
    this.after();
  }

  private lose(kind: LoseKind): void {
    this.clear(); this.phase = 'result'; this.match.joaoWins(); this.setScore();
    this.bar().nativeElement.classList.add('miss');
    this.mech?.loseAnim(kind);
    this.joaoFires();
    const [call, st, why] = kind === 'slow' ? this.kit().slow : this.kit().miss;
    this.setCall(call); this.why.set(why); this.stamp.set({ text: st, ok: false });
    this.after();
  }

  private after(): void {
    this.fireDisabled.set(true);
    this.nextLabel.set(this.match.over ? 'Ver o resultado' : 'Próxima rodada');
    this.later(() => { this.fireHidden.set(true); this.nextHidden.set(false); this.focusLater(() => this.nextBtn()); }, 900);
  }

  private finish(): void {
    this.clear(); this.phase = 'idle'; this.view.set('end');
    this.DUEL.phase = 'idle';
    this.audio.cue('village');
    const m = this.match, kit = this.kit();
    if (m.won) this.records.addWin(m.levelId);
    this.stamp.set({ text: m.won ? 'Vitória!' : 'Derrota', ok: m.won });
    this.later(() => { this.stamp.set(null); this.DUEL.on = false; this.DUEL.flying = []; this.anim('wait'); this.armed.set(false); this.inviteHidden.set(false); this.applyKit(); }, 3200);
    this.endTitle.set(m.title(kit));
    this.endText.set(m.summary(kit));
    this.focusLater(() => this.againBtn());
  }

  protected backToRules(): void { this.view.set('intro'); this.applyKit(); this.focusLater(() => this.startBtn()); }
  protected nextClick(): void { if (this.match.over) this.finish(); else this.nextRound(); }
  protected firePointer(e: PointerEvent): void { e.preventDefault(); this.press(); }
  protected fireClick(e: MouseEvent): void { if (e.detail === 0) { this.press(); this.release(); } }
  protected scenePress(e: PointerEvent): void { if (this.DUEL.on && !(e.target as Element).closest('.say')) this.press(); }

  protected onKey(e: KeyboardEvent, down: boolean): void {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (!down) { this.release(); return; }
    if (this.view() !== 'play' || (this.phase !== 'wait' && this.phase !== 'draw')) return;
    e.preventDefault(); if (!e.repeat) this.press();
  }
}
