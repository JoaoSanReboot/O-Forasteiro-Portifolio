import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { engineEnv } from '../core/env';
import { clamp, lerp } from '../core/math';
import { sceneRng } from '../core/rng';
import { SH, SW } from '../core/stage';
import { armIK } from '../draw/ik';
import { disc, K, limb, O, R, seg } from '../draw/primitives';
import { floorBoards, planksV } from '../figures/props';
import { charX, pixelText } from '../text/pixel-font';
import { tinyText } from '../text/tiny-font';
import { SceneDef } from './scene';

type Seg =
  | { k: 'walk'; from: number; to: number; d: number; keep?: boolean; erased?: boolean }
  | { k: 'write'; i: number; d: number }
  | { k: 'hold'; at: number; d: number }
  | { k: 'erase'; d: number }
  | { k: 'pause'; at: number; d: number; erased: boolean };
type KidMode = 'write' | 'dream' | 'crumple' | 'windup' | 'throw' | 'innocent';

// ---------- V · Escola ----------
// A professora escreve na lousa, caminha (sem pressa) até a próxima linha, apaga e recomeça.
// O aluno do fundo se distrai olhando a janela e, de vez em quando, joga uma bolinha de papel nela.
export function createEscola(): SceneDef {
  const FY = 118;
  const LINES = ['ENGENHARIA DE', 'SOFTWARE', 'C# .NET SQL'];
  const X0 = 96, ROWS = [46, 57, 68];
  const CPS = 2.2, WALK_V = 22, REST = 214;
  const teacher = { hair: '#5a3420', top: '#3a4a6a', skirt: '#5a3a5a', skin: '#d8a47a' };
  const kid = { hair: '#3a2a1e', shirt: '#4a6a8a', skin: '#d8a47a', pants: '#3a3a4a' };
  const lineW = LINES.map((ln) => charX(ln, X0, ln.length) - X0);
  const posAt = (_i: number, xFrac: number) => clamp(X0 + xFrac + 1 - 27, 68, 236);
  // linha do tempo da professora: anda, escreve, anda, escreve... segura, apaga, volta à mesa
  const SEGS: Seg[] = [];
  let cur = REST;
  LINES.forEach((ln, i) => {
    const start = posAt(i, 0);
    SEGS.push({ k: 'walk', from: cur, to: start, d: Math.max(0.6, Math.abs(start - cur) / WALK_V) });
    SEGS.push({ k: 'write', i, d: ln.length / CPS });
    cur = posAt(i, lineW[i]);
  });
  SEGS.push({ k: 'hold', at: cur, d: 7 });
  const eFrom = clamp(X0 - 6 - 27, 68, 236), eTo = clamp(X0 + 150 - 27, 68, 236);
  SEGS.push({ k: 'walk', from: cur, to: eFrom, d: Math.max(0.6, Math.abs(eFrom - cur) / WALK_V), keep: true });
  SEGS.push({ k: 'erase', d: 4 });
  SEGS.push({ k: 'walk', from: eTo, to: REST, d: Math.max(0.6, Math.abs(REST - eTo) / WALK_V), erased: true });
  SEGS.push({ k: 'pause', at: REST, d: 2.5, erased: true });
  const CYCLE = SEGS.reduce((s, x) => s + x.d, 0);
  function stateAt(c: number): { s: Seg; k: number; shown: number[]; afterWrite: boolean } {
    let acc = 0;
    const shown = [0, 0, 0];
    let afterWrite = false;
    for (const s of SEGS) {
      if (c < acc + s.d || s === SEGS[SEGS.length - 1]) {
        const k = clamp((c - acc) / s.d);
        return { s, k, shown, afterWrite };
      }
      acc += s.d;
      if (s.k === 'write') shown[s.i] = LINES[s.i].length;
      if (s.k === 'hold') afterWrite = true;
    }
    throw new Error('linha do tempo vazia');
  }
  const KT = 34;
  let dust: { x: number; y: number; life: number }[] = [], ballFloor: { x: number; t0: number } | null = null;

  function back(g: Ctx): void {
    R(g, 0, 0, SW, 90, '#e8dcc4'); for (let y = 6; y < 90; y += 8) R(g, 0, y, SW, 1, '#ddd0b6');
    planksV(g, 0, 90, SW, 28, '#8a4a2a', '#6e3a20', 9); R(g, 0, 90, SW, 2, '#5a2e18');
    floorBoards(g, FY, '#9a6a40', '#7a5030');
    // faixa do alfabeto acima da lousa
    O(g, 80, 24, 166, 9, '#f6eedc');
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    [...ABC].forEach((ch, i) => tinyText(g, ch, 84.5 + i * 6.3, 26, i % 2 ? '#3a4a6a' : '#8a3a2a', true));
    // lousa
    O(g, 80, 36, 166, 50, '#8a5a34'); R(g, 83, 39, 160, 44, '#2e4a3a');
    const rnd = sceneRng;
    rnd.seed = 9; for (let i = 0; i < 40; i++) R(g, 84 + Math.floor(rnd.next() * 158), 40 + Math.floor(rnd.next() * 42), 2 + Math.floor(rnd.next() * 5), 1, '#3a5a48');
    O(g, 82, 86, 162, 2, '#6e4426'); R(g, 120, 84, 4, 1, '#f3efe2'); R(g, 190, 84, 3, 1, '#e8c878');
    // sino
    seg(g, 300, 0, 300, 74, 1, '#c8a870'); O(g, 298, 74, 4, 6, '#a8322a');
    // mapa do Brasil enrolado
    O(g, 254, 34, 30, 3, '#6e4426'); R(g, 255, 37, 28, 30, '#e8d8a8'); R(g, 256, 37, 26, 1, '#c8b888');
    const BR = ['0000111110000', '0011111111100', '0111111111110', '0111111111111', '0011111111111', '0001111111110', '0000111111100', '0000011111000', '0000011110000', '0000001110000', '0000001100000'];
    BR.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') R(g, 263 + x, 40 + y, 1, 1, (x + y) % 5 === 0 ? '#6e8a38' : '#8aa448'); }));
    R(g, 271, 45, 1, 1, '#a8322a');
    tinyText(g, 'BRASIL', 269, 59, '#5a3820', true);
  }

  function front(g: Ctx): void {
    // carteira do aluno e a da frente
    [[24, 104], [150, 106]].forEach(([x, y]) => { O(g, x, y, 46, 4, '#8a5a34'); R(g, x + 2, y + 4, 2, FY - y - 4, '#5a3820'); R(g, x + 42, y + 4, 2, FY - y - 4, '#5a3820'); });
    O(g, 182, 100, 5, 5, '#c0392b'); R(g, 184, 98, 1, 2, '#5a3820'); R(g, 185, 98, 2, 1, '#5e7d4a');
    O(g, 164, 102, 12, 3, '#3a6a8a');
    // mesa da professora
    O(g, 256, 92, 54, 4, '#8a5a34'); O(g, 258, 96, 50, 22, '#6e4426');
    R(g, 264, 102, 38, 1, '#5a3820'); R(g, 281, 106, 4, 2, '#c0a060');
    O(g, 296, 88, 8, 4, '#a8322a'); R(g, 296, 88, 8, 1, '#c8502a');
  }

  // globo com o eixo inclinado (23°), girando
  const LAND = [[0.6, 0.2, 0.55], [-0.3, 0.9, 0.5], [0.3, 2.3, 0.6], [-0.5, 3.7, 0.45], [0.75, 4.7, 0.4], [0.05, 5.5, 0.3]];
  function globe(g: Ctx, cx: number, cy: number, r: number, t: number): void {
    const T = 0.41, cs = Math.cos(T), sn = Math.sin(T), rot = t * 0.6;
    // suporte e meridiano de latão
    O(g, cx - 6, cy + r + 4, 12, 2, '#6e4426'); R(g, cx, cy + r + 1, 1, 3, '#8a6a3a');
    for (let a = 0.2; a < Math.PI * 1.1; a += 0.04) {
      const x = (r + 2) * Math.cos(a + Math.PI / 2 + 0.2), y = (r + 2) * Math.sin(a + Math.PI / 2 + 0.2);
      R(g, cx + x * cs - y * sn, cy + x * sn + y * cs, 1, 1, '#c0902a');
    }
    disc(g, cx, cy, r + 1, K);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
      const lat = Math.asin(clamp(-v / r, -1, 1));
      const z = Math.sqrt(Math.max(0, r * r - u * u - v * v));
      const lon = Math.atan2(u, z) + rot;
      let land = false;
      for (const [la, lo, sz] of LAND) {
        const cd = Math.sin(lat) * Math.sin(la) + Math.cos(lat) * Math.cos(la) * Math.cos(lon - lo);
        if (cd > Math.cos(sz)) { land = true; break; }
      }
      const dark = dx + dy * 0.4 > r * 0.45;
      R(g, cx + dx, cy + dy, 1, 1, land ? (dark ? '#6e8a38' : '#8aa448') : (dark ? '#2e5470' : '#3a6a8a'));
    }
    R(g, cx - 2, cy - 3, 1, 1, 'rgba(255,255,255,0.7)');
    // eixo
    R(g, Math.round(cx + (r + 3) * sn), Math.round(cy - (r + 3) * cs), 1, 2, '#c0902a');
    R(g, Math.round(cx - (r + 2) * sn), Math.round(cy + (r + 2) * cs), 1, 1, '#c0902a');
  }
  function kidState(t: number): { m: KidMode; k: number } {
    const k = t % KT;
    if (k < 14) return { m: 'write', k };
    if (k < 19.5) return { m: 'dream', k: (k - 14) / 5.5 };
    if (k < 22) return { m: 'write', k };
    if (k < 23.2) return { m: 'crumple', k: (k - 22) / 1.2 };
    if (k < 24) return { m: 'windup', k: (k - 23.2) / 0.8 };
    if (k < 25.2) return { m: 'throw', k: (k - 24) / 1.2 };
    return { m: 'innocent', k: (k - 25.2) / (KT - 25.2) };
  }
  let teacherX = REST;

  function draw(g: Ctx, t: number, dt: number): void {
    // janela com o ipê balançando
    R(g, 16, 22, 44, 46, '#4a3020');
    ['#f6c47a', '#f2a65a', '#e8884a'].forEach((c, i) => R(g, 19, 25 + i * 14, 38, 14, c));
    const sway = Math.sin(t * 0.5) * 1.5;
    g.save(); g.beginPath(); g.rect(19, 25, 38, 40); g.clip();
    R(g, 44, 46, 3, 20, '#5a4232');
    [[46, 38, 10], [36, 42, 8], [54, 44, 7], [42, 32, 7]].forEach(([x, y, r]) => disc(g, x + sway, y, r + 1, '#8a5a1a'));
    [[46, 38, 10], [36, 42, 8], [54, 44, 7], [42, 32, 7]].forEach(([x, y, r]) => disc(g, x + sway, y, r, '#e8b020'));
    [[44, 35, 5], [35, 40, 4]].forEach(([x, y, r]) => disc(g, x + sway, y, r, '#ffd84a'));
    for (let i = 0; i < 4; i++) { const k = ((t * 0.25 + i * 0.27) % 1); R(g, 26 + i * 8 + Math.sin(t + i) * 3, 30 + k * 34, 1, 1, '#ffd23a'); }
    g.restore();
    R(g, 37, 25, 2, 40, '#4a3020'); R(g, 19, 44, 38, 2, '#4a3020');
    // giz na lousa
    const st = stateAt(engineEnv.reduceMotion ? SEGS.slice(0, 6).reduce((s, x) => s + x.d, 0) + 1 : t % CYCLE);
    const s = st.s, shown = st.shown.slice();
    let handX: number | null = null, handY = 0, eraseX = -1, cx: number;
    if (s.k === 'write') {
      const len = LINES[s.i].length;
      const nf = st.k * len, n = Math.floor(nf);
      shown[s.i] = n;
      const x0 = charX(LINES[s.i], X0, n), x1 = charX(LINES[s.i], X0, Math.min(len, n + 1));
      handX = lerp(x0, x1, nf - n) + 1; handY = ROWS[s.i] + 4;
      cx = clamp(handX - 27, 68, 236);
    } else if (s.k === 'walk') {
      cx = lerp(s.from, s.to, st.k * st.k * (3 - 2 * st.k));
    } else if (s.k === 'hold') {
      cx = s.at;
    } else if (s.k === 'erase') {
      eraseX = X0 - 6 + st.k * 156;
      cx = clamp(eraseX - 27, 68, 236);
      handX = eraseX; handY = 60;
    } else cx = s.at;
    const erased = 'erased' in s && !!s.erased;
    if (!erased) {
      LINES.forEach((ln, i) => {
        if (!shown[i]) return;
        g.save();
        if (eraseX > 0) { g.beginPath(); g.rect(eraseX, 0, SW, SH); g.clip(); }
        pixelText(g, ln, X0, ROWS[i], '#f3efe2', false, shown[i]);
        g.restore();
      });
      if (s.k === 'hold' || (s.k === 'walk' && s.keep)) R(g, X0, ROWS[2] + 10, s.k === 'hold' ? Math.min(62, st.k * s.d * 30) : 62, 1, '#e8c878');
      if (s.k === 'erase') { g.save(); g.beginPath(); g.rect(eraseX, 0, SW, SH); g.clip(); R(g, X0, ROWS[2] + 10, 62, 1, '#e8c878'); g.restore(); }
    }
    cx = Math.round(cx); teacherX = cx;
    // professora de costas
    const walking = s.k === 'walk';
    const step = walking ? (Math.sin(t * 7) > 0 ? 1 : 0) : 0;
    const ks = kidState(t);
    const angry = ks.m === 'innocent' && ks.k < 0.32;
    for (let y = 0; y < 38; y++) {
      const w = 14 + Math.round(y * 0.32), sh = y > 30 ? step : 0;
      R(g, cx - Math.floor(w / 2) - 1 + sh, 80 + y, w + 2, 1, K); R(g, cx - Math.floor(w / 2) + sh, 80 + y, w, 1, teacher.skirt);
    }
    R(g, cx - 1, 82, 1, 34, shade(teacher.skirt, 0.8));
    if (walking) { R(g, cx - 5 + step * 3, 117, 4, 1, '#2a1e18'); }
    const bob = walking ? step : 0;
    O(g, cx - 10, 64 - bob, 4, 5, teacher.top); O(g, cx + 6, 64 - bob, 4, 5, teacher.top);
    O(g, cx - 7, 63 - bob, 14, 18, teacher.top); R(g, cx - 7, 78 - bob, 14, 2, '#2a3450');
    R(g, cx - 2, 61 - bob, 4, 3, teacher.skin);
    O(g, cx - 5, 51 - bob, 10, 11, teacher.hair); R(g, cx - 4, 52 - bob, 3, 8, shade(teacher.hair, 1.2));
    O(g, cx - 3, 47 - bob, 6, 5, teacher.hair); R(g, cx - 1, 46 - bob, 2, 1, '#c0902a');
    if (angry) {
      // vira o rosto para o fundo da sala, brava
      R(g, cx - 6, 55, 3, 6, teacher.skin); R(g, cx - 6, 57, 1, 1, K); R(g, cx - 6, 56, 2, 1, K);
      const vx = cx + 6, vy = 47;
      R(g, vx, vy, 1, 3, '#c0392b'); R(g, vx + 2, vy, 1, 3, '#c0392b'); R(g, vx - 1, vy + 1, 5, 1, '#c0392b');
    }
    limb(g, [[cx - 9, 66 - bob], [cx - 10, 73], [cx - 7, 80]], 3, teacher.top, teacher.skin);
    O(g, cx - 11, 74, 5, 8, '#8a3a2a'); R(g, cx - 11, 74, 1, 8, '#f3e3c3');
    let fin: readonly [number, number];
    if (handX !== null && !angry) {
      const hy = s.k === 'write' ? handY + Math.round(Math.sin(t * 9) * 0.6) : handY;
      const reachX = clamp(handX, cx + 14, cx + 33), reachY = clamp(hy, 46, 80);
      const arm = armIK(cx + 8, 66, reachX, reachY, 12, 12, 1);
      limb(g, arm, 3, teacher.top, teacher.skin);
      fin = arm[2];
    } else {
      // braço descansando ao lado do corpo (caminhando ou olhando a lousa)
      const sw = walking ? Math.sin(t * 7) * 2 : 0;
      limb(g, [[cx + 8, 66 - bob], [cx + 10, 73], [cx + 9 + sw, 80]], 3, teacher.top, teacher.skin);
      fin = [cx + 9 + sw, 80];
    }
    if (s.k === 'erase' && !angry) {
      O(g, fin[0] - 4, fin[1] - 2, 8, 4, '#8a5a34'); R(g, fin[0] - 4, fin[1] + 1, 8, 1, '#e8e0d0');
      if (Math.random() < 0.4) dust.push({ x: fin[0] + Math.random() * 6 - 3, y: fin[1] + 2, life: 0 });
    } else if (s.k === 'write' && !angry) R(g, fin[0] - 1, fin[1] - 1, 2, 2, '#f3efe2');
    dust = dust.filter((d) => (d.life += dt) < 1);
    for (const d of dust) R(g, d.x, d.y + d.life * 22, 1, 1, `rgba(243,239,226,${0.7 * (1 - d.life)})`);
    globe(g, 284, 80, 7, t);
  }

  function after(g: Ctx, t: number): void {
    // aluno sentado de costas: pés debaixo da carteira, mãos sobre ela
    const kx = 48, ks = kidState(t);
    O(g, kx - 12, 108, 24, 3, '#7a4a2a'); R(g, kx - 10, 111, 2, 7, '#5a3820'); R(g, kx + 8, 111, 2, 7, '#5a3820');
    const swing = ks.m === 'dream' ? Math.round(Math.sin(t * 5)) : 0;
    O(g, kx - 6, 110, 4, 6, kid.pants); O(g, kx + 2, 110, 4, 6 + swing, kid.pants);
    O(g, kx - 7, 115, 6, 2, '#2a1e18'); O(g, kx + 2, 115 + swing, 6, 2, '#2a1e18');
    O(g, kx - 9, 93, 3, 4, kid.shirt); O(g, kx + 6, 93, 3, 4, kid.shirt);
    O(g, kx - 7, 92, 14, 15, kid.shirt); R(g, kx - 7, 104, 14, 2, kid.pants);
    const look = ks.m === 'dream' ? -1 : 0;
    O(g, kx - 5 + look, 82, 10, 10, kid.hair); R(g, kx - 6 + look, 84, 1, 5, kid.hair); R(g, kx - 2 + look, 81, 2, 1, kid.hair); R(g, kx - 4 + look, 83, 2, 2, shade(kid.hair, 1.3));
    if (look) { R(g, kx - 6, 87, 1, 3, kid.skin); }
    // mãos
    let L: [number, number] = [kx - 11, 103], Rh: [number, number] = [kx + 11, 102];
    if (ks.m === 'write' || ks.m === 'innocent') Rh = [kx + 10 + Math.round(Math.sin(t * 8)), 102];
    if (ks.m === 'dream') Rh = [kx + 3, 90];
    if (ks.m === 'crumple') { L = [kx - 3, 99 + Math.round(Math.sin(t * 20))]; Rh = [kx + 3, 99 - Math.round(Math.sin(t * 20))]; }
    if (ks.m === 'windup') Rh = [kx + 10, lerp(98, 80, ks.k)];
    if (ks.m === 'throw') Rh = [kx + 12, lerp(80, 90, Math.min(1, ks.k * 3))];
    limb(g, armIK(kx - 9, 95, L[0], L[1], 8, 8, -1), 3, kid.shirt, kid.skin);
    limb(g, armIK(kx + 8, 95, Rh[0], Rh[1], 8, 8, 1), 3, kid.shirt, kid.skin);
    if (ks.m === 'crumple') disc(g, kx, 98, 2, '#f3efe2');
    if (ks.m === 'windup') { disc(g, Rh[0], Rh[1] - 1, 2, K); disc(g, Rh[0], Rh[1] - 1, 1.5, '#f3efe2'); }
    // bolinha voando até a cabeça da professora
    if (ks.m === 'throw') {
      const tx = teacherX, ty = 56;
      const bx = lerp(kx + 10, tx, ks.k), by = lerp(78, ty, ks.k) - Math.sin(ks.k * Math.PI) * 24;
      disc(g, bx, by, 2, K); disc(g, bx, by, 1.5, '#f3efe2');
      ballFloor = null;
    }
    if (ks.m === 'innocent') {
      if (!ballFloor) ballFloor = { x: teacherX + 6, t0: t };
      const fall = clamp((t - ballFloor.t0) / 0.5);
      const by = lerp(58, 115, fall * fall);
      disc(g, ballFloor.x + fall * 6, by, 2, K); disc(g, ballFloor.x + fall * 6, by, 1.5, '#f3efe2');
      // assobiando, fingindo que nada aconteceu
      if (ks.k < 0.4) { const n = (t * 1.5) % 1; R(g, kx + 8 + n * 6, 78 - n * 10, 1, 3, '#3a2a1e'); R(g, kx + 6 + n * 6, 80 - n * 10, 2, 2, '#3a2a1e'); }
    }
    // pensando longe, olhando a janela
    if (ks.m === 'dream') {
      const a = Math.min(1, ks.k * 4) * Math.min(1, (1 - ks.k) * 4);
      g.globalAlpha = a;
      disc(g, kx - 10, 76, 1, '#f6eedc'); disc(g, kx - 14, 70, 1.5, '#f6eedc');
      O(g, kx - 30, 52, 20, 13, '#f6eedc');
      disc(g, kx - 20, 58, 4, '#e8b020'); disc(g, kx - 21, 57, 2, '#ffd84a'); R(g, kx - 20, 61, 1, 3, '#5a4232');
      g.globalAlpha = 1;
    }
  }

  return { focus: 165, back, front, draw, after };
}
