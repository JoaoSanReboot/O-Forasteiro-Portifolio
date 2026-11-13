// A caçada: os bandidos em fila, um por rodada. Acertou, ele vai preso e vem o próximo;
// errou, ele foge e você perde um chapéu. Acaba com todos presos ou sem chapéu.

export class Hunt {
  round = 0;
  caught = 0;
  escapes = 0;
  /** prisões na faixa amarela */
  perfects = 0;

  constructor(readonly total: number, readonly lives = 3) {}

  nextRound(): void { this.round++; }
  capture(yellow: boolean): void { this.caught++; if (yellow) this.perfects++; }
  escape(): void { this.escapes++; }

  /** o bandido da vez (índice na fila) */
  get current(): number { return Math.min(this.caught, this.total - 1); }
  get livesLeft(): number { return this.lives - this.escapes; }
  get over(): boolean { return this.won || this.livesLeft === 0; }
  get won(): boolean { return this.caught === this.total; }

  summary(): string {
    if (this.won) return this.escapes === 0 ? 'Todos presos sem perder um chapéu. O sertão vai falar disso por anos.' : `Todos presos, com ${this.perfects} prisões na faixa amarela. O sertão está em paz.`;
    return `${this.caught} de ${this.total} presos. O resto fugiu pela caatinga.`;
  }
}

/**
 * quanto o sino demora (ms) e quando o bandido tenta enganar (ms desde o início da rodada):
 * na primeira rodada às vezes nenhum blefe; depois, um ou dois
 */
export function planRound(round: number, rand: () => number = Math.random): { wait: number; bluffs: number[] } {
  const wait = 1800 + rand() * 2600;
  const n = round === 1 ? (rand() < 0.5 ? 1 : 0) : 1 + (rand() < 0.4 ? 1 : 0);
  const bluffs: number[] = [];
  for (let i = 0; i < n; i++) bluffs.push(500 + rand() * (wait - 900));
  return { wait, bluffs };
}
