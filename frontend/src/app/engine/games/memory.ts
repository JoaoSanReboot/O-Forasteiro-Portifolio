// O jogo da memória: o baralho embaralhado e o que acontece a cada carta virada.
// Cada par tem dois lados diferentes (lado 0 e lado 1) que se combinam pelo número do par.

export interface Card { readonly pair: number; readonly side: 0 | 1 }
export type Flip = 'first' | 'match' | 'miss' | 'ignored';

/** o baralho com `pairs` pares, embaralhado (Fisher–Yates) */
export function deal(pairs: number, rand: () => number = Math.random): Card[] {
  const deck: Card[] = [];
  for (let pair = 0; pair < pairs; pair++) deck.push({ pair, side: 0 }, { pair, side: 1 });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export class MemoryGame {
  /** os pares já achados */
  readonly found = new Set<number>();
  /** as cartas viradas que ainda não formaram par (no máximo duas) */
  open: number[] = [];
  /** quantas duplas de cartas foram viradas */
  moves = 0;

  constructor(readonly cards: readonly Card[]) {}

  get pairs(): number { return this.cards.length / 2; }
  get done(): boolean { return this.found.size === this.pairs; }

  faceUp(i: number): boolean { return this.open.includes(i) || this.found.has(this.cards[i].pair); }

  /** vira a carta `i`; com duas viradas diferentes, elas ficam abertas até `hide()` */
  flip(i: number): Flip {
    if (this.open.length === 2 || this.faceUp(i) || !this.cards[i]) return 'ignored';
    this.open.push(i);
    if (this.open.length === 1) return 'first';
    this.moves++;
    const [a, b] = this.open;
    if (this.cards[a].pair !== this.cards[b].pair) return 'miss';
    this.found.add(this.cards[a].pair);
    this.open = [];
    return 'match';
  }

  /** desvira o par errado */
  hide(): void { this.open = []; }
}
