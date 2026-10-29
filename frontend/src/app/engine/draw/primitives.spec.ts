import { fakeCtx, rects } from '../../../testing/fake-canvas';
import { disc, K, O, R } from './primitives';

describe('primitivas', () => {
  it('R arredonda para o pixel inteiro', () => {
    const g = fakeCtx();
    R(g, 1.4, 2.6, 3.5, 4.4, '#abc');
    expect(rects(g)).toEqual([['#abc', 1, 3, 4, 4]]);
  });

  it('O desenha o contorno antes da cor', () => {
    const g = fakeCtx();
    O(g, 10, 10, 4, 2, '#fff');
    expect(rects(g)).toEqual([[K, 9, 9, 6, 4], ['#fff', 10, 10, 4, 2]]);
  });

  it('disc preenche uma linha por y', () => {
    const g = fakeCtx();
    disc(g, 0, 0, 3, '#f00');
    expect(rects(g).map((r) => r[2])).toEqual([-3, -2, -1, 0, 1, 2, 3]);
    expect(rects(g)[3]).toEqual(['#f00', -3, 0, 7, 1]);
    const tiny = fakeCtx();
    disc(tiny, 5, 5, 0.3, '#f00');
    expect(rects(tiny)).toEqual([['#f00', 5, 5, 1, 1]]);
  });
});
