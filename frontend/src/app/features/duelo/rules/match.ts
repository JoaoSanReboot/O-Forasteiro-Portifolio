import { Kit } from './kit';
import { Level, LevelId } from './levels';

// A partida: o placar rodada a rodada, quando ela acaba e o que o carimbo final diz

export class DuelMatch {
  round = 0;
  you = 0;
  joao = 0;
  /** rodadas que o visitante venceu */
  hits = 0;
  /** dessas, quantas na faixa amarela */
  perfects = 0;

  constructor(readonly levelId: LevelId, readonly level: Level) {}

  nextRound(): void { this.round++; }
  youWin(yellow: boolean): void { this.you++; this.hits++; if (yellow) this.perfects++; }
  joaoWins(): void { this.joao++; }

  get over(): boolean { return this.you === this.level.wins || this.joao === this.level.wins; }
  get won(): boolean { return this.you === this.level.wins; }

  /** título do fim: sem levar tiro, vitória ou derrota (cada arma tem as suas palavras) */
  title(kit: Kit): string { return this.won && this.joao === 0 ? kit.flawless : this.won ? kit.win : kit.lose; }

  summary(kit: Kit): string {
    return `${this.level.name}: você ${this.you} × ${this.joao} João. ${kit.unit}: ${this.hits}. Na faixa amarela: ${this.perfects}.`
      + (this.won && this.levelId !== 'dificil' ? ' Que tal subir a dificuldade?' : '');
  }
}

/**
 * quanto o sino demora (ms) e quando o João tenta enganar (ms desde o início da rodada):
 * na primeira rodada às vezes nenhum blefe; depois, um ou dois
 */
export function planRound(round: number, rand: () => number = Math.random): { wait: number; bluffs: number[] } {
  const wait = 1800 + rand() * 2600;
  const n = round === 1 ? (rand() < 0.5 ? 1 : 0) : 1 + (rand() < 0.4 ? 1 : 0);
  const bluffs: number[] = [];
  for (let i = 0; i < n; i++) bluffs.push(500 + rand() * (wait - 900));
  return { wait, bluffs };
}
