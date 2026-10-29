import { Ctx } from '../core/canvas';
import { engineEnv } from '../core/env';
import { clamp, lerp } from '../core/math';
import { sceneRng } from '../core/rng';
import { SH, SW } from '../core/stage';
import { armIKkeep, ElbowMemory } from '../draw/ik';
import { disc, K, limb, O, R, seg, sparkle } from '../draw/primitives';
import { head, Person, torso } from '../figures/people';
import { windowSky } from '../figures/props';
import { tinyText } from '../text/tiny-font';
import { SceneDef } from './scene';

interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number }
interface Puff { x: number; y: number; life: number }

// ---------- II · Ferreiro ----------
export function createFerraria(): SceneDef {
  const FY = 116, FX = 264; // FX: centro da fornalha
  const smith: Person = { skin: '#c08a64', skinD: '#9a6a4a', hair: null, beard: '#3a2418', brow: '#3a2418', shirt: '#8a5a40', apron: '#4a2e1e', blinkOff: 0.7 };
  let sparks: Spark[] = [], lastPhase = 0, heat = 0.6, steam: Puff[] = [];
  const tongMem: ElbowMemory = {};
  const TOOLS: readonly (readonly [number, 'tongs' | 'hammer' | 'file'])[] = [[30, 'tongs'], [44, 'hammer'], [58, 'tongs'], [72, 'hammer'], [84, 'file']];

  function back(g: Ctx): void {
    const rnd = sceneRng;
    R(g, 0, 0, SW, FY, '#4e3e36');
    rnd.seed = 5;
    for (let y = 0, r = 0; y < FY; y += 7, r++) for (let x = -(r % 2) * 8; x < SW; x += 16) {
      R(g, x, y, 15, 6, ['#564640', '#4a3a32', '#5a4a40', '#52423a'][Math.floor(rnd.next() * 4)]);
    }
    R(g, 0, FY - 4, SW, 4, '#3a2e28');
    R(g, 0, FY, SW, SH - FY, '#5a4636');
    for (let i = 0; i < 120; i++) R(g, Math.floor(rnd.next() * SW), FY + 2 + Math.floor(rnd.next() * 32), 1, 1, rnd.next() < 0.5 ? '#4a3828' : '#6a5444');
    // janela alta
    windowSky(g, 112, 14, 30, 18, ['#e8884a', '#c8603a', '#8a4a3a']); R(g, 126, 14, 2, 18, '#4a3020');
    // ferramentas na parede
    O(g, 24, 30, 70, 3, '#6e4426');
    TOOLS.forEach(([x, k]) => {
      if (k === 'tongs') { seg(g, x, 33, x - 2, 56, 1, '#2a2624'); seg(g, x + 2, 33, x + 4, 56, 1, '#2a2624'); }
      if (k === 'hammer') { seg(g, x, 33, x, 52, 2, '#7a4a2a'); O(g, x - 4, 50, 9, 5, '#3a3634'); }
      if (k === 'file') { O(g, x, 33, 2, 20, '#5a5652'); }
    });
    [[34, 66], [48, 66], [62, 66]].forEach(([x, y]) => { R(g, x, y, 2, 7, '#5a5652'); R(g, x + 6, y, 2, 7, '#5a5652'); R(g, x, y + 7, 8, 2, '#5a5652'); });
    // lista de pedidos pregada na parede
    O(g, 150, 18, 44, 40, '#e8d4a8'); R(g, 150, 18, 44, 1, '#f6e6c0'); R(g, 171, 17, 2, 2, '#8a8682');
    tinyText(g, 'PEDIDOS', 172, 22, '#2b1a10', true); R(g, 155, 28, 34, 1, '#8a6a4a');
    tinyText(g, '1 UKRA', 155, 31, '#3a2418'); tinyText(g, '2 SHOGUN', 155, 38, '#3a2418'); tinyText(g, '3 JOSE', 155, 45, '#8a2a20');
    R(g, 155, 34, 22, 1, '#5a3820'); R(g, 155, 41, 32, 1, '#5a3820');
    R(g, 183, 46, 6, 6, '#c0392b'); tinyText(g, '!', 185, 46, '#f3e3c3');
    // ferradura da sorte
    R(g, 128, 40, 2, 7, '#8a8682'); R(g, 134, 40, 2, 7, '#8a8682'); R(g, 128, 47, 8, 2, '#8a8682');
    // coifa reta e simétrica, centrada na fornalha
    for (let i = 0; i < 60; i++) {
      const w = Math.round(36 + i * 0.9);
      R(g, FX - Math.floor(w / 2) - 1, i, w + 2, 1, K);
      R(g, FX - Math.floor(w / 2), i, w, 1, i % 8 === 7 ? '#2e2420' : '#3e302a');
    }
    O(g, FX - 46, 60, 92, 4, '#2e2420');
    // fornalha de tijolo, com a boca centrada
    O(g, FX - 40, 66, 80, 50, '#5a4a42');
    g.save(); g.beginPath(); g.rect(FX - 40, 66, 80, 50); g.clip();
    for (let y = 66, r = 0; y < 116; y += 6, r++) for (let x = FX - 40 - (r % 2) * 5; x < FX + 40; x += 10) R(g, x, y, 9, 5, '#6a5850');
    g.restore();
    O(g, FX - 44, 64, 88, 3, '#3a302a');
    O(g, FX - 22, 76, 44, 22, K);
    R(g, FX - 21, 94, 42, 4, '#3a1a10');
    // fole apoiado num cavalete, com o cano entrando na fornalha
    O(g, 194, 98, 2, 18, '#5a3820'); O(g, 214, 98, 2, 18, '#5a3820'); O(g, 192, 96, 26, 3, '#6e4426');
    R(g, 196, 108, 18, 1, '#5a3820');
    O(g, 216, 89, FX - 40 - 216, 3, '#3a3634');
    // balde de água
    O(g, 38, 98, 18, 18, '#6e4426'); R(g, 38, 103, 18, 1, '#3a3634'); R(g, 38, 110, 18, 1, '#3a3634'); R(g, 39, 98, 16, 2, '#3a5a6a');
  }

  function draw(g: Ctx, t: number, dt: number): void {
    const pump = 0.5 + 0.5 * Math.sin(t * 3.9);
    // brilho e fogo dentro da boca da fornalha
    const glow = 0.18 + pump * 0.08 + Math.sin(t * 13) * 0.03;
    disc(g, FX, 86, 42, `rgba(255,140,50,${glow * 0.45})`);
    disc(g, FX, 86, 26, `rgba(255,160,60,${glow * 0.55})`);
    for (let x = FX - 20; x < FX + 21; x++) {
      const h = 6 + 3 * Math.sin(t * 9 + x * 0.7) + 2 * Math.sin(t * 14 + x * 1.9) + pump * 4;
      for (let y = 0; y < h; y++) {
        const k = y / h;
        R(g, x, 93 - y, 1, 1, k < 0.3 ? '#ffe066' : k < 0.6 ? '#f2a65a' : k < 0.85 ? '#e0602a' : '#8a2a1a');
      }
    }
    for (let x = FX - 20; x < FX + 21; x += 3) R(g, x, 94, 2, 2, Math.sin(t * 5 + x) > 0 ? '#ff8030' : '#c04020');
    // fole: a tampa sobe e desce, a base fica no cavalete
    const bh = 3 + Math.round(pump * 6);
    O(g, 192, 93, 22, 2, '#8a5a34');
    O(g, 194, 93 - bh, 18, bh, '#6e4426');
    for (let y = 93 - bh + 2; y < 93; y += 3) R(g, 194, y, 18, 1, '#4a2e1e');
    O(g, 192, 91 - bh, 22, 2, '#8a5a34'); O(g, 186, 91 - bh, 6, 1, '#8a5a34');
    O(g, 214, 89, 3, 3, '#3a3634');
    // ferreiro atrás da bigorna, de frente: tenazes na mão esquerda, martelo na direita
    const cx = 158;
    // série de quatro golpes, depois ergue a peça com as tenazes para conferir e volta a bater
    const STRIKE = 1.5, SERIES = 4 * STRIKE + 4;
    const ls = t % SERIES;
    const hitting = ls < 4 * STRIKE;
    const ph = hitting ? (ls % STRIKE) / STRIKE : 0;
    const struck = hitting && lastPhase < 0.62 && ph >= 0.62;
    lastPhase = hitting ? ph : 0;
    let up = 0;
    if (hitting) { if (ph < 0.55) up = ph / 0.55; else if (ph < 0.62) up = 1 - (ph - 0.55) / 0.07; }
    up = up * up * (3 - 2 * up);
    const ins = hitting ? 0 : Math.sin(clamp((ls - 4 * STRIKE) / 4) * Math.PI);
    O(g, cx - 7, 90, 6, 26, '#3a3230'); O(g, cx + 1, 90, 6, 26, '#3a3230');
    torso(g, cx, 66, smith, 25); R(g, cx - 7, 66, 14, 2, smith.skin);
    head(g, cx - (ins > 0.4 ? 1 : 0), 55, { ...smith, look: ins > 0.4 ? -1 : 1 }, t);
    // bigorna na frente dele
    O(g, cx - 6, 104, 12, 12, '#3a3634'); O(g, cx - 12, 100, 24, 4, '#3a3634');
    O(g, cx - 16, 93, 32, 7, '#4a4644'); R(g, cx - 16, 93, 32, 1, '#8a8682');
    O(g, cx - 23, 94, 7, 3, '#4a4644'); O(g, cx - 27, 95, 4, 1, '#4a4644');
    heat = Math.max(0.35, heat - dt * 0.35);
    const hot = heat > 0.8 ? '#fff0b0' : heat > 0.55 ? '#ffb040' : '#e0602a';
    // braço esquerdo com as tenazes: segura a peça na bigorna ou a ergue na frente do rosto
    // ao conferir, ergue a peça ao lado do corpo, na altura dos olhos, sem tapar o rosto
    const thx = lerp(cx - 13, cx - 18, ins), thy = lerp(88, 72, ins);
    limb(g, armIKkeep(tongMem, cx - 9, 69, thx, thy, 11, 11, -1), 3, smith.shirt, smith.skin);
    const tipX = lerp(cx - 3, cx - 24, ins), tipY = lerp(91, 58, ins);
    seg(g, thx, thy, tipX, tipY, 1, '#2a2624'); seg(g, thx + 1, thy, tipX + 1, tipY + 1, 1, '#2a2624');
    if (ins > 0.05) { R(g, tipX - 12, tipY, 13, 2, hot); disc(g, tipX - 6, tipY + 1, 6, 'rgba(255,150,60,0.16)'); }
    else R(g, cx - 3, 91, 14, 2, hot);
    // braço direito com o martelo: ombro e cotovelo giram por ângulos fixos (sem cálculo de alcance),
    // então o arco do golpe é sempre o mesmo e o braço não vira de lado
    const D = Math.PI / 180;
    let a1: number, a2: number, ang: number;
    if (hitting) { a1 = lerp(60, -50, up); a2 = lerp(99, -100, up); ang = lerp(180, 250, up) + 40 * Math.sin(up * Math.PI); }
    else { a1 = lerp(60, 84, ins); a2 = lerp(99, 94, ins); ang = lerp(180, 90, ins); }
    const sx0 = cx + 8, sy0 = 69;
    const ex = sx0 + Math.cos(a1 * D) * 11, ey = sy0 + Math.sin(a1 * D) * 11;
    const hx = ex + Math.cos(a2 * D) * 11, hy = ey + Math.sin(a2 * D) * 11;
    limb(g, [[sx0, sy0], [ex, ey], [hx, hy]], 4, smith.shirt, smith.skin);
    const px = hx + Math.cos(ang * D) * 8, py = hy + Math.sin(ang * D) * 8;
    seg(g, hx, hy, px, py, 2, '#7a4a2a');
    O(g, px - 3, py - 3, 7, 6, '#3a3634'); R(g, px - 3, py - 3, 7, 1, '#8a8682');
    if (struck) {
      heat = 1;
      for (let i = 0; i < 16; i++) sparks.push({ x: cx + 5, y: 90, vx: (Math.random() - 0.5) * 2.6, vy: -0.8 - Math.random() * 2.2, life: 0, max: 0.4 + Math.random() * 0.5 });
    }
    if (hitting && ph > 0.62 && ph < 0.66) sparkle(g, cx + 5, 89, 3, '#fff8e0');
    sparks = sparks.filter((s) => (s.life += dt) < s.max);
    for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.16; R(g, s.x, s.y, 1, 1, s.life < s.max * 0.5 ? '#ffe066' : '#f2a65a'); }
    if (!engineEnv.reduceMotion && Math.random() < 0.02) steam.push({ x: 44 + Math.random() * 8, y: 96, life: 0 });
    steam = steam.filter((s) => (s.life += dt * 0.5) < 1);
    for (const s of steam) disc(g, s.x + Math.sin(s.life * 6) * 2, s.y - s.life * 26, 1.5 + s.life * 3, `rgba(230,225,215,${0.4 * (1 - s.life)})`);
  }

  return { focus: 205, back, draw };
}
