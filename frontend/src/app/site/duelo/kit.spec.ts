import { judge, LEVELS, makeZone } from './kit';

describe('duelo: faixas da barra', () => {
  const z = makeZone(LEVELS.normal, 30, 94, () => 0.5);

  it('a faixa fica dentro do intervalo pedido', () => {
    expect(z.s).toBe(30 + 0.5 * (94 - 30 - 20));
    expect(z.mid).toBe(z.s + 10);
  });

  it('amarela vale sempre; vermelha só com o revólver aprimorado', () => {
    expect(judge(z.mid, z, false)).toBe('yellow');
    expect(judge(z.s + 1, z, false)).toBeNull();
    expect(judge(z.s + 1, z, true)).toBe('red');
    expect(judge(z.s + z.w + 5, z, true)).toBeNull();
  });
});
