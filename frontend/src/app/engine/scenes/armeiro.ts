import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { engineEnv } from '../core/env';
import { lerp } from '../core/math';
import { SW } from '../core/stage';
import { armIK } from '../draw/ik';
import { disc, K, limb, O, R, seg, sparkle } from '../draw/primitives';
import { head, Person, torso } from '../figures/people';
import { floorBoards, planksV, revolver, rifle, RifleKind, sign, windowSky } from '../figures/props';
import { tinyText } from '../text/tiny-font';
import { SceneDef } from './scene';

// ---------- I · Armeiro ----------
export function createArmeiro(): SceneDef {
  const FY = 112;
  const armeiro: Person = { skin: '#d8a47a', skinD: '#b07a58', hair: '#b8b0a8', hairH: 0, side: true, stache: '#d8d0c8', brow: '#d8d0c8', glasses: true, shirt: '#ece4d4', apron: '#7a4a2a', blinkOff: 1.3 };
  const motes = Array.from({ length: 22 }, (_, i) => ({ x: 30 + (i * 37) % 120, y: 40 + (i * 23) % 70, s: 0.2 + (i % 5) * 0.06, ph: i }));
  const RIFLES: readonly RifleKind[] = [0, 1, 2, 0, 1];
  const PRICES: readonly (readonly [string, number])[] = [['$25', 220], ['$40', 238], ['$60', 256]];
  const AMMO: readonly (readonly [string, string, number, number])[] = [['C#', '#a83a2a', 84, 14], ['.NET', '#3a5a9a', 100, 18], ['SQL', '#5a7a3a', 120, 15]];
  const WALL_GUNS: readonly (readonly [number, number, string])[] = [[148, 32, '$12'], [172, 30, '$18']];

  function back(g: Ctx): void {
    planksV(g, 0, 0, SW, FY, '#7a5236', '#5e3e28', 10);
    R(g, 0, 0, SW, 6, '#4a3020'); R(g, 0, FY - 4, SW, 4, '#4a3020');
    floorBoards(g, FY, '#8a6040', '#6e4a30');
    windowSky(g, 18, 24, 48, 40, ['#f6c47a', '#f2a65a', '#e8884a', '#d87040']);
    R(g, 18, 52, 48, 12, '#b0704a'); R(g, 18, 56, 48, 8, '#9a5a3a');
    R(g, 41, 24, 2, 40, '#4a3020'); R(g, 18, 43, 48, 2, '#4a3020');
    // estante de rifles: winchesters de latão, espingarda de dois canos, rifle com luneta
    O(g, 210, 22, 96, 4, '#4a3020'); O(g, 210, 70, 96, 5, '#4a3020');
    for (let i = 0; i < 5; i++) { const x = 220 + i * 18; R(g, x - 3, 22, 1, 4, K); R(g, x + 4, 22, 1, 4, K); rifle(g, x, 26, RIFLES[i]); }
    PRICES.forEach(([p, x]) => { seg(g, x + 1, 26, x + 6, 30, 1, '#c8a870'); O(g, x + 3, 30, 13, 7, '#f3e3c3'); tinyText(g, p, x + 4, 31, '#8a2a20'); });
    // prateleiras com munição etiquetada
    O(g, 82, 42, 64, 3, '#4a3020'); O(g, 82, 66, 64, 3, '#4a3020');
    AMMO.forEach(([lbl, c, x, w]) => {
      O(g, x, 31, w, 10, c); R(g, x, 31, w, 2, shade(c, 1.3)); R(g, x + 1, 34, w - 2, 7, '#f3e3c3');
      tinyText(g, lbl, x + w / 2, 35, shade(c, 0.6), true);
    });
    O(g, 137, 29, 5, 12, '#5a8a4a'); R(g, 138, 31, 3, 3, '#f3e3c3');
    for (let i = 0; i < 6; i++) { O(g, 86 + i * 4, 58, 2, 7, '#c0902a'); R(g, 86 + i * 4, 58, 2, 2, '#8a6a3a'); }
    O(g, 112, 56, 13, 9, '#6a6662'); tinyText(g, 'API', 114, 58, '#f3e3c3');
    O(g, 128, 58, 14, 7, '#7a4a2a'); R(g, 128, 61, 14, 1, '#5a3820');
    sign(g, 168, 9, 'SKILLS');
    // revólveres na parede, com as etiquetas de preço
    WALL_GUNS.forEach(([x, y, p]) => {
      R(g, x + 4, y - 4, 1, 3, K); R(g, x + 14, y - 4, 1, 3, K);
      revolver(g, x, y);
      seg(g, x + 15, y + 2, x + 17, y + 8, 1, '#c8a870'); O(g, x + 13, y + 8, 12, 7, '#f3e3c3'); tinyText(g, p, x + 14, y + 9, '#8a2a20');
    });
    // aviso na parede
    O(g, 16, 70, 44, 16, '#f0dcb0'); R(g, 37, 68, 2, 2, '#8a8682');
    tinyText(g, 'CONSERTOS', 38, 72, '#5a3820', true); tinyText(g, 'E AJUSTES', 38, 79, '#8a2a20', true);
  }

  function front(g: Ctx): void {
    // balcão com vitrine de vidro: revólveres sobre veludo
    O(g, 96, 88, 140, 24, '#5e3e28');
    for (let x = 102; x < 230; x += 32) {
      R(g, x, 92, 26, 16, '#5a2626'); R(g, x, 92, 26, 1, '#3a1414');
      revolver(g, x + 4, 99, x % 64 === 38 ? '#8a8682' : '#6a6662', x % 64 === 38 ? '#c8b898' : '#7a4a2a');
      g.fillStyle = 'rgba(210,235,245,0.22)'; g.fillRect(x, 92, 26, 16);
      R(g, x + 3, 93, 1, 6, 'rgba(255,255,255,0.5)'); R(g, x + 5, 93, 1, 3, 'rgba(255,255,255,0.35)');
      R(g, x - 1, 92, 1, 16, '#4a3020');
    }
    O(g, 92, 84, 148, 4, '#8a5a34'); R(g, 92, 84, 148, 1, '#b07a48');
    // caixotes e barril
    O(g, 16, 94, 24, 18, '#9a6a40'); seg(g, 17, 95, 38, 110, 1, '#6e4a30'); seg(g, 38, 95, 17, 110, 1, '#6e4a30');
    O(g, 46, 90, 14, 22, '#7a4a2a'); R(g, 46, 95, 14, 1, '#3a3634'); R(g, 46, 106, 14, 1, '#3a3634');
    O(g, 270, 100, 20, 12, '#9a6a40'); R(g, 270, 105, 20, 1, '#6e4a30');
  }

  function draw(g: Ctx, t: number): void {
    // luz da janela e poeira no ar
    g.fillStyle = 'rgba(255,214,150,0.12)';
    for (let y = 64; y < 150; y++) { const k = (y - 64) / 86; g.fillRect(Math.round(18 + k * 40), y, Math.round(48 + k * 50), 1); }
    for (const m of motes) {
      const x = m.x + Math.sin(t * m.s + m.ph) * 6 + ((t * 2 * m.s) % 20);
      const y = m.y + Math.cos(t * m.s * 1.3 + m.ph) * 5;
      R(g, x, y, 1, 1, 'rgba(255,240,200,0.75)');
    }
    // armeiro
    const cx = 160;
    const breathe = Math.sin(t * 1.6) > 0.6 ? 1 : 0;
    torso(g, cx, 61 + breathe, armeiro, 26);
    head(g, cx, 50 + breathe, { ...armeiro, look: Math.sin(t * 0.37) > 0.92 ? -1 : 1 }, t);
    // revólver e pano: lustra devagar e, de tempos em tempos, ergue a arma para conferir o brilho
    const c = t % 26;
    const insp = c < 17 ? 0 : c < 18 ? (c - 17) : c < 22 ? 1 : c < 23 ? 1 - (c - 22) : 0;
    const e = insp * insp * (3 - 2 * insp);
    const gx = Math.round(lerp(146, 148, e)), gy = Math.round(lerp(79, 71, e));
    revolver(g, gx + 1, gy - 2, '#7a766e', '#6e4426');
    limb(g, armIK(cx - 9, 65 + breathe, gx + 2, gy + 2, 11, 11, -1), 3, armeiro.shirt, armeiro.skin);
    const k = 0.5 + 0.5 * Math.sin(t * 2.4);
    const hx = lerp(158 + k * 12, gx + 16, e), hy = lerp(gy - 1, gy + 1, e);
    limb(g, armIK(cx + 8, 65 + breathe, hx, hy, 11, 11, 1), 3, armeiro.shirt, armeiro.skin);
    if (e < 0.5) { O(g, hx - 3, hy - 1, 6, 3, '#e8e0d0'); R(g, hx - 3, hy + 1, 6, 1, '#c8c0b0'); }
    if ((t % 5.3) < 0.3 || (c > 19.5 && c < 20.2)) sparkle(g, gx + 22, gy - 3, 2);
    // lampião balançando
    const lx = 112 + Math.round(Math.sin(t * 1.1) * 1.5);
    seg(g, 112, 0, lx, 22, 1, '#3a3634');
    disc(g, lx, 28, 18, 'rgba(255,200,120,0.07)'); disc(g, lx, 28, 10, 'rgba(255,200,120,0.08)');
    O(g, lx - 3, 22, 6, 2, '#5a4a3a'); O(g, lx - 3, 25, 6, 7, '#d8c8a0'); R(g, lx - 2, 26, 4, 5, 'rgba(255,240,200,0.6)');
    R(g, lx - 1, 27 + (Math.sin(t * 17) > 0 ? 0 : 1), 2, 3, Math.sin(t * 11) > 0 ? '#ffd84a' : '#ffb030');
    O(g, lx - 4, 32, 8, 2, '#5a4a3a');
  }

  function after(g: Ctx, t: number): void {
    // gato dormindo no balcão
    const cx = 212;
    O(g, cx - 8, 78, 16, 6, '#8a8a90'); R(g, cx - 6, 78, 2, 6, '#6a6a70'); R(g, cx - 1, 78, 2, 6, '#6a6a70');
    O(g, cx + 7, 76, 7, 7, '#8a8a90'); R(g, cx + 7, 75, 2, 1, '#8a8a90'); R(g, cx + 12, 75, 2, 1, '#8a8a90');
    R(g, cx + 9, 79, 2, 1, K); R(g, cx + 12, 79, 1, 1, K);
    const flick = Math.sin(t * 1.3) > 0.6 ? Math.round(Math.sin(t * 6) * 1.5) : 0;
    limb(g, [[cx - 7, 83], [cx - 9, 90], [cx - 9 + flick, 96]], 2, '#8a8a90');
    const zt = (t % 3) / 3;
    if (!engineEnv.reduceMotion) { g.globalAlpha = 1 - zt; pixelZ(g, cx + 16 + zt * 6, 72 - zt * 14); g.globalAlpha = 1; }
  }

  function pixelZ(g: Ctx, x: number, y: number): void { R(g, x, y, 3, 1, '#f3e3c3'); R(g, x + 1, y + 1, 1, 1, '#f3e3c3'); R(g, x, y + 2, 3, 1, '#f3e3c3'); }

  return { focus: 165, back, front, draw, after };
}
