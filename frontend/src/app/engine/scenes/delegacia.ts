import { Ctx } from '../core/canvas';
import { mixColor } from '../core/color';
import { clamp, lerp } from '../core/math';
import { SH, SW } from '../core/stage';
import { armIK } from '../draw/ik';
import { disc, K, limb, O, R, seg, sparkle } from '../draw/primitives';
import { head, Person, torso } from '../figures/people';
import { floorBoards, planksV, sign } from '../figures/props';
import { tinyText } from '../text/tiny-font';
import { SceneDef } from './scene';

/** [x, base, largura, altura máxima, começa em (fração do dia), camada] */
type Pile = readonly [number, number, number, number, number, 'mid' | 'fg'];
type Phase = { name: 'day' | 'dusk' | 'night' | 'out' | 'dawn'; k: number; c: number };

// ---------- III · Delegacia ----------
// Um dia inteiro (uns 9 minutos): o xerife carimba folha por folha e joga cada uma numa pilha,
// os papéis tomam a sala, anoitece, ele dorme na papelada, o lampião apaga e o dia amanhece com a sala arrumada.
export function createDelegacia(): SceneDef {
  const FY = 116;
  const sheriff: Person = { skin: '#d6a07a', skinD: '#a8735a', hair: '#5a4a3a', hairH: 2, stache: '#8a7a6a', brow: '#5a4a3a', hat: '#9a6a3c', band: '#5a3820', shirt: '#e8dcc4', vest: '#6e4426', badge: true, blinkOff: 2.2 };
  const PILES: readonly Pile[] = [
    [75, 83, 14, 30, 0.00, 'mid'], [149, 83, 12, 33, 0.03, 'mid'],
    [24, 116, 16, 46, 0.18, 'mid'], [44, 116, 12, 36, 0.32, 'mid'], [176, 116, 16, 52, 0.12, 'mid'], [196, 116, 12, 40, 0.26, 'mid'],
    [16, 146, 20, 58, 0.22, 'fg'], [40, 138, 14, 42, 0.48, 'fg'], [70, 148, 22, 34, 0.36, 'fg'], [104, 142, 16, 24, 0.62, 'fg'],
    [136, 147, 18, 36, 0.44, 'fg'], [168, 140, 16, 50, 0.28, 'fg'], [196, 148, 20, 62, 0.16, 'fg'], [228, 136, 14, 44, 0.54, 'fg'],
    [252, 147, 20, 60, 0.34, 'fg'], [280, 140, 16, 52, 0.58, 'fg'], [306, 148, 20, 66, 0.42, 'fg'],
  ];
  const WANTED: readonly (readonly [number, number, string, string])[] = [[60, 10, 'NULLREF', '$500'], [104, 13, 'DEADLOCK', '$900']];

  function back(g: Ctx): void {
    planksV(g, 0, 0, SW, FY, '#c9a272', '#a8804e', 9);
    R(g, 0, 84, SW, 32, '#a8804e'); for (let y = 88; y < 116; y += 6) R(g, 0, y, SW, 1, '#8a6038'); R(g, 0, 84, SW, 2, '#6e4426');
    R(g, 0, 0, SW, 5, '#6e4426');
    floorBoards(g, FY, '#8a6040', '#6e4a30');
    O(g, 13, 19, 42, 40, '#4a3020');
    // cartazes de procurado (dá para ler)
    WANTED.forEach(([x, y, nome, valor], i) => {
      O(g, x, y, 40, 42, '#f0dcb0');
      R(g, x, y, 40, 1, '#d8c090'); R(g, x + 39, y, 1, 42, '#c8ac78'); R(g, x, y + 41, 40, 1, '#c8ac78');
      R(g, x + 19, y - 1, 2, 2, '#6a6662');
      tinyText(g, 'PROCURADO', x + 20, y + 3, '#2b1a10', true);
      R(g, x + 3, y + 9, 34, 1, '#8a6a4a');
      // retrato do bug
      R(g, x + 12, y + 11, 16, 12, '#e4cc9c');
      O(g, x + 15, y + 14, 10, 7, '#2a3a2a'); R(g, x + 16, y + 15, 3, 1, '#5a7a4a'); R(g, x + 20, y + 14, 1, 7, K);
      R(g, x + 15, y + 12, 1, 2, K); R(g, x + 24, y + 12, 1, 2, K); R(g, x + 14, y + 17, 1, 1, '#c0392b'); R(g, x + 25, y + 17, 1, 1, '#c0392b');
      tinyText(g, nome, x + 20, y + 26, '#8a2a20', true);
      tinyText(g, valor, x + 20, y + 33, '#2b1a10', true);
      if (i) { disc(g, x + 34, y + 21, 1.5, '#3a2418'); R(g, x + 33, y + 20, 1, 1, '#b08a58'); }
    });
    O(g, 168, 12, 18, 40, '#6e4426'); disc(g, 177, 20, 5, K); disc(g, 177, 20, 4, '#f3e3c3'); O(g, 171, 30, 12, 18, '#3a2418');
    R(g, 214, 6, 106, 110, '#4e443c');
    for (let y = 12, r = 0; y < 116; y += 9, r++) for (let x = 214 + (r % 2) * 9; x < SW; x += 18) R(g, x, y, 1, 8, '#443a33');
    for (let y = 12; y < 116; y += 9) R(g, 214, y, 106, 1, '#443a33');
    R(g, 214, 108, 106, 8, '#5a5048');
    O(g, 280, 98, 36, 6, '#6e4426'); R(g, 282, 96, 32, 3, '#7a3a2a');
    O(g, 226, 106, 8, 10, '#6a6662');
    O(g, 92, 56, 26, 34, '#5a3820'); R(g, 94, 58, 22, 3, '#6e4426');
  }

  function front(g: Ctx): void {
    O(g, 60, 88, 96, 28, '#6e4426');
    R(g, 66, 92, 40, 20, '#5a3820'); R(g, 110, 92, 40, 20, '#5a3820'); R(g, 84, 100, 4, 2, '#c0a060'); R(g, 128, 100, 4, 2, '#c0a060');
    O(g, 56, 84, 104, 4, '#8a5a34'); R(g, 56, 84, 104, 1, '#b07a48');
    O(g, 95, 95, 26, 8, '#c0902a'); R(g, 95, 95, 26, 1, '#e8c060'); tinyText(g, 'XERIFE', 108, 97, '#3a2418', true);
    for (let x = 216; x < SW; x += 11) { R(g, x, 6, 2, 110, K); R(g, x, 6, 1, 110, '#6a6662'); }
    O(g, 214, 12, 106, 3, '#4a4644'); O(g, 214, 60, 106, 3, '#4a4644'); O(g, 214, 110, 106, 3, '#4a4644');
    sign(g, 266, 0, 'BUGS');
  }

  // ---- o expediente: uma folha por vez ----
  // cada folha: pega, carimba, joga numa pilha. A cada 24 folhas, uma pausa para o café.
  const LT = 3, STAMP = 1.9, BLOCK = 24, BREAK = 7;
  const SEQ: [number, number][] = [];
  PILES.forEach((P, i) => { const n = Math.floor(P[3] / LT); for (let j = 0; j < n; j++) SEQ.push([P[4] + (j / n) * (1 - P[4]) + i * 1e-4, i]); });
  SEQ.sort((a, b) => a[0] - b[0]);
  const ORDER = SEQ.map((s) => s[1]);
  const N = ORDER.length;
  const BLOCKT = BLOCK * STAMP + BREAK;
  const DAY = N * STAMP + (Math.ceil(N / BLOCK) - 1) * BREAK + 4;
  const DUSK = 26, NIGHT = 32, OUT = 3, DAWN = 10;
  const CYCLE = DAY + DUSK + NIGHT + OUT + DAWN;
  function phaseOf(t: number): Phase {
    const c = t % CYCLE;
    if (c < DAY) return { name: 'day', k: c / DAY, c };
    if (c < DAY + DUSK) return { name: 'dusk', k: (c - DAY) / DUSK, c };
    if (c < DAY + DUSK + NIGHT) return { name: 'night', k: (c - DAY - DUSK) / NIGHT, c };
    if (c < DAY + DUSK + NIGHT + OUT) return { name: 'out', k: (c - DAY - DUSK - NIGHT) / OUT, c };
    return { name: 'dawn', k: (c - DAY - DUSK - NIGHT - OUT) / DAWN, c };
  }
  function work(ph: Phase): { n: number; p: number; brk: number } {
    if (ph.name === 'dawn') return { n: 0, p: -1, brk: -1 };
    if (ph.name !== 'day') return { n: N, p: -1, brk: -1 };
    const c = ph.c, b = Math.floor(c / BLOCKT), r = c - b * BLOCKT;
    if (r < BLOCK * STAMP) {
      const i = b * BLOCK + Math.floor(r / STAMP);
      if (i >= N) return { n: N, p: -1, brk: -1 };
      return { n: i, p: (r % STAMP) / STAMP, brk: -1 };
    }
    return { n: Math.min(N, (b + 1) * BLOCK), p: -1, brk: (r - BLOCK * STAMP) / BREAK };
  }
  const SKY = {
    day: ['#9ac8e8', '#bcdcf0', '#e0ecf0'], dusk: ['#e8884a', '#f2a65a', '#f6c47a'],
    night: ['#141c34', '#1e2a4a', '#2a3658'], dawn: ['#e8a0a0', '#f2b890', '#f6d4a0'],
  };
  function counts(n: number): number[] { const c = new Array<number>(PILES.length).fill(0); for (let i = 0; i < n; i++) c[ORDER[i]]++; return c; }
  function pileTop(P: Pile, layers: number): number { return P[1] - layers * LT; }
  function drawPile(g: Ctx, P: Pile, i: number, layers: number): void {
    if (layers <= 0) return;
    const [x, base, w] = P;
    R(g, Math.round(x - w / 2) - 2, base, w + 4, 1, 'rgba(40,24,12,0.35)');
    for (let j = 0; j < layers; j++) {
      const jit = ((j * 7 + i * 3) % 5) - 2;
      const y = base - j * LT - 1;
      const lx = Math.round(x - w / 2 + jit / 2);
      R(g, lx - 1, y - 2, 1, 3, K); R(g, lx + w, y - 2, 1, 3, K);
      R(g, lx, y - 1, w, 2, j % 3 ? '#f3e3c3' : '#ece0c8');
      R(g, lx, y - 2, w, 1, '#c8b48c');
      if (j === layers - 1) { R(g, lx - 1, y - 3, w + 2, 1, K); R(g, lx, y - 2, w, 1, '#fff6e0'); R(g, lx + 2, y - 1, 4, 1, '#c0392b'); }
    }
  }

  function draw(g: Ctx, t: number): void {
    const ph = phaseOf(t), wk = work(ph);
    const dayK = ph.name === 'day' ? ph.k : 1;
    let sky: string[];
    if (ph.name === 'day') sky = SKY.day.map((c, i) => dayK < 0.8 ? c : mixColor(c, SKY.dusk[i], (dayK - 0.8) / 0.2));
    else if (ph.name === 'dusk') sky = SKY.dusk.map((c, i) => mixColor(c, SKY.night[i], ph.k));
    else if (ph.name === 'dawn') sky = SKY.dawn.map((c, i) => mixColor(c, SKY.day[i], ph.k));
    else sky = SKY.night;
    sky.forEach((c, i) => R(g, 16, 22 + i * 12, 36, 12, c));
    if (ph.name === 'night' || ph.name === 'out') [[22, 26], [34, 30], [46, 24], [28, 40]].forEach(([x, y], i) => R(g, x, y, 1, 1, Math.sin(t * 2 + i) > -0.2 ? '#fff3d6' : '#5a6a8a'));
    for (let x = 20; x < 52; x += 6) R(g, x, 22, 2, 36, '#3a3634');
    const a = Math.sin(t * Math.PI * 0.5) * 0.35;
    seg(g, 177, 31, 177 + Math.sin(a) * 10, 31 + Math.cos(a) * 10, 1, '#c0902a');
    disc(g, 177 + Math.sin(a) * 11, 31 + Math.cos(a) * 11, 2, '#c0902a');
    // o bug na cela, cada vez mais curioso com a papelada; à noite ele dorme
    const asleep = ph.name === 'night' || ph.name === 'out';
    const bx = asleep ? 286 : 262 + Math.sin(t * 0.3) * 30, dir = asleep ? -1 : Math.cos(t * 0.3) >= 0 ? 1 : -1;
    const step = asleep ? 0 : Math.floor(t * 5) % 2;
    for (let i = 0; i < 3; i++) R(g, bx - 5 + i * 5, 113 + (step ^ (i % 2)), 1, 3, K);
    O(g, bx - 7, 104, 14, 9, '#3a6a3a'); R(g, bx - 5, 105, 4, 2, '#8ac06a'); R(g, bx, 104, 1, 9, K);
    O(g, bx + dir * 8 - 2, 105, 5, 5, '#1e2a1e'); if (!asleep) R(g, bx + dir * 9, 106, 1, 1, '#e04a3a');
    const wig = asleep ? 0 : Math.round(Math.sin(t * 4));
    seg(g, bx + dir * 9, 104, bx + dir * 13, 99 + wig, 1, K); seg(g, bx + dir * 8, 104, bx + dir * 10, 98 - wig, 1, K);
    // xícara de café e lampião sobre a mesa
    O(g, 62, 76, 6, 7, '#d8c8a0'); O(g, 61, 83, 8, 1, '#5a4a3a');
    // xerife
    const cx = 106;
    const sleeping = ph.name === 'night' || ph.name === 'out' || (ph.name === 'dusk' && ph.k > 0.6);
    const stretching = ph.name === 'dawn' && ph.k < 0.6;
    let mugAt: [number, number] = [88, 79];
    if (sleeping) {
      torso(g, cx, 66, sheriff, 22);
      limb(g, [[cx - 9, 70], [cx - 12, 80], [cx + 2, 81]], 3, sheriff.shirt, sheriff.skin);
      limb(g, [[cx + 8, 70], [cx + 12, 80], [cx - 2, 82]], 3, sheriff.shirt, sheriff.skin);
      head(g, cx, 64, { ...sheriff, blinkOff: 0 }, 0.05);
    } else if (stretching) {
      const s = Math.sin(ph.k / 0.6 * Math.PI);
      torso(g, cx, 62 - Math.round(s), sheriff, 26);
      head(g, cx, 51 - Math.round(s), { ...sheriff, look: -1 }, t);
      limb(g, [[cx - 9, 64], [cx - 11, lerp(72, 54, s)], [cx - 9, lerp(80, 42, s)]], 3, sheriff.shirt, sheriff.skin);
      limb(g, [[cx + 8, 64], [cx + 11, lerp(72, 54, s)], [cx + 9, lerp(80, 42, s)]], 3, sheriff.shirt, sheriff.skin);
      if (s > 0.6) R(g, cx - 1, 59 - Math.round(s), 2, 2, K);
    } else if (wk.brk >= 0 || ph.name === 'dusk') {
      // pausa: café (de dia) ou olhando a papelada (no fim da tarde)
      torso(g, cx, 62, sheriff, 26);
      const sip = ph.name === 'dusk' ? 0 : Math.sin(clamp(wk.brk / 0.9) * Math.PI);
      const look = ph.name === 'dusk' ? Math.round(Math.sin(t * 0.9)) : 1;
      head(g, cx, 51, { ...sheriff, look: sip > 0.6 ? -1 : look }, sip > 0.6 ? 0.05 : t);
      const mx = lerp(88, 101, sip), my = lerp(79, 62, sip);
      mugAt = [mx, my];
      limb(g, armIK(cx - 9, 66, mx + 2, my + 2, 11, 11, -1), 3, sheriff.shirt, sheriff.skin);
      limb(g, [[cx + 8, 64], [cx + 14, 74], [cx + 10, 83]], 3, sheriff.shirt, sheriff.skin);
    } else {
      // carimbando a folha da vez
      const p = wk.p;
      torso(g, cx, 62, sheriff, 26);
      head(g, cx, 51, { ...sheriff, look: 1 }, t);
      // mão esquerda puxa a folha nova
      const pull = p < 0.14 ? p / 0.14 : 1;
      const lx = lerp(84, 118, pull);
      limb(g, armIK(cx - 9, 66, p < 0.18 ? lx : 96, p < 0.18 ? 82 : 83, 11, 11, -1), 3, sheriff.shirt, sheriff.skin);
      let up: number;
      if (p < 0.42) up = p / 0.42; else if (p < 0.5) up = 1 - (p - 0.42) / 0.08; else if (p < 0.64) up = 0; else if (p < 0.76) up = (p - 0.64) / 0.12 * 0.5; else up = 0.5;
      if (p < 0.8) {
        O(g, Math.round(p < 0.14 ? lx - 2 : 120), 82, 16, 2, '#f3e3c3');
        if (p >= 0.5) { R(g, 124, 82, 8, 1, '#c0392b'); R(g, 125, 83, 6, 1, '#c0392b'); }
      }
      const flick = p > 0.78 && p < 0.9;
      const sx = flick ? 131 : 127, sy = flick ? 75 : lerp(80, 67, up);
      limb(g, armIK(cx + 8, 66, sx, sy, 12, 12, 1), 3, sheriff.shirt, sheriff.skin);
      if (!flick) { O(g, sx - 1, sy - 5, 3, 4, '#5a3820'); O(g, sx - 3, sy - 1, 7, 2, '#a8322a'); }
      else { O(g, 136, 80, 3, 3, '#5a3820'); O(g, 134, 82, 7, 1, '#a8322a'); }
      if (p > 0.5 && p < 0.56) sparkle(g, 127, 80, 2, '#f3e3c3');
    }
    O(g, Math.round(mugAt[0]), Math.round(mugAt[1]), 5, 5, '#f3e3c3'); R(g, Math.round(mugAt[0]) + 5, Math.round(mugAt[1]) + 1, 1, 3, K);
    const c = counts(wk.n);
    PILES.forEach((P, i) => { if (P[5] === 'mid') drawPile(g, P, i, c[i]); });
  }

  function after(g: Ctx, t: number): void {
    const ph = phaseOf(t), wk = work(ph);
    const c = counts(wk.n);
    PILES.forEach((P, i) => { if (P[5] === 'fg') drawPile(g, P, i, c[i]); });
    // a folha voando até a pilha
    if (wk.p >= 0.8 && wk.n < N) {
      const dest = PILES[ORDER[wk.n]];
      const k = (wk.p - 0.8) / 0.2;
      const tx = dest[0], ty = pileTop(dest, c[ORDER[wk.n]]) - 2;
      const x = lerp(128, tx, k), y = lerp(80, ty, k) - Math.sin(k * Math.PI) * 26;
      const tilt = Math.round(Math.sin(k * 9) * 1.5);
      R(g, x - 5, y - 1 + tilt, 10, 3, K); R(g, x - 4, y + tilt, 8, 1, '#f3e3c3'); R(g, x - 1, y + tilt, 3, 1, '#c0392b');
    }
    let dark: number;
    if (ph.name === 'day') dark = ph.k < 0.8 ? 0 : (ph.k - 0.8) / 0.2 * 0.22;
    else if (ph.name === 'dusk') dark = 0.22 + ph.k * 0.36;
    else if (ph.name === 'night') dark = 0.58;
    else if (ph.name === 'out') dark = 0.58 + ph.k * 0.36;
    else dark = 0.94 * (1 - ph.k) * (1 - ph.k);
    if (dark > 0) { g.fillStyle = `rgba(16,18,40,${dark})`; g.fillRect(0, 0, SW, SH); }
    let lamp = 0;
    if (ph.name === 'day' && ph.k > 0.9) lamp = (ph.k - 0.9) / 0.1;
    else if (ph.name === 'dusk' || ph.name === 'night') lamp = 1;
    else if (ph.name === 'out') lamp = ph.k < 0.6 ? (Math.sin(t * 40) > 0 ? 1 : 0.3) : 0;
    if (lamp > 0) {
      const f = lamp * (0.9 + Math.sin(t * 11) * 0.1);
      disc(g, 65, 79, 34, `rgba(255,190,100,${0.10 * f})`);
      disc(g, 65, 79, 18, `rgba(255,200,110,${0.14 * f})`);
      R(g, 64, 78, 2, 3, '#ffd84a');
    }
    if (ph.name === 'night' || (ph.name === 'dusk' && ph.k > 0.65)) {
      for (let i = 0; i < 3; i++) {
        const z = ((t * 0.35 + i / 3) % 1);
        g.globalAlpha = 1 - z;
        const zx = 112 + z * 14, zy = 60 - z * 22;
        R(g, zx, zy, 3, 1, '#f3e3c3'); R(g, zx + 1, zy + 1, 1, 1, '#f3e3c3'); R(g, zx, zy + 2, 3, 1, '#f3e3c3');
        g.globalAlpha = 1;
      }
    }
  }

  return { focus: 160, back, front, draw, after };
}
