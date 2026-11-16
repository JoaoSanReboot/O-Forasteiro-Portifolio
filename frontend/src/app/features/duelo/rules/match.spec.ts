import { Hunt, planRound } from './match';

describe('duelo: a caçada', () => {
  it('prende um bandido por acerto e acaba com todos presos', () => {
    const h = new Hunt(3);
    h.capture(true); expect(h.current).toBe(1);
    h.escape(); h.capture(false);
    expect(h.over).toBe(false);
    h.capture(true);
    expect([h.over, h.won, h.perfects, h.livesLeft]).toEqual([true, true, 2, 2]);
    expect(h.summary()).toContain('Todos presos');
  });

  it('sem chapéu a caçada acaba e conta quantos ficaram presos', () => {
    const h = new Hunt(4, 2);
    h.capture(true); h.escape(); h.escape();
    expect([h.over, h.won]).toEqual([true, false]);
    expect(h.summary()).toBe('1 de 4 presos. O resto fugiu pela caatinga.');
  });

  it('o sino toca entre 1,8 s e 4,4 s; os blefes vêm antes dele', () => {
    const seq = [0.25, 0.1, 0.5, 0.9];
    const plan = planRound(2, () => seq.shift()!);
    expect(plan.wait).toBe(1800 + 0.25 * 2600);
    expect(plan.bluffs).toHaveLength(2);
    expect(Math.max(...plan.bluffs)).toBeLessThan(plan.wait);
    // na primeira rodada pode não ter blefe
    expect(planRound(1, () => 0.9).bluffs).toEqual([]);
  });
});
