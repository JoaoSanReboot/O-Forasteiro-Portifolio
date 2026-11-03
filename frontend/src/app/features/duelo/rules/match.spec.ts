import { KIT } from './kit';
import { LEVELS } from './levels';
import { DuelMatch, planRound } from './match';

describe('duelo: a partida', () => {
  it('acaba quando alguém chega às vitórias do nível', () => {
    const m = new DuelMatch('facil', LEVELS.facil);
    m.youWin(true); expect(m.over).toBe(false);
    m.joaoWins(); m.youWin(false);
    expect(m.over).toBe(true);
    expect(m.won).toBe(true);
    expect([m.hits, m.perfects]).toEqual([2, 1]);
  });

  it('o carimbo final: sem levar tiro, vitória e derrota', () => {
    const flawless = new DuelMatch('facil', LEVELS.facil);
    flawless.youWin(true); flawless.youWin(true);
    expect(flawless.title(KIT.revolver)).toBe(KIT.revolver.flawless);
    expect(flawless.summary(KIT.revolver)).toBe('Fácil: você 2 × 0 João. Tiros certeiros: 2. Na faixa amarela: 2. Que tal subir a dificuldade?');
    const lost = new DuelMatch('dificil', LEVELS.dificil);
    for (let i = 0; i < LEVELS.dificil.wins; i++) lost.joaoWins();
    expect(lost.title(KIT.lasso)).toBe(KIT.lasso.lose);
    expect(lost.summary(KIT.lasso)).not.toContain('subir a dificuldade');
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
