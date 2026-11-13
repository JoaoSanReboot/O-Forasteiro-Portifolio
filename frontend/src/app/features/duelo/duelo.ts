import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { BANDITS } from '../../content/jogos';
import { PlatformService } from '../../core/platform/platform.service';
import { cancelRaf, raf } from '../../engine/core/browser';
import { COIN_IDS, SecretsService } from '../secrets/secrets.service';
import { BLUFFS, KIT, Weapon } from './rules/kit';
import { LEVEL } from './rules/levels';
import { Hunt, planRound } from './rules/match';
import { createMechanic, DuelPort, LoseKind, Mechanic } from './rules/mechanics';
import { Zone } from './rules/zones';

type Phase = 'menu' | 'waiting' | 'draw' | 'result' | 'end';
/** o que aconteceu na rodada: quem atirou e de quem o chapéu voou */
type Outcome = 'you' | 'bandit' | null;

const WEAPONS = (Object.keys(KIT) as Weapon[]).map((id) => ({ id, label: KIT[id].label }));

// O duelo ao meio-dia, dentro da Experiência: cada problema que eu já resolvi virou um bandido de
// cartaz ("Sessenta Segundos", o grid de contratos lento). Espere o sino, acerte a faixa da barra e o
// bandido vai preso, mostrando o antes e o depois de verdade. Errou, ele foge e você perde um chapéu.
// As regras de cada arma e da caçada ficam em rules/; aqui é só o palco.
// O marcador e a raiva mudam a cada quadro: vão direto no estilo, fora dos Signals.
@Component({
  selector: 'article[appDuelo]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'game duelo', id: 'duelo', 'aria-labelledby': 'duelo-t' },
  templateUrl: './duelo.html',
})
export class Duelo implements DuelPort {
  private readonly platform = inject(PlatformService);
  protected readonly secrets = inject(SecretsService);
  protected readonly coins = COIN_IDS;
  protected readonly weapons = WEAPONS;
  protected readonly bandits = BANDITS;

  protected readonly weapon = signal<Weapon>('revolver');
  protected readonly kit = computed(() => KIT[this.weapon()]);
  protected readonly phase = signal<Phase>('menu');
  protected readonly caught = signal(0);
  protected readonly lives = signal(3);
  /** o bandido da vez */
  protected readonly current = computed(() => this.bandits[Math.min(this.caught(), this.bandits.length - 1)]);
  protected readonly zones = signal<Zone[]>([]);
  protected readonly markerOn = signal(false);
  protected readonly meter = signal(false);
  protected readonly isCocked = signal(false);
  protected readonly spinning = signal(false);
  protected readonly bluff = signal('');
  protected readonly ringing = signal(false);
  protected readonly outcome = signal<Outcome>(null);
  protected readonly stamp = signal<{ title: string; why: string; good: boolean } | null>(null);
  protected readonly end = signal<{ won: boolean; summary: string } | null>(null);
  protected readonly playing = computed(() => this.phase() === 'waiting' || this.phase() === 'draw');
  protected readonly actionLabel = computed(() => {
    const k = this.kit();
    if (this.phase() === 'waiting') return 'Espere o sino...';
    return this.isCocked() && k.btn2 ? k.btn2 : k.btn;
  });
  protected readonly hint = computed(() => {
    const k = this.kit();
    if (this.phase() === 'waiting') return 'Mão parada até o sino tocar.';
    return this.isCocked() && k.aim2 ? k.aim2 : k.aim;
  });

  private readonly markerEl = viewChild<ElementRef<HTMLElement>>('marker');
  private readonly barEl = viewChild<ElementRef<HTMLElement>>('bar');
  private readonly stageEl = viewChild<ElementRef<HTMLElement>>('stage');

  private hunt: Hunt | null = null;
  private mech: Mechanic | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private frame = 0;
  private last = 0;
  private held = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    destroyRef.onDestroy(() => this.clear());
    if (!this.platform.isBrowser) return;
    // Espaço também vale, mas só com a partida rolando (fora dela a página rola como sempre;
    // durante o carimbo do resultado ele não faz nada, para quem aperta repetido não perder a tela)
    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || this.phase() === 'menu' || this.phase() === 'end') return;
      e.preventDefault();
      if (e.repeat || !this.playing()) return;
      if (e.type === 'keydown') this.down(); else this.up();
    };
    document.addEventListener('keydown', key);
    document.addEventListener('keyup', key);
    destroyRef.onDestroy(() => { document.removeEventListener('keydown', key); document.removeEventListener('keyup', key); });
  }

  // ---------------- o menu ----------------
  protected start(): void {
    this.clear();
    this.hunt = new Hunt(this.bandits.length);
    this.caught.set(0);
    this.lives.set(this.hunt.lives);
    this.end.set(null);
    this.nextRound();
    // o menu encolhe ao começar: se o palco ficou fora da tela, traz de volta (instantâneo, para não brigar com a inércia)
    const stage = this.stageEl()?.nativeElement;
    if (stage && stage.getBoundingClientRect().top < 0) stage.scrollIntoView?.({ block: 'start', behavior: 'instant' });
  }

  protected quit(): void {
    this.clear();
    this.phase.set('menu');
    this.reset();
  }

  // ---------------- as rodadas ----------------
  private nextRound(): void {
    const h = this.hunt!;
    h.nextRound();
    this.reset();
    this.phase.set('waiting');
    const plan = planRound(h.round);
    for (const at of plan.bluffs) this.later(() => this.bluff.set(BLUFFS[Math.floor(Math.random() * BLUFFS.length)]), at);
    this.later(() => this.ring(), plan.wait);
  }

  private reset(): void {
    this.mech = null;
    this.zones.set([]);
    this.markerOn.set(false);
    this.meter.set(false);
    this.isCocked.set(false);
    this.spinning.set(false);
    this.bluff.set('');
    this.ringing.set(false);
    this.outcome.set(null);
    this.stamp.set(null);
    this.held = false;
    this.stageEl()?.nativeElement.classList.remove('twin-shot', 'shake');
    this.markerEl()?.nativeElement.style.setProperty('--at', '0%');
    this.charge(0);
  }

  /** o sino: a barra se arma e a rodada fica aberta */
  private ring(): void {
    this.bluff.set('');
    this.ringing.set(true);
    this.phase.set('draw');
    // cada bandido preso deixa o próximo mais rápido
    const mech = createMechanic(this.weapon(), this, LEVEL, this.hunt!.caught + 1);
    mech.arm(performance.now());
    this.mech = mech;
    this.zones.set(mech.zones.map((z) => ({ ...z })));
    this.meter.set(mech.meter);
    this.markerOn.set(!mech.markerHidden);
    this.last = performance.now();
    const tick = (now: number) => {
      if (this.phase() !== 'draw' || this.mech !== mech) return;
      const dt = (now - this.last) / 1000;
      this.last = now;
      if (mech.step(now, dt)) this.frame = raf(tick);
    };
    this.frame = raf(tick);
  }

  // ---------------- o gatilho ----------------
  protected down(): void {
    if (this.phase() === 'waiting') { this.early(); return; }
    if (this.phase() !== 'draw' || !this.mech) return;
    this.held = true;
    this.mech.press(performance.now(), this.secrets.gun());
  }

  protected up(): void {
    if (!this.held) return;
    this.held = false;
    if (this.phase() === 'draw' && this.mech) this.mech.release(performance.now(), this.secrets.gun());
  }

  private early(): void {
    this.clear();
    this.hunt!.escape();
    this.finish('bandit', 'Oxente, cedo!', `Sacou antes do sino e ${this.current().alias} fugiu.`, false);
  }

  // ---------------- a DuelPort (o que a mecânica pede) ----------------
  marker(pct: number): void { this.markerEl()?.nativeElement.style.setProperty('--at', `${pct}%`); }
  showMarker(): void { this.markerOn.set(true); }
  charge(k: number): void {
    const v = k.toFixed(3);
    this.barEl()?.nativeElement.style.setProperty('--charge', v);
    this.stageEl()?.nativeElement.style.setProperty('--charge', v);
  }
  zonesChanged(): void { this.zones.set(this.mech ? this.mech.zones.map((z) => ({ ...z })) : []); }
  shot(): void { this.flash(); }
  cocked(): void { this.isCocked.set(true); }
  spin(on: boolean): void { this.spinning.set(on); }

  win(yellow: boolean): void {
    const [title] = yellow ? this.kit().yellow : this.kit().red;
    const b = this.current();
    this.hunt!.capture(yellow);
    this.finish('you', title, `${b.alias} preso: ${b.before} → ${b.after}.`, true);
  }

  lose(kind: LoseKind): void {
    const [title, why] = kind === 'slow' ? this.kit().slow : this.kit().miss;
    this.hunt!.escape();
    this.finish('bandit', title, `${why} ${this.current().alias} fugiu.`, false);
  }

  private finish(who: 'you' | 'bandit', title: string, why: string, good: boolean): void {
    cancelRaf(this.frame);
    this.spinning.set(false);
    this.phase.set('result');
    this.outcome.set(who);
    this.stamp.set({ title, why, good });
    const h = this.hunt!;
    this.caught.set(h.caught);
    this.lives.set(h.livesLeft);
    this.shake();
    this.later(() => {
      if (!h.over) { this.nextRound(); return; }
      this.stamp.set(null);
      this.phase.set('end');
      this.end.set({ won: h.won, summary: h.summary() });
    }, 2300);
  }

  private flash(): void {
    const el = this.stageEl()?.nativeElement;
    if (!el) return;
    el.classList.remove('twin-shot');
    void el.offsetWidth;
    el.classList.add('twin-shot');
  }

  private shake(): void {
    const el = this.stageEl()?.nativeElement;
    if (!el || this.platform.reduceMotion) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  private later(fn: () => void, ms: number): void { this.timers.push(setTimeout(fn, ms)); }

  private clear(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    cancelRaf(this.frame);
  }
}
