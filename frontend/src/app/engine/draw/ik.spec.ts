import { armIK, armIKkeep, ElbowMemory, ik } from './ik';

const len = (a: readonly number[], b: readonly number[]) => Math.hypot(b[0] - a[0], b[1] - a[1]);

describe('braços (ik)', () => {
  it('mantém o tamanho do braço e do antebraço', () => {
    const [s, e, h] = ik(0, 0, 12, 8, 11, 11, 1);
    expect(len(s, e)).toBeCloseTo(11, 6);
    expect(len(e, h)).toBeCloseTo(11, 6);
  });

  it('mão longe demais é trazida para o alcance', () => {
    const [s, , h] = ik(0, 0, 100, 0, 11, 11, 1);
    expect(len(s, h)).toBeCloseTo(21.99, 2);
  });

  it('armIK dobra o cotovelo para baixo', () => {
    const [, e] = armIK(0, 0, 10, 0, 11, 11, 1);
    expect(e[1]).toBeGreaterThan(0);
  });

  it('armIKkeep lembra o cotovelo entre quadros', () => {
    const mem: ElbowMemory = {};
    const first = armIKkeep(mem, 0, 0, 10, 0, 11, 11, 1);
    expect(mem.e).toEqual(first[1]);
    const next = armIKkeep(mem, 0, 0, 10, -1, 11, 11, -1);
    expect(Math.sign(next[1][1])).toBe(Math.sign(first[1][1]));
  });
});
