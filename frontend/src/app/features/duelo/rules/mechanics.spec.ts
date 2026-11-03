import { Weapon } from '../../../engine/heroes/heroes';
import { LEVELS } from './levels';
import { createMechanic, DuelPort, LoseKind, Mechanic } from './mechanics';

// porta falsa: grava o que a mecânica pediu, na ordem
function fakePort() {
  const calls: string[] = [];
  const result: { win?: boolean; lose?: LoseKind } = {};
  const timers: (() => void)[] = [];
  let drawing = true;
  const log = (s: string) => () => { calls.push(s); };
  const port: DuelPort = {
    anim: (m) => calls.push(`anim:${m}`),
    ensureAnim: (m) => calls.push(`ensure:${m}`),
    animCharge: () => undefined,
    twinShot: log('twinShot'),
    sfx: (n) => calls.push(`sfx:${n}`),
    marker: () => undefined,
    showMarker: log('showMarker'),
    fill: () => undefined,
    zonesChanged: log('zonesChanged'),
    cocked: log('cocked'),
    spin: (on) => calls.push(`spin:${on}`),
    knock: (t, d = 0) => calls.push(`knock:${t}:${d}`),
    shake: log('shake'),
    later: (fn) => { timers.push(fn); },
    drawing: () => drawing,
    win: (yellow) => { result.win = yellow; },
    lose: (kind) => { result.lose = kind; },
  };
  return { port, calls, result, timers, stopDrawing: () => { drawing = false; } };
}

/** monta a mecânica com as faixas sempre no meio do intervalo (aleatório fixo) e o sino em t = 1000 */
function armed(weapon: Weapon, round = 1) {
  const f = fakePort();
  const L = LEVELS.normal;
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

  it('revólver: o marcador chega ao fim e o João saca (lento)', () => {
    const { m, L, result } = armed('revolver');
    expect(m.step(at(m, L, 99), 0.016)).toBe(true);
    expect(m.step(at(m, L, 100), 0.016)).toBe(false);
    expect(result.lose).toBe('slow');
  });

  it('a cada rodada o marcador fica mais rápido', () => {
    const r1 = armed('revolver', 1), r3 = armed('revolver', 3);
    expect(r3.m.deadline).toBeCloseTo(r1.m.deadline * LEVELS.normal.speedUp ** 2);
  });

  it('duas pistolas: precisa acertar as duas faixas na mesma passada', () => {
    const { m, L, result, calls } = armed('twin');
    expect(m.zones).toHaveLength(2);
    m.press(at(m, L, m.zones[0].mid, 1.3), false);
    expect(result.win).toBeUndefined();
    expect(calls).toEqual(['twinShot', 'sfx:shot', 'zonesChanged']);
    m.press(at(m, L, m.zones[1].mid, 1.3), false);
    expect(result.win).toBe(true);
  });

  it('laço: segura para girar, solta na faixa; ao perder, a pose depende de estar girando', () => {
    const { m, L, result, calls } = armed('lasso');
    expect(m.markerHidden).toBe(true);
    m.press(2000, false);
    expect(calls).toEqual(['showMarker', 'anim:spin', 'sfx:whoosh', 'spin:true']);
    // vai e volta: em meio período o marcador está no meio, em um período inteiro está no fim
    expect(m.position(2000 + L.period / 2)).toBeCloseTo(50);
    expect(m.position(2000 + L.period * 1.5)).toBeCloseTo(50);
    m.release(2000 + (m.zones[0].mid / 100) * L.period, false);
    expect(calls).toContain('spin:false');
    expect(result.win).toBe(true);
    const missed = armed('lasso');
    missed.m.press(2000, false);
    missed.m.loseAnim('slow');
    expect(missed.calls.at(-1)).toBe('anim:fall');
  });

  it('rolo: cada toque enche a raiva; cheia, o rolo voa (perfeito se foi rápido)', () => {
    const { m, L, result } = armed('pin');
    expect(m.meter).toBe(true);
    for (let i = 0; i < L.mashNeed - 1; i++) m.press(1100 + i, false);
    expect(result.win).toBeUndefined();
    m.press(1200, false);
    expect(result.win).toBe(true);
    // com o revólver aprimorado precisa de menos toques
    const gun = armed('pin');
    for (let i = 0; i < Math.ceil(L.mashNeed * 0.75); i++) gun.m.press(1100 + i, true);
    expect(gun.result.win).toBe(true);
  });

  it('rolo: a raiva escorre com o tempo', () => {
    const { m, calls } = armed('pin');
    m.press(1100, false);
    m.step(1200, 0.05);
    expect(calls).toContain('ensure:wind');
    m.loseAnim('slow');
    expect(calls.at(-1)).toBe('anim:drop');
  });

  it('rifle: o primeiro toque engatilha, o segundo dispara na mira', () => {
    const { m, L, result, calls, timers, stopDrawing } = armed('rifle');
    m.press(2000, false);
    expect(calls).toEqual(['showMarker', 'anim:cock', 'sfx:cock', 'cocked']);
    expect(result.win).toBeUndefined();
    // a mira só vira "aim" se a rodada ainda estiver aberta
    stopDrawing(); timers[0](); expect(calls).not.toContain('anim:aim');
    // a mira balança: 0 → 100 → 0 em dois períodos
    expect(m.position(2000)).toBeCloseTo(0);
    expect(m.position(2000 + L.period)).toBeCloseTo(100);
    const k = Math.acos(1 - m.zones[0].mid / 50) / Math.PI;
    m.press(2000 + k * L.period, false);
    expect(result.win).toBe(true);
  });

  it('a vitória aparece na cena do jeito de cada arma', () => {
    const lasso = armed('lasso');
    lasso.m.winEffects();
    expect(lasso.calls).toEqual(['anim:caught', 'sfx:throw', 'knock:joao:420']);
    expect(lasso.timers).toHaveLength(2);
    const rifle = armed('rifle');
    rifle.m.winEffects();
    expect(rifle.calls).toEqual(['anim:fire', 'sfx:rifle', 'knock:joao:0', 'shake']);
  });
});
