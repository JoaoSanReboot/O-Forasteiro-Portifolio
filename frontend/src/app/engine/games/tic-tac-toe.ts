// Jogo da velha no balcão: o visitante marca "x" (buracos de bala), o bartender "o" (ferraduras).
export type Mark = 'x' | 'o' | null;
export type Board = readonly Mark[];

export const LINES: readonly (readonly [number, number, number])[] = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

export const emptyBoard = (): Mark[] => Array<Mark>(9).fill(null);

export const winner = (c: Board): readonly [number, number, number] | undefined =>
  LINES.find((l) => c[l[0]] && c[l[0]] === c[l[1]] && c[l[1]] === c[l[2]]);

// o bartender joga direito, mas não é perfeito: dá para armar um garfo nele
export function barMove(cells: Board, random: () => number = Math.random): number {
  const free = cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  const closes = (mark: Mark) => free.find((i) => { const c = cells.slice(); c[i] = mark; return winner(c); });
  let m = closes('o');
  if (m === undefined) m = closes('x');
  if (m === undefined && !cells[4]) m = 4;
  if (m === undefined) { const corners = [0, 2, 6, 8].filter((i) => !cells[i]); const pool = corners.length ? corners : free; m = pool[Math.floor(random() * pool.length)]; }
  return m;
}
