import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, signal, untracked, viewChild } from '@angular/core';
import { AudioService } from '../../core/audio.service';
import { DuelService } from '../../core/duel.service';
import { HeroService } from '../../core/hero.service';
import { PlatformService } from '../../core/platform.service';
import { ProgressService } from '../../core/progress.service';
import { STORAGE_KEYS, StorageService } from '../../core/storage.service';
import { duelHero } from '../../engine/scenes/fimdarua';
import { DuelAnimMode } from '../../engine/scenes/duel-state';
import { SceneCanvas } from '../../shared/scene-canvas';
import { BLUFFS, judge, KIT, LEVEL_IDS, LevelId, LEVELS, makeZone, Zone } from './kit';
import { cancelRaf, raf } from '../../engine/core/browser';

type Phase = 'idle' | 'wait' | 'draw' | 'result';
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

// ================= VII · Duelo ao pôr do sol: espere o sino e acerte o tempo da agulha =================
// O quadro a quadro (fase, chapéus, animação da arma) fica no objeto do DuelService, lido pela cena;
// o que a interface mostra são Signals. Barra, faixas e marcador mudam a cada quadro e são escritos direto no DOM.
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
  private readonly secrets = inject(ProgressService);
  private readonly audio = inject(AudioService);
  private readonly storage = inject(StorageService);
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
  protected readonly kit = computed(() => KIT[this.wTypeOf()]);
  private readonly wTypeOf = computed(() => duelHero(this.heroesById()).weapon!);
  private readonly heroesById = computed(() => { this.kitHero(); return this.heroes.current(); });
  protected readonly weaponLine = computed(() => `${this.heroesById().name} · arma: ${this.kit().arma}`);
  protected readonly bonus = computed(() => this.wTypeOf() === 'pin' ? 'Com o revólver aprimorado do Xavier, a raiva enche mais rápido.' : 'Com o revólver aprimorado do Xavier, as faixas vermelhas ao lado da amarela também valem.');

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
  protected readonly best = signal('');
  protected playing: LevelId = 'normal';

  private round = 0; private you = 0; private joao = 0; private phase: Phase = 'idle';
  private timers: ReturnType<typeof setTimeout>[] = []; private t0 = 0; private period = 0; private hits = 0; private perfects = 0; private raf = 0;
  private zones: Zone[] = []; private deadline = 0; private holding = false; private holdAt = 0; private charge = 0;
  private cocked = false; private cockAt = 0; private lastTick = 0; private spinSfx: ReturnType<typeof setInterval> | undefined;
  private wins: Partial<Record<LevelId, number>> = this.storage.getJson(STORAGE_KEYS.duelWins, {});

  constructor() {
    this.showRecord();
    effect(() => { this.heroes.id(); untracked(() => { if (this.phase === 'idle') this.applyKit(); }); });
    afterNextRender(() => this.scene().whenReady(() => this.scene().pin(this.invite().nativeElement, 196, 50)));
    // timers e quadros só existem no navegador; no SSR (prerender e ng serve) não há o que limpar
    if (this.platform.isBrowser) inject(DestroyRef).onDestroy(() => this.clear());
  }

  private get W() { return this.kit(); }
  private get wType() { return this.wTypeOf(); }
  private get L() { return LEVELS[this.playing]; }
  private hasGun = () => this.secrets.hasGun();
  private sfx = (name: Parameters<AudioService['fx']>[0]) => this.audio.fx(name);
  private later(fn: () => void, ms: number): void { this.timers.push(setTimeout(fn, ms)); }
  private clear(): void { this.timers.forEach(clearTimeout); this.timers = []; cancelRaf(this.raf); clearInterval(this.spinSfx); }
  private focusLater(el: () => ElementRef<HTMLElement>): void { afterNextRender(() => el().nativeElement.focus({ preventScroll: true }), { injector: this.injector }); }

  private showRecord(): void {
    const parts = LEVEL_IDS.filter((k) => this.wins[k]).map((k) => `${LEVELS[k].name} ${this.wins[k]}×`);
    this.best.set(parts.length ? `Vitórias: ${parts.join(' · ')}` : '');
  }
  private applyKit(): void { this.kitHero.set(this.heroes.id()); this.fireLabel.set(this.W.btn); this.DUEL.anim.weapon = this.wType; }
  private setScore(): void { this.score.set({ round: this.round, you: this.you, joao: this.joao }); }
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
    this.round = 0; this.you = 0; this.joao = 0; this.hits = 0; this.perfects = 0;
    this.view.set('play'); this.stamp.set(null); this.inviteHidden.set(true);
    this.DUEL.on = true; this.armed.set(true);
    this.audio.cue('duel');
    this.sceneFig().nativeElement.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    this.nextRound();
  }

  private nextRound(): void {
    this.clear(); this.round++; this.setScore();
    const D = this.DUEL;
    D.hat = { you: true, joao: true }; D.flying = []; D.phase = 'wait'; this.phase = 'wait';
    D.anim.shots = []; D.anim.charge = 0; this.anim('wait');
    this.holding = false; this.charge = 0; this.cocked = false; this.zones = [];
    this.bar().nativeElement.className = 'reflex off'; this.zonesBox().nativeElement.innerHTML = ''; this.fill().nativeElement.style.width = '0%'; this.stamp.set(null);
    this.nextHidden.set(true); this.fireHidden.set(false); this.fireDisabled.set(false); this.fireLabel.set(this.W.btn);
    this.setCall('Preparar...');
    this.why.set('Mão longe da arma. Espere o sino.');
    const wait = 1800 + Math.random() * 2600;
    const n = this.round === 1 ? (Math.random() < 0.5 ? 1 : 0) : 1 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      this.later(() => {
        if (this.phase !== 'wait') return;
        const b = pick(BLUFFS);
        if (b.startsWith('O João mexeu')) D.twitchAt = performance.now();
        this.why.set(b);
      }, 500 + Math.random() * (wait - 900));
    }
    this.later(() => this.bell(), wait);
  }

  private renderZones(): void {
    const box = this.zonesBox().nativeElement;
    box.innerHTML = '';
    this.zones.forEach((z) => {
      const red = document.createElement('span'); red.className = 'r-zone'; red.style.left = z.s + '%'; red.style.width = z.w + '%'; red.hidden = !this.hasGun();
      const yel = document.createElement('span'); yel.className = 'r-perfect'; yel.style.left = z.mid - z.p / 2 + '%'; yel.style.width = z.p + '%';
      if (z.hit) { yel.classList.add('done'); red.classList.add('done'); }
      box.append(red, yel);
    });
  }

  private bell(): void {
    if (this.phase !== 'wait') return;
    const L = this.L, w = this.wType;
    this.phase = 'draw'; this.DUEL.phase = 'draw'; this.DUEL.bellAt = performance.now(); this.anim('draw');
    this.sfx('bell');
    this.setCall(this.W.call, 'draw'); this.why.set(this.W.aim);
    // a cada rodada tudo fica um pouco mais rápido
    this.period = L.period * Math.pow(L.speedUp, this.round - 1);
    this.bar().nativeElement.className = 'reflex' + (w === 'pin' ? ' meter' : '');
    if (w === 'twin') { this.zones = [makeZone(L, 18, 50), makeZone(L, 58, 94)]; this.period *= 1.3; this.deadline = this.period; }
    else if (w === 'pin') { this.zones = []; this.deadline = L.mashTime * Math.pow(L.speedUp, this.round - 1); }
    else if (w === 'lasso') { this.zones = [makeZone(L, 28, 94)]; this.deadline = this.period * 2.6; }
    else if (w === 'rifle') { this.zones = [makeZone(L, 28, 94)]; this.deadline = this.period * 2.5; }
    else { this.zones = [makeZone(L, 30, 94)]; this.deadline = this.period; }
    this.renderZones();
    const marker = this.marker().nativeElement;
    marker.style.left = '0%';
    marker.hidden = w === 'pin' || w === 'lasso' || w === 'rifle';
    this.t0 = performance.now(); this.lastTick = this.t0; this.raf = raf(this.tick);
  }

  // onde o marcador está, conforme a mecânica
  private position(now: number): number {
    if (this.wType === 'lasso') { const k = ((now - this.holdAt) / this.period) % 2; return (k < 1 ? k : 2 - k) * 100; }
    if (this.wType === 'rifle') return (1 - Math.cos(Math.PI * (now - this.cockAt) / this.period)) * 50;
    return ((now - this.t0) / this.period) * 100;
  }

  private readonly tick = (now: number): void => {
    if (this.phase !== 'draw') return;
    const dt = Math.min(0.05, (now - this.lastTick) / 1000); this.lastTick = now;
    const marker = this.marker().nativeElement;
    if (this.wType === 'pin') {
      this.charge = Math.max(0, this.charge - dt * 0.16);
      this.DUEL.anim.charge = this.charge; this.fill().nativeElement.style.width = this.charge * 100 + '%';
      if (this.charge > 0 && this.DUEL.anim.mode !== 'wind') this.anim('wind');
    } else if (this.wType === 'lasso') {
      if (this.holding) { marker.style.left = this.position(now) + '%'; this.DUEL.anim.charge = Math.min(1, (now - this.holdAt) / this.period); }
    } else if (this.wType === 'rifle') {
      if (this.cocked) marker.style.left = this.position(now) + '%';
    } else {
      const a = this.position(now);
      marker.style.left = Math.min(a, 100) + '%';
      if (a >= 100) { this.lose('slow'); return; }
    }
    if (now - this.t0 >= this.deadline) { this.lose('slow'); return; }
    this.raf = raf(this.tick);
  };

  // apertou (ou tocou): o que acontece depende da arma
  private press(): void {
    if (this.phase === 'wait') { this.early(); return; }
    if (this.phase !== 'draw') return;
    const now = performance.now(), w = this.wType, gun = this.hasGun();
    if (w === 'twin') {
      const a = this.position(now);
      const z = this.zones.find((q) => !q.hit && judge(a, q, gun));
      if (!z) { this.lose('miss'); return; }
      z.hit = true; z.yellow = judge(a, z, gun) === 'yellow';
      this.DUEL.anim.shots.push({ side: this.DUEL.anim.shots.length ? 'L' : 'R', at: now }); this.sfx('shot'); this.renderZones();
      if (this.zones.every((q) => q.hit)) this.win(this.zones.every((q) => q.yellow));
      return;
    }
    if (w === 'lasso') {
      if (this.holding) return;
      this.holding = true; this.holdAt = now; this.marker().nativeElement.hidden = false; this.anim('spin'); this.sfx('whoosh');
      this.spinSfx = setInterval(() => this.sfx('whoosh'), 320);
      return;
    }
    if (w === 'pin') {
      const need = this.L.mashNeed * (gun ? 0.75 : 1);
      this.charge = Math.min(1, this.charge + 1 / need); this.DUEL.anim.charge = this.charge; this.fill().nativeElement.style.width = this.charge * 100 + '%';
      if (this.DUEL.anim.mode !== 'wind') this.anim('wind');
      this.sfx('tap');
      if (this.charge >= 1) this.win((now - this.t0) < this.deadline * 0.6);
      return;
    }
    if (w === 'rifle' && !this.cocked) {
      this.cocked = true; this.cockAt = now; this.marker().nativeElement.hidden = false; this.anim('cock'); this.sfx('cock');
      this.fireLabel.set(this.W.btn2!); this.why.set(this.W.aim2!);
      this.later(() => { if (this.phase === 'draw') this.anim('aim'); }, 280);
      return;
    }
    const r = judge(this.position(now), this.zones[0], gun);
    if (r) this.win(r === 'yellow'); else this.lose('miss');
  }

  // soltou: só o laço usa (é aí que ele voa)
  protected release(): void {
    if (this.wType !== 'lasso' || !this.holding || this.phase !== 'draw') return;
    this.holding = false; clearInterval(this.spinSfx);
    const r = judge(this.position(performance.now()), this.zones[0], this.hasGun());
    if (r) this.win(r === 'yellow'); else this.lose('miss');
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
    this.clear(); this.phase = 'result'; this.joao++; this.setScore();
    this.joaoFires();
    this.setCall('Desclassificado!');
    this.why.set('Você se mexeu antes do sino. Rodada para o João.');
    this.stamp.set({ text: 'Antes do sino!', ok: false });
    this.after();
  }

  private win(yellow: boolean): void {
    this.clear(); this.phase = 'result'; this.you++; this.hits++; if (yellow) this.perfects++; this.setScore();
    this.bar().nativeElement.classList.add('hit');
    const D = this.DUEL, w = this.wType;
    D.shotBy = 'you'; D.shotAt = performance.now(); D.phase = 'you';
    if (w === 'lasso') { this.anim('caught'); this.sfx('throw'); this.later(() => this.sfx('snap'), 420); this.knock('joao', 420); this.later(() => this.shake(), 420); }
    else if (w === 'pin') { this.anim('throw'); this.sfx('throw'); this.later(() => this.sfx('bonk'), 360); this.knock('joao', 360); this.later(() => this.shake(), 360); }
    else if (w === 'rifle') { this.anim('fire'); this.sfx('rifle'); this.knock('joao'); this.shake(); }
    else if (w === 'twin') { this.knock('joao'); this.shake(); }
    else { this.anim('fire'); this.sfx('shot'); this.knock('joao'); this.shake(); }
    const [call, st, why] = yellow ? this.W.yellow : this.W.red;
    this.setCall(call, yellow ? 'perfect' : 'draw');
    this.why.set(why);
    this.stamp.set({ text: st, ok: true });
    this.after();
  }

  private lose(kind: 'slow' | 'miss'): void {
    this.clear(); this.phase = 'result'; this.joao++; this.setScore();
    this.bar().nativeElement.classList.add('miss');
    if (this.wType === 'lasso') this.anim(this.holding || kind === 'miss' ? 'fall' : 'wait');
    else if (this.wType === 'pin') this.anim(this.charge > 0 ? 'drop' : 'wait');
    this.holding = false;
    this.joaoFires();
    const [call, st, why] = kind === 'slow' ? this.W.slow : this.W.miss;
    this.setCall(call); this.why.set(why); this.stamp.set({ text: st, ok: false });
    this.after();
  }

  private over(): boolean { return this.you === this.L.wins || this.joao === this.L.wins; }
  private after(): void {
    this.fireDisabled.set(true);
    this.nextLabel.set(this.over() ? 'Ver o resultado' : 'Próxima rodada');
    this.later(() => { this.fireHidden.set(true); this.nextHidden.set(false); this.focusLater(() => this.nextBtn()); }, 900);
  }

  private finish(): void {
    this.clear(); this.phase = 'idle'; this.view.set('end');
    this.DUEL.phase = 'idle';
    this.audio.cue('village');
    const won = this.you === this.L.wins, level = this.playing, W = this.W;
    if (won) { this.wins[level] = (this.wins[level] || 0) + 1; this.storage.setJson(STORAGE_KEYS.duelWins, this.wins); }
    this.stamp.set({ text: won ? 'Vitória!' : 'Derrota', ok: won });
    this.later(() => { this.stamp.set(null); this.DUEL.on = false; this.DUEL.flying = []; this.anim('wait'); this.armed.set(false); this.inviteHidden.set(false); this.applyKit(); }, 3200);
    this.endTitle.set(won && this.joao === 0 ? W.flawless : won ? W.win : W.lose);
    this.endText.set(`${this.L.name}: você ${this.you} × ${this.joao} João. ${W.unit}: ${this.hits}. Na faixa amarela: ${this.perfects}.` + (won && level !== 'dificil' ? ' Que tal subir a dificuldade?' : ''));
    this.showRecord();
    this.focusLater(() => this.againBtn());
  }

  protected backToRules(): void { this.view.set('intro'); this.applyKit(); this.focusLater(() => this.startBtn()); }
  protected nextClick(): void { if (this.over()) this.finish(); else this.nextRound(); }
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
