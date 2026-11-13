import { Weapon } from './kit';
import { LEVEL } from './levels';
import { createMechanic, DuelPort, LoseKind, Mechanic } from './mechanics';

// porta falsa: grava o que a mecânica pediu, na ordem
function fakePort() {
  const calls: string[] = [];
  const result: { win?: boolean; lose?: LoseKind } = {};
  let level = 0;
  const port: DuelPort = {
    marker: () => undefined,
    showMarker: () => calls.push('showMarker'),
    charge: (k) => { level = k; },
    zonesChanged: () => calls.push('zonesChanged'),
    shot: () => calls.push('shot'),
    cocked: () => calls.push('cocked'),
    spin: (on) => calls.push(`spin:${on}`),
    win: (yellow) => { result.win = yellow; },
    lose: (kind) => { result.lose = kind; },
  };
  return { port, calls, result, level: () => level };
}

/** monta a mecânica com as faixas sempre no meio do intervalo (aleatório fixo) e o sino em t = 1000 */
function armed(weapon: Weapon, round = 1) {
  const f = fakePort();
  const L = LEVEL;
  const rand = Math.random;
  Math.random = () => 0.5;
  let m: Mechanic;
  try { m = createMechanic(weapon, f.port, L, round); m.arm(1000); } finally { Math.random = rand; }
  return { ...f, m, L };
}

/** instante em que o marcador linear passa pela posição `pct` */
const at = (m: Mechanic, L: { period: number }, pct: number, scale = 1) => m.t0 + (pct / 100) * L.period * scale;

describe('duelo: mecânica de cada arma', () => {
  it('revólver: na faixa amarela vence com perfeito; fora dela erra', () => {
    const { m, L, result } = armed('revolver');
    m.press(at(m, L, m.zones[0].mid), false);
    expect(result.win).toBe(true);
    const other = armed('revolver');
    other.m.press(at(other.m, other.L, 5), false);
    expect(other.result.lose).toBe('miss');
  });

  it('revólver: a faixa vermelha só vale com o revólver aprimorado', () => {
    const a = armed('revolver');
    a.m.press(at(a.m, a.L, a.m.zones[0].s + 1), true);
    expect(a.result.win).toBe(false);
    const b = armed('revolver');
    b.m.press(at(b.m, b.L, b.m.zones[0].s + 1), false);
    expect(b.result.lose).toBe('miss');
  });

  it('revólver: o marcador chega ao fim e o bandido saca (lento)', () => {
    const { m, L, result } = armed('revolver');
    expect(m.step(at(m, L, 99), 0.016)).toBe(true);
    expect(m.step(at(m, L, 100), 0.016)).toBe(false);
    expect(result.lose).toBe('slow');
  });

  it('a cada rodada o marcador fica mais rápido', () => {
    const r1 = armed('revolver', 1), r3 = armed('revolver', 3);
    expect(r3.m.deadline).toBeCloseTo(r1.m.deadline * LEVEL.speedUp ** 2);
  });

  it('duas pistolas: precisa acertar as duas faixas na mesma passada', () => {
    const { m, L, result, calls } = armed('twin');
    m.press(at(m, L, m.zones[0].mid, 1.3), false);
    expect(calls).toEqual(['zonesChanged', 'shot']);
    expect(result.win).toBeUndefined();
    m.press(at(m, L, m.zones[1].mid, 1.3), false);
    expect(result.win).toBe(true);
  });

  it('laço: segura para girar e vale o momento de soltar', () => {
    const { m, L, result, calls } = armed('lasso');
    m.press(1000, false);
    expect(calls).toEqual(['showMarker', 'spin:true']);
    m.release(1000 + (m.zones[0].mid / 100) * L.period, false);
    expect(calls).toContain('spin:false');
    expect(result.win).toBe(true);
  });

  it('rolo: os toques enchem a raiva e, cheia, ganha a rodada', () => {
    const { m, L, result, level } = armed('pin');
    for (let i = 0; i < L.mashNeed - 1; i++) m.press(1100, false);
    expect(level()).toBeCloseTo((L.mashNeed - 1) / L.mashNeed);
    expect(result.win).toBeUndefined();
    m.press(1100, false);
    expect(result.win).toBe(true);
  });

  it('rifle: o primeiro toque engatilha e o segundo dispara', () => {
    const { m, result, calls } = armed('rifle');
    m.press(1000, false);
    expect(calls).toEqual(['showMarker', 'cocked']);
    expect(result.win).toBeUndefined();
    m.press(1000, false);
    expect(result.lose).toBe('miss');
  });
});
