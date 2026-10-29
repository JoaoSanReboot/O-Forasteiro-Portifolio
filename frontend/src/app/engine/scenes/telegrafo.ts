import { Ctx, makeCanvas } from '../core/canvas';
import { engineEnv } from '../core/env';
import { clamp, lerp } from '../core/math';
import { sceneRng } from '../core/rng';
import { SH, SW } from '../core/stage';
import { armIK } from '../draw/ik';
import { disc, K, limb, O, R, seg, sparkle } from '../draw/primitives';
import { head, Person, torso } from '../figures/people';
import { floorBoards, planksV, sign, windowSky } from '../figures/props';
import { tinyText } from '../text/tiny-font';
import { SceneDef } from './scene';

interface Heap { H: number; s: number; off: number }

// ---------- IV · Telégrafo ----------
// A fita sai do aparelho e vai se amontoando até cobrir a cena; quando cobre tudo,
// o monte inteiro desce de uma vez e revela a sala limpa, e tudo recomeça.
export function createTelegrafo(): SceneDef {
  const FY = 116;
  const op: Person = { skin: '#d8a47a', skinD: '#b07a58', hair: '#4a3020', hairH: 3, stache: '#4a3020', visor: true, shirt: '#ece4d4', vest: '#2a2a2e', garter: '#a8322a', blinkOff: 0.4 };
  const MORSE = '-.-. --- -- -- .. -';
  const U = 0.16, TIMELINE: [number, number][] = [];
  for (const ch of MORSE) {
    if (ch === ' ') { TIMELINE.push([0, 2 * U]); continue; }
    TIMELINE.push([1, ch === '.' ? U : 3 * U]); TIMELINE.push([0, U]);
  }
  TIMELINE.push([0, 7 * U]);
  const TOTAL = TIMELINE.reduce((s, [, d]) => s + d, 0);
  function keyDown(t: number): boolean { let x = t % TOTAL; for (const [on, d] of TIMELINE) { if (x < d) return !!on; x -= d; } return false; }
  // a sala enche de fita em uns 6 minutos; a cada 40 s o telegrafista faz uma pausa
  const GROW = 360, HOLD = 0.8, SLIDE = 2.2, CYC = GROW + HOLD + SLIDE;
  const PAUSE_EVERY = 40, PAUSE = 7;
  const SRC = 230;
  let tape = 0;
  // textura do papel acumulado: fita em camadas, com os traços do Morse
  const TH = 440;
  const [paper, pg] = makeCanvas(SW, TH);
  (function () {
    const rnd = sceneRng;
    R(pg, 0, 0, SW, TH, '#ece0c4');
    rnd.seed = 31;
    for (let y = 2; y < TH; y += 5) {
      R(pg, 0, y, SW, 1, '#d6c6a2');
      for (let x = Math.floor(rnd.next() * 8); x < SW; x += 6 + Math.floor(rnd.next() * 10)) R(pg, x, y - 2, rnd.next() < 0.4 ? 1 : 3, 1, '#4a3020');
    }
    for (let i = 0; i < 140; i++) {
      const x = Math.floor(rnd.next() * SW), y = Math.floor(rnd.next() * TH);
      R(pg, x, y, 6, 1, '#b8a888'); R(pg, x - 1, y + 1, 1, 2, '#b8a888'); R(pg, x + 6, y + 1, 1, 2, '#b8a888');
    }
  })();
  function heapState(t: number): Heap {
    const c = engineEnv.reduceMotion ? 6 : t % CYC;
    const k = clamp(c / GROW);
    const H = 236 * Math.pow(k, 1.6);
    const s = 16 + 280 * k * k;
    let off = 0;
    if (c > GROW + HOLD) { const e = (c - GROW - HOLD) / SLIDE; off = (SH + 70) * e * e * (3 - 2 * e); }
    return { H, s, off };
  }
  const topAt = (st: Heap, x: number) => SH - st.H * Math.exp(-((x - SRC) ** 2) / (2 * st.s * st.s)) + st.off;

  function back(g: Ctx): void {
    R(g, 0, 0, SW, 84, '#7a8a72'); for (let x = 0; x < SW; x += 12) R(g, x, 0, 6, 84, '#76866e');
    planksV(g, 0, 84, SW, 32, '#6e4a30', '#5a3a24', 8); R(g, 0, 84, SW, 3, '#4a3020');
    R(g, 0, 0, SW, 5, '#4a3020');
    floorBoards(g, FY, '#8a6040', '#6e4a30');
    windowSky(g, 248, 18, 54, 46, ['#f6c47a', '#f2a65a', '#e8884a', '#d87040']);
    R(g, 248, 52, 54, 12, '#b0704a');
    R(g, 272, 22, 2, 30, '#4a3020'); R(g, 266, 26, 14, 2, '#4a3020');
    g.fillStyle = '#3a2418'; for (let x = 248; x < 302; x++) g.fillRect(x, Math.round(27 + Math.sin((x - 248) / 54 * Math.PI) * 3), 1, 1);
    R(g, 274, 18, 2, 46, '#4a3020'); R(g, 248, 40, 54, 2, '#4a3020');
    O(g, 18, 18, 74, 54, '#6e4426');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
      const x = 20 + c * 12, y = 20 + r * 13;
      R(g, x, y, 10, 11, '#3a2418');
      if ((r * 7 + c * 3) % 4 !== 0) { R(g, x + 1, y + 4, 8, 6, '#f3e3c3'); R(g, x + 1, y + 4, 8, 1, '#d8c8a8'); }
    }
    sign(g, 168, 7, 'COMMITS');
    // telegrama pregado na parede
    O(g, 96, 15, 48, 33, '#f0e2c0'); R(g, 96, 15, 48, 1, '#fff2d6'); R(g, 119, 14, 2, 2, '#a8322a');
    tinyText(g, 'TELEGRAMA', 120, 18, '#2b1a10', true); R(g, 100, 24, 40, 1, '#a8322a');
    tinyText(g, '24 COMMITS', 120, 27, '#3a2418', true); tinyText(g, 'NO ÚLTIMO', 120, 35, '#3a2418', true); tinyText(g, 'ANO.', 120, 41, '#3a2418', true);
    disc(g, 210, 34, 10, K); disc(g, 210, 34, 9, '#f3e3c3');
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R(g, 210 + Math.cos(a) * 7, 34 + Math.sin(a) * 7, 1, 1, '#6a4a2a'); }
  }

  function front(g: Ctx): void {
    O(g, 104, 90, 124, 26, '#5a3820'); R(g, 110, 94, 52, 18, '#4a2e1e'); R(g, 170, 94, 52, 18, '#4a2e1e');
    O(g, 100, 86, 132, 4, '#8a5a34'); R(g, 100, 86, 132, 1, '#b07a48');
    O(g, 176, 78, 28, 7, '#6e4426'); O(g, 180, 70, 6, 8, '#c0902a'); O(g, 192, 70, 6, 8, '#c0902a'); R(g, 180, 70, 1, 8, '#e8c060'); R(g, 192, 70, 1, 8, '#e8c060');
    O(g, 182, 66, 16, 3, '#3a3634');
    O(g, 150, 81, 22, 4, '#6e4426');
    O(g, 116, 82, 16, 3, '#f3e3c3');
    disc(g, 214, 79, 6, K); disc(g, 214, 79, 5, '#e8dcc4'); disc(g, 214, 79, 2, '#6e4426');
  }

  function draw(g: Ctx, t: number, dt: number): void {
    const pc = t % PAUSE_EVERY, pausing = pc > PAUSE_EVERY - PAUSE;
    const pk = pausing ? Math.sin(clamp((pc - (PAUSE_EVERY - PAUSE)) / PAUSE) * Math.PI) : 0;
    const coffee = Math.floor(t / PAUSE_EVERY) % 2 === 1;
    const down = !engineEnv.reduceMotion && !pausing && keyDown(t);
    const sa = (t / 60) * Math.PI * 2 - Math.PI / 2;
    seg(g, 210, 34, 210 + Math.cos(sa) * 7, 34 + Math.sin(sa) * 7, 1, '#a8322a');
    seg(g, 210, 34, 210, 29, 1, K); seg(g, 210, 34, 214, 34, 1, K);
    const st = heapState(t);
    const buried = clamp((86 - topAt(st, 140)) / 40);
    const cx = 140;
    torso(g, cx, 62, op, 26);
    head(g, cx, 51, { ...op, look: buried > 0.2 || pk > 0.5 ? -1 : 1 }, coffee && pk > 0.6 ? 0.05 : t);
    let mug: [number, number] = [108, 80];
    if (buried > 0.5) {
      limb(g, [[cx - 9, 64], [cx - 12, 54], [cx - 10, 44]], 3, op.shirt, op.skin);
      limb(g, [[cx + 8, 64], [cx + 12, 54], [cx + 10, 44]], 3, op.shirt, op.skin);
    } else if (pk > 0) {
      if (coffee) {
        mug = [lerp(108, 134, pk), lerp(80, 60, pk)];
        limb(g, armIK(cx - 9, 64, mug[0] + 2, mug[1] + 2, 11, 11, -1), 3, op.shirt, op.skin);
        limb(g, armIK(cx + 8, 64, 156, 82, 11, 11, 1), 3, op.shirt, op.skin);
      } else {
        // lê um pedaço da fita, segurando com as duas mãos
        const ry = lerp(80, 58, pk);
        limb(g, armIK(cx - 9, 64, 130, ry, 11, 11, -1), 3, op.shirt, op.skin);
        limb(g, armIK(cx + 8, 64, 150, ry, 11, 11, 1), 3, op.shirt, op.skin);
        if (pk > 0.3) { R(g, 131, ry - 1, 18, 3, K); R(g, 132, ry, 16, 1, '#ece0c4'); for (let x = 133; x < 147; x += 3) R(g, x, ry, 1 + (x % 2), 1, '#4a3020'); }
      }
      O(g, 154, 79, 14, 1, '#3a3634'); disc(g, 162, 78, 2, '#1e1a1a');
    } else {
      const wx = 120 + (down ? 0 : Math.round(Math.sin(t * 5) * 2));
      limb(g, armIK(cx - 9, 64, wx, 81, 11, 11, -1), 3, op.shirt, op.skin);
      R(g, wx + 2, 77, 1, 4, '#c0902a');
      const ky = down ? 81 : 79;
      limb(g, armIK(cx + 8, 64, 162, ky - 1, 12, 12, 1), 3, op.shirt, op.skin);
      O(g, 154, ky, 14, 1, '#3a3634'); disc(g, 162, ky - 1, 2, '#1e1a1a');
    }
    O(g, Math.round(mug[0]), Math.round(mug[1]), 5, 5, '#f3e3c3'); R(g, Math.round(mug[0]) - 1, Math.round(mug[1]) + 1, 1, 3, K);
    if (down) { sparkle(g, 190, 64, 2, '#ffe066'); R(g, 182, 67, 14, 1, '#5a5652'); }
    const bt = t % 22;
    if (bt < 15) {
      const bx = 286 + (bt < 1 ? (1 - bt) * 16 : 0), by = 26 + Math.round(Math.sin(((bx - 248) / 54) * Math.PI) * 3) - 3;
      R(g, bx, by, 4, 3, '#3a2a24'); R(g, bx + 3, by - 1, 2, 2, '#3a2a24'); R(g, bx + 5, by, 1, 1, '#c0902a');
    } else if (bt < 16) { const k = bt - 15; R(g, 286 + k * 30, 23 - k * 18, 4, 2, '#3a2a24'); }
    tape += dt * (down ? 10 : pausing ? 0 : 3);
  }

  function after(g: Ctx, t: number): void {
    const st = heapState(t);
    // a fita saindo do carretel até o topo do monte
    const yTop = Math.min(150, topAt(st, SRC + 1));
    R(g, 219, 79, 12, 3, '#e8dcc4');
    if (yTop > 82) {
      R(g, SRC - 1, 82, 3, yTop - 82, '#e8dcc4');
      for (let y = 82 + (tape % 6); y < yTop; y += 6) R(g, SRC, y, 1, 2, '#3a2418');
    }
    if (st.H < 1 && st.off === 0) return;
    // o monte de papel
    g.save();
    g.beginPath(); g.moveTo(0, SH + 2);
    for (let x = 0; x <= SW; x += 2) g.lineTo(x, Math.round(topAt(st, x)));
    g.lineTo(SW, SH + 2); g.closePath(); g.clip();
    g.drawImage(paper, 0, Math.round(st.off) - (TH - SH));
    g.restore();
    // contorno e voltinhas da fita na borda de cima
    for (let x = 0; x < SW; x += 1) {
      const y = Math.round(topAt(st, x));
      if (y >= -1 && y < SH) { R(g, x, y - 1, 1, 1, K); R(g, x, y, 1, 1, '#fff6e0'); }
    }
    for (let x = 4; x < SW; x += 11) {
      const y = Math.round(topAt(st, x + 2));
      if (y < 2 || y > SH - 2) continue;
      R(g, x, y - 4, 5, 1, K); R(g, x - 1, y - 3, 1, 3, K); R(g, x + 5, y - 3, 1, 3, K); R(g, x, y - 3, 5, 3, '#ece0c4'); R(g, x + 1, y - 2, 3, 1, '#d6c6a2');
    }
  }

  return { focus: 165, back, front, draw, after };
}
