import { posDoBau } from './projetos';

describe('posDoBau', () => {
  it('com três baús: um no meio e um em cada canto, dando a volta na fila', () => {
    expect([0, 1, 2].map((i) => posDoBau(i, 0, 3))).toEqual(['meio', 'dir', 'esq']);
    expect([0, 1, 2].map((i) => posDoBau(i, 2, 3))).toEqual(['dir', 'esq', 'meio']);
  });

  it('com mais de três, os que sobram ficam guardados', () => {
    expect([0, 1, 2, 3, 4].map((i) => posDoBau(i, 0, 5))).toEqual(['meio', 'dir', 'fora', 'fora', 'esq']);
  });
});
