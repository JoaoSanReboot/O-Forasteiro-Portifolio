import { Rng } from './rng';

describe('Rng', () => {
  it('segue a sequência Park–Miller', () => {
    const r = new Rng(1);
    expect(r.next()).toBe(16807 / 2147483647);
    expect(r.seed).toBe(16807);
    expect(r.next()).toBe(282475249 / 2147483647);
  });

  it('reiniciar a semente repete a sequência', () => {
    const r = new Rng(17);
    const a = [r.next(), r.next(), r.next()];
    r.seed = 17;
    expect([r.next(), r.next(), r.next()]).toEqual(a);
  });
});
