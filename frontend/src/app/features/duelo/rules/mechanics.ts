import { DuelFx } from '../../../engine/audio/vila-audio';
import { Weapon } from '../../../engine/heroes/heroes';
import { DuelAnimMode } from '../../../engine/scenes/duel-state';
import { Level } from './levels';
import { judge, makeZone, Zone } from './zones';

// A mecânica de cada arma depois do sino: onde o marcador está, o que um toque (ou soltar) faz,
// quando a rodada se perde por tempo e como a vitória aparece na cena.
// Nada aqui conhece o DOM, o Angular ou a cena: tudo o que precisa mostrar passa pela DuelPort.

export type LoseKind = 'slow' | 'miss';

/** o que a mecânica pede para a interface, a cena e o som */
export interface DuelPort {
  anim(mode: DuelAnimMode): void;
  /** troca para `mode` só se a cena ainda não estiver nele */
  ensureAnim(mode: DuelAnimMode): void;
  /** força acumulada na cena (laço girando, raiva do rolo), de 0 a 1 */
  animCharge(k: number): void;
  /** um disparo de uma das duas pistolas */
  twinShot(at: number): void;
  sfx(name: DuelFx): void;
  /** posição do marcador na barra, em % */
  marker(pct: number): void;
  showMarker(): void;
  /** o preenchimento da barra de raiva (rolo), de 0 a 1 */
  fill(k: number): void;
  /** as faixas mudaram (uma pistola acertou a dela) */
  zonesChanged(): void;
  /** o rifle foi engatilhado: o botão e a dica passam para o disparo */
  cocked(): void;
  /** o laço começou (ou parou) de girar: o assobio do vento repete enquanto gira */
  spin(on: boolean): void;
  /** o chapéu de alguém voa, às vezes com um atraso para a arma chegar */
  knock(target: 'you' | 'joao', delay?: number): void;
  shake(): void;
  later(fn: () => void, ms: number): void;
  /** a rodada ainda está esperando o disparo */
  drawing(): boolean;
  win(yellow: boolean): void;
  lose(kind: LoseKind): void;
}

export abstract class Mechanic {
  /** início da contagem (o sino) */
  t0 = 0;
  /** quanto o marcador leva para percorrer a barra (ms) */
  protected period = 0;
  /** passou disso sem acertar, o João saca (ms desde o sino) */
  deadline = 0;
  zones: Zone[] = [];

  constructor(protected readonly port: DuelPort, protected readonly L: Level, protected readonly round: number) {}

  /** a barra vira medidor de raiva (rolo) */
  readonly meter: boolean = false;
  /** o marcador só aparece depois do primeiro toque (laço, rifle) ou nunca (rolo) */
  readonly markerHidden: boolean = false;

  /** o sino tocou: monta as faixas e o prazo; a cada rodada tudo fica um pouco mais rápido */
  arm(now: number): void {
    this.period = this.L.period * Math.pow(this.L.speedUp, this.round - 1);
    this.setup();
    this.t0 = now;
  }
  protected abstract setup(): void;

  /** onde o marcador está, em % da barra */
  position(now: number): number { return ((now - this.t0) / this.period) * 100; }

  /** um quadro depois do sino; devolve false se a rodada acabou aqui */
  step(_now: number, _dt: number): boolean { return true; }

  /** apertou (ou tocou) com a rodada aberta */
  abstract press(now: number, gun: boolean): void;

  /** soltou: só o laço usa (é aí que ele voa) */
  release(_now: number, _gun: boolean): void { /* só o laço */ }

  /** o que a cena e o som fazem quando o visitante acerta */
  abstract winEffects(): void;

  /** a pose do visitante quando ele perde */
  loseAnim(_kind: LoseKind): void { /* a maioria não muda de pose */ }

  /** tiro único: amarela, vermelha (com o revólver aprimorado) ou errou */
  protected shootAt(now: number, gun: boolean): void {
    const r = judge(this.position(now), this.zones[0], gun);
    if (r) this.port.win(r === 'yellow'); else this.port.lose('miss');
  }
}

/** revólver: o marcador corre a barra uma vez; atire na faixa */
class Revolver extends Mechanic {
  protected setup(): void { this.zones = [makeZone(this.L, 30, 94)]; this.deadline = this.period; }
  override step(now: number): boolean {
    const a = this.position(now);
    this.port.marker(Math.min(a, 100));
    if (a >= 100) { this.port.lose('slow'); return false; }
    return true;
  }
  press(now: number, gun: boolean): void { this.shootAt(now, gun); }
  winEffects(): void { this.port.anim('fire'); this.port.sfx('shot'); this.port.knock('joao'); this.port.shake(); }
}

/** duas pistolas: duas faixas na mesma passada, um disparo para cada */
class Twin extends Mechanic {
  protected setup(): void { this.zones = [makeZone(this.L, 18, 50), makeZone(this.L, 58, 94)]; this.period *= 1.3; this.deadline = this.period; }
  override step(now: number): boolean {
    const a = this.position(now);
    this.port.marker(Math.min(a, 100));
    if (a >= 100) { this.port.lose('slow'); return false; }
    return true;
  }
  press(now: number, gun: boolean): void {
    const a = this.position(now);
    const z = this.zones.find((q) => !q.hit && judge(a, q, gun));
    if (!z) { this.port.lose('miss'); return; }
    z.hit = true; z.yellow = judge(a, z, gun) === 'yellow';
    this.port.twinShot(now); this.port.sfx('shot'); this.port.zonesChanged();
    if (this.zones.every((q) => q.hit)) this.port.win(this.zones.every((q) => q.yellow));
  }
  winEffects(): void { this.port.knock('joao'); this.port.shake(); }
}

/** laço: segure para girar (o marcador vai e volta) e solte na faixa */
class Lasso extends Mechanic {
  override readonly markerHidden = true;
  private holding = false;
  private holdAt = 0;
  protected setup(): void { this.zones = [makeZone(this.L, 28, 94)]; this.deadline = this.period * 2.6; }
  override position(now: number): number { const k = ((now - this.holdAt) / this.period) % 2; return (k < 1 ? k : 2 - k) * 100; }
  override step(now: number): boolean {
    if (this.holding) { this.port.marker(this.position(now)); this.port.animCharge(Math.min(1, (now - this.holdAt) / this.period)); }
    return true;
  }
  press(now: number): void {
    if (this.holding) return;
    this.holding = true; this.holdAt = now; this.port.showMarker(); this.port.anim('spin'); this.port.sfx('whoosh');
    this.port.spin(true);
  }
  override release(now: number, gun: boolean): void {
    if (!this.holding) return;
    this.holding = false; this.port.spin(false);
    this.shootAt(now, gun);
  }
  winEffects(): void {
    this.port.anim('caught'); this.port.sfx('throw');
    this.port.later(() => this.port.sfx('snap'), 420); this.port.knock('joao', 420); this.port.later(() => this.port.shake(), 420);
  }
  override loseAnim(kind: LoseKind): void { this.port.anim(this.holding || kind === 'miss' ? 'fall' : 'wait'); this.holding = false; }
}

/** rolo de amassar pão: toque rápido para encher a raiva antes do João sacar */
class RollingPin extends Mechanic {
  override readonly meter = true;
  override readonly markerHidden = true;
  private charge = 0;
  protected setup(): void { this.zones = []; this.deadline = this.L.mashTime * Math.pow(this.L.speedUp, this.round - 1); }
  override step(_now: number, dt: number): boolean {
    this.charge = Math.max(0, this.charge - dt * 0.16);
    this.port.animCharge(this.charge); this.port.fill(this.charge);
    if (this.charge > 0) this.port.ensureAnim('wind');
    return true;
  }
  press(now: number, gun: boolean): void {
    const need = this.L.mashNeed * (gun ? 0.75 : 1);
    this.charge = Math.min(1, this.charge + 1 / need); this.port.animCharge(this.charge); this.port.fill(this.charge);
    this.port.ensureAnim('wind');
    this.port.sfx('tap');
    if (this.charge >= 1) this.port.win((now - this.t0) < this.deadline * 0.6);
  }
  winEffects(): void {
    this.port.anim('throw'); this.port.sfx('throw');
    this.port.later(() => this.port.sfx('bonk'), 360); this.port.knock('joao', 360); this.port.later(() => this.port.shake(), 360);
  }
  override loseAnim(): void { this.port.anim(this.charge > 0 ? 'drop' : 'wait'); }
}

/** rifle: um toque engatilha (a mira balança pela barra) e o seguinte dispara */
class Rifle extends Mechanic {
  override readonly markerHidden = true;
  private isCocked = false;
  private cockAt = 0;
  protected setup(): void { this.zones = [makeZone(this.L, 28, 94)]; this.deadline = this.period * 2.5; }
  override position(now: number): number { return (1 - Math.cos(Math.PI * (now - this.cockAt) / this.period)) * 50; }
  override step(now: number): boolean {
    if (this.isCocked) this.port.marker(this.position(now));
    return true;
  }
  press(now: number, gun: boolean): void {
    if (this.isCocked) { this.shootAt(now, gun); return; }
    this.isCocked = true; this.cockAt = now; this.port.showMarker(); this.port.anim('cock'); this.port.sfx('cock');
    this.port.cocked();
    this.port.later(() => { if (this.port.drawing()) this.port.anim('aim'); }, 280);
  }
  winEffects(): void { this.port.anim('fire'); this.port.sfx('rifle'); this.port.knock('joao'); this.port.shake(); }
}

const MECHANICS: Record<Weapon, new (port: DuelPort, L: Level, round: number) => Mechanic> = {
  revolver: Revolver, twin: Twin, lasso: Lasso, pin: RollingPin, rifle: Rifle,
};

/** a mecânica da arma para uma rodada (cada rodada começa do zero) */
export const createMechanic = (weapon: Weapon, port: DuelPort, L: Level, round: number): Mechanic => new MECHANICS[weapon](port, L, round);
