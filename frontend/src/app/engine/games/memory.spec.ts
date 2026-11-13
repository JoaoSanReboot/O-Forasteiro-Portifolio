import { Card, deal, MemoryGame } from './memory';

describe('jogo da memória', () => {
  it('dá os dois lados de cada par, embaralhados', () => {
    const deck = deal(6, () => 0.3);
    expect(deck).toHaveLength(12);
    for (let p = 0; p < 6; p++) expect(deck.filter((c) => c.pair === p).map((c) => c.side).sort()).toEqual([0, 1]);
    expect(deck.map((c) => c.pair)).not.toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('par certo fica aberto; par errado espera desvirar; nada vira com duas abertas', () => {
    const cards: Card[] = [{ pair: 0, side: 0 }, { pair: 1, side: 0 }, { pair: 0, side: 1 }, { pair: 1, side: 1 }];
    const g = new MemoryGame(cards);
    expect(g.flip(0)).toBe('first');
    expect(g.flip(0)).toBe('ignored');
    expect(g.flip(1)).toBe('miss');
    expect(g.flip(2)).toBe('ignored');
    g.hide();
    expect(g.flip(0)).toBe('first');
    expect(g.flip(2)).toBe('match');
    expect(g.faceUp(2)).toBe(true);
    expect(g.flip(2)).toBe('ignored');
    g.flip(1); g.flip(3);
    expect([g.done, g.moves]).toEqual([true, 3]);
  });
});
