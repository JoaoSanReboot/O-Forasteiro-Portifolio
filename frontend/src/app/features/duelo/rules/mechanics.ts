import { Weapon } from './kit';
import { Level } from './levels';
import { judge, makeZone, Zone } from './zones';

// A mecânica de cada arma depois do sino: onde o marcador está, o que um toque (ou soltar) faz e
// quando a rodada se perde por tempo. Nada aqui conhece o DOM ou o Angular: o que precisa aparecer
// na tela passa pela DuelPort (o componente do duelo é quem desenha).

export type LoseKind = 'slow' | 'miss';

/** o que a mecânica pede para a interface */
export interface DuelPort {
  /** posição do marcador na barra, em % */
  marker(pct: number): void;
  showMarker(): void;
  /** a barra de raiva (rolo) ou a força do laço girando, de 0 a 1 */
  charge(k: number): void;
  /** as faixas mudaram (uma pistola acertou a dela) */
  zonesChanged(): void;
  /** um disparo que não encerra a rodada (a primeira das duas pistolas) */
  shot(): void;
  /** o rifle foi engatilhado: o botão e a dica passam para o disparo */
  cocked(): void;
  /** o laço começou (ou parou) de girar */
  spin(on: boolean): void;
  win(yellow: boolean): void;
  lose(kind: LoseKind): void;
}

export abstract class Mechanic {
  /** início da contagem (o sino) */
  t0 = 0;
  /** quanto o marcador leva para percorrer a barra (ms) */
  protected period = 0;
  /** passou disso sem acertar, o bandido saca (ms desde o sino) */
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
  step(now: number, _dt: number): boolean {
    if (now - this.t0 >= this.deadline) { this.port.lose('slow'); return false; }
    return true;
  }

  /** apertou (ou tocou) com a rodada aberta */
  abstract press(now: number, gun: boolean): void;

  /** soltou: só o laço usa (é aí que ele voa) */
  release(_now: number, _gun: boolean): void { /* só o laço */ }

  /** tiro único: amarela, vermelha (com o revólver aprimorado) ou errou */
  protected shootAt(now: number, gun: boolean): void {
    const r = judge(this.position(now), this.zones[0], gun);
    if (r) this.port.win(r === 'yellow'); else this.port.lose('miss');
  }
}

/** revólver: o marcador corre a barra uma vez; atire na faixa */
class Revolver extends Mechanic {
  protected setup(): void { this.zones = [makeZone(this.L, 30, 94)]; this.deadline = this.period; }
  override step(now: number, dt: number): boolean {
    this.port.marker(Math.min(this.position(now), 100));
    return super.step(now, dt);
  }
  press(now: number, gun: boolean): void { this.shootAt(now, gun); }
}

/** duas pistolas: duas faixas na mesma passada, um disparo para cada */
class Twin extends Mechanic {
  protected setup(): void { this.zones = [makeZone(this.L, 18, 50), makeZone(this.L, 58, 94)]; this.period *= 1.3; this.deadline = this.period; }
  override step(now: number, dt: number): boolean {
    this.port.marker(Math.min(this.position(now), 100));
    return super.step(now, dt);
  }
  press(now: number, gun: boolean): void {
    const a = this.position(now);
    const z = this.zones.find((q) => !q.hit && judge(a, q, gun));
    if (!z) { this.port.lose('miss'); return; }
    z.hit = true; z.yellow = judge(a, z, gun) === 'yellow';
    this.port.zonesChanged();
    if (this.zones.every((q) => q.hit)) this.port.win(this.zones.every((q) => q.yellow));
    else this.port.shot();
  }
}

/** laço: segure para girar (o marcador vai e volta) e solte na faixa */
class Lasso extends Mechanic {
  override readonly markerHidden = true;
  private holding = false;
  private holdAt = 0;
  protected setup(): void { this.zones = [makeZone(this.L, 28, 94)]; this.deadline = this.period * 2.6; }
  override position(now: number): number { const k = ((now - this.holdAt) / this.period) % 2; return (k < 1 ? k : 2 - k) * 100; }
  override step(now: number, dt: number): boolean {
    if (this.holding) { this.port.marker(this.position(now)); this.port.charge(Math.min(1, (now - this.holdAt) / this.period)); }
    return super.step(now, dt);
  }
  press(now: number): void {
    if (this.holding) return;
    this.holding = true; this.holdAt = now;
    this.port.showMarker(); this.port.spin(true);
  }
  override release(now: number, gun: boolean): void {
    if (!this.holding) return;
    this.holding = false; this.port.spin(false);
    this.shootAt(now, gun);
  }
}

/** rolo de amassar pão: toque rápido para encher a raiva antes de o bandido sacar */
class RollingPin extends Mechanic {
  override readonly meter = true;
  override readonly markerHidden = true;
  private level = 0;
  protected setup(): void { this.zones = []; this.deadline = this.L.mashTime * Math.pow(this.L.speedUp, this.round - 1); }
  override step(now: number, dt: number): boolean {
    this.level = Math.max(0, this.level - dt * 0.16);
    this.port.charge(this.level);
    return super.step(now, dt);
  }
  press(now: number, gun: boolean): void {
    const need = this.L.mashNeed * (gun ? 0.75 : 1);
    // a folga evita que a soma de frações (10 × 0,1) pare em 0,999...
    this.level = Math.min(1, this.level + 1 / need + 1e-9);
    this.port.charge(this.level);
    if (this.level >= 1) this.port.win(now - this.t0 < this.deadline * 0.6);
  }
}

/** rifle: um toque engatilha (a mira balança pela barra) e o seguinte dispara */
class Rifle extends Mechanic {
  override readonly markerHidden = true;
  private isCocked = false;
  private cockAt = 0;
  protected setup(): void { this.zones = [makeZone(this.L, 28, 94)]; this.deadline = this.period * 2.5; }
  override position(now: number): number { return (1 - Math.cos((Math.PI * (now - this.cockAt)) / this.period)) * 50; }
  override step(now: number, dt: number): boolean {
    if (this.isCocked) this.port.marker(this.position(now));
    return super.step(now, dt);
  }
  press(now: number, gun: boolean): void {
    if (this.isCocked) { this.shootAt(now, gun); return; }
    this.isCocked = true; this.cockAt = now;
    this.port.showMarker(); this.port.cocked();
  }
}

const MECHANICS: Record<Weapon, new (port: DuelPort, L: Level, round: number) => Mechanic> = {
  revolver: Revolver, twin: Twin, lasso: Lasso, pin: RollingPin, rifle: Rifle,
};

/** a mecânica da arma para uma rodada (cada rodada começa do zero) */
export const createMechanic = (weapon: Weapon, port: DuelPort, L: Level, round: number): Mechanic => new MECHANICS[weapon](port, L, round);
