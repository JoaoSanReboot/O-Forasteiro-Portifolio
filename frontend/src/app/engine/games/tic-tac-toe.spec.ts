import { barMove, emptyBoard, Mark, winner } from './tic-tac-toe';

const board = (s: string): Mark[] => [...s].map((c) => (c === 'x' || c === 'o' ? c : null));

describe('jogo da velha', () => {
  it('acha a linha vencedora', () => {
    expect(winner(board('xxx......'))).toEqual([0, 1, 2]);
    expect(winner(board('o...o...o'))).toEqual([0, 4, 8]);
    expect(winner(emptyBoard())).toBeUndefined();
  });

  it('o bartender fecha a própria linha antes de bloquear', () => {
    expect(barMove(board('oo.xx....'))).toBe(2);
  });

  it('bloqueia a linha do visitante', () => {
    expect(barMove(board('xx..o....'))).toBe(2);
  });

  it('pega o meio livre, senão um canto', () => {
    expect(barMove(board('x........'))).toBe(4);
    expect(barMove(board('....x....'), () => 0)).toBe(0);
    expect(barMove(board('....x....'), () => 0.99)).toBe(8);
  });
});
