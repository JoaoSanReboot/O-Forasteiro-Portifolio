import { Ctx } from '../core/canvas';
import { clamp, lerp } from '../core/math';
import { SH, SW } from '../core/stage';
import { disc, limb, O, Pt, R } from '../draw/primitives';
import { DuelAnim } from '../scenes/duel-state';
import { Duelist } from './duelist';

// As armas do visitante no duelo: cada personagem luta do seu jeito (duas pistolas, laço, rolo de amassar pão e rifle).

const ROPE = '#c8a060', ROPE_D = '#8a6a3a';
function ellipsePts(g: Ctx, cx: number, cy: number, rx: number, ry: number, col: string, phase: number, step = 0.3): void {
  for (let a = 0; a < Math.PI * 2; a += step) R(g, Math.round(cx + Math.cos(a + phase) * rx), Math.round(cy + Math.sin(a + phase) * ry), 1, 1, col);
}
function ropeLine(g: Ctx, x0: number, y0: number, x1: number, y1: number, sag = 3): void {
  const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag), 1, 1, i % 4 === 0 ? ROPE_D : ROPE); }
}
function pistol(g: Ctx, x: number, y: number, col: string): void { O(g, x, y, 7, 2, col); R(g, x, y + 2, 2, 3, '#5a3820'); }
function muzzle(g: Ctx, x: number, y: number, big?: boolean): void { disc(g, x, y, big ? 6 : 4, '#fff6c0'); disc(g, x, y, big ? 3 : 2, '#ffffff'); }
function smoke(g: Ctx, x: number, y: number, k: number): void { for (let i = 0; i < 5; i++) { const s = clamp(k * 1.2 - i * 0.12); if (s <= 0 || s >= 1) continue; R(g, Math.round(x + s * 12 + i), Math.round(y - s * 10 - i), 2, 2, `rgba(220,214,200,${0.55 * (1 - s)})`); } }
function rollingPin(g: Ctx, x: number, y: number, ang: number): void {
  g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang);
  O(g, -6, -1, 12, 3, '#c89a5a'); R(g, -5, -1, 10, 1, '#e0b878'); R(g, -9, 0, 3, 1, '#8a5a2a'); R(g, 6, 0, 3, 1, '#8a5a2a');
  g.restore();
}
function rifleLine(g: Ctx, x0: number, y0: number, x1: number, y1: number, metal: string): void {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k)), 1, 2, k < 0.36 ? '#7a4a28' : k < 0.48 ? '#3a3634' : metal); }
}
/** a arma do visitante na mão do duelista, conforme a animação do duelo (o revólver é desenhado pelo próprio duelista) */
export function drawPlayerWeapon(g: Ctx, cx: number, P: Duelist, A: DuelAnim, t: number): void {
  const now = performance.now(), since = now - A.at;
  const arm = (pts: readonly Pt[]) => limb(g, pts, 3, P.shirt, P.skin);
  const metal = P.gun || '#6a6662';
  const tw = A.mode === 'wait' || A.mode === 'draw' ? Math.round(Math.sin(t * 9)) : 0;
  const idleLeft = () => arm([[cx - 9, 77], [cx - 11, 84], [cx - 10, 91]]);
  if (A.weapon === 'twin') {
    // dois coldres; no saque as duas pistolas sobem juntas, cada uma com o seu disparo
    O(g, cx - 9, 91, 3, 6, '#5a3820'); O(g, cx + 6, 91, 3, 6, '#5a3820');
    if (!A.shots.length) {
      arm([[cx - 9, 77], [cx - 11, 84], [cx - 9, 89 + tw]]); arm([[cx + 8, 77], [cx + 10, 84], [cx + 8, 89 - tw]]);
      R(g, cx - 9, 89, 2, 2, metal); R(g, cx + 7, 89, 2, 2, metal);
      return;
    }
    arm([[cx - 9, 78], [cx + 4, 84], [cx + 20, 82]]); pistol(g, cx + 20, 80, metal);
    arm([[cx + 8, 77], [cx + 16, 77], [cx + 24, 76]]); pistol(g, cx + 24, 74, metal);
    A.shots.forEach((s) => { const d = now - s.at; if (d < 150) muzzle(g, s.side === 'R' ? cx + 33 : cx + 29, s.side === 'R' ? 75 : 81); else if (d < 900) smoke(g, s.side === 'R' ? cx + 32 : cx + 28, s.side === 'R' ? 73 : 79, d / 900); });
    return;
  }
  if (A.weapon === 'lasso') {
    idleLeft();
    if (A.mode === 'spin') {
      // girando o laço por cima da cabeça: quanto mais tempo, mais rápido
      arm([[cx + 8, 77], [cx + 11, 67], [cx + 12, 58]]);
      const ph = (now / 1000) * (7 + A.charge * 12);
      ellipsePts(g, cx + 12, 51, 11, 3, ROPE, ph, 0.26);
      ropeLine(g, cx + 12, 58, Math.round(cx + 12 + Math.cos(ph) * 11), Math.round(51 + Math.sin(ph) * 3), 0);
      if (Math.sin(now / 70) > 0.3) R(g, Math.round(cx + 12 + Math.cos(ph + 1) * 13), 50, 2, 1, 'rgba(255,255,255,0.6)');
      return;
    }
    if (A.mode === 'throw' || A.mode === 'caught' || A.mode === 'fall') {
      arm([[cx + 8, 77], [cx + 16, 72], [cx + 22, 70]]);
      const k = clamp(since / 420), ek = 1 - (1 - k) * (1 - k);
      const tx = A.mode === 'fall' ? 168 : 214, ty = A.mode === 'fall' ? 110 : 82;
      const lx = lerp(cx + 22, tx, ek), ly = lerp(58, ty, ek) - Math.sin(k * Math.PI) * 18;
      ropeLine(g, cx + 22, 70, Math.round(lx), Math.round(ly), A.mode === 'fall' ? 6 : 3);
      if (A.mode === 'caught' && k >= 1) {
        // laçado: duas voltas de corda prendem os braços do João, e ele balança
        const wob = Math.round(Math.sin(now / 90) * 1);
        ellipsePts(g, 214 + wob, 80, 10, 2, ROPE, 0, 0.18); ellipsePts(g, 214 + wob, 86, 10, 2, ROPE, 1.1, 0.18);
        if (since < 700) for (let i = 0; i < 6; i++) R(g, 214 + Math.round(Math.cos(i) * (6 + since / 60)), 82 + Math.round(Math.sin(i) * (2 + since / 200)), 1, 1, '#fff6c0');
      } else ellipsePts(g, Math.round(lx), Math.round(ly), lerp(11, 7, k), lerp(3, 4, k), ROPE, k * 7, 0.28);
      return;
    }
    // laço enrolado na cintura
    arm([[cx + 8, 77], [cx + 10, 84], [cx + 10, 90 - tw]]);
    ellipsePts(g, cx + 11, 93, 4, 3, ROPE, 0, 0.35); ellipsePts(g, cx + 11, 93, 3, 2, ROPE_D, 0.5, 0.45);
    return;
  }
  if (A.weapon === 'pin') {
    if (A.mode === 'wind') {
      // tomando impulso: o rolo sobe, treme mais a cada toque e sai fumaça da cabeça
      const sh = Math.round(Math.sin(now / 35) * (1 + A.charge * 2.5));
      arm([[cx - 9, 77], [cx - 13, 67], [cx - 7 + sh, 56]]); arm([[cx + 8, 77], [cx + 12, 67], [cx + 6 + sh, 56]]);
      rollingPin(g, cx + sh, 55, 0);
      if (A.charge > 0.35) for (let i = 0; i < 3; i++) { const s = ((now / 500) + i / 3) % 1; R(g, cx - 7 + i * 6, Math.round(52 - s * 12), 2, 2, `rgba(255,255,255,${0.75 * (1 - s)})`); }
      if (A.charge > 0.65) { R(g, cx - 4, 66, 2, 1, '#c0392b'); R(g, cx + 2, 66, 2, 1, '#c0392b'); }
      return;
    }
    if (A.mode === 'throw') {
      idleLeft(); arm([[cx + 8, 77], [cx + 16, 70], [cx + 22, 66]]);
      const k = clamp(since / 360);
      if (k < 1) rollingPin(g, lerp(cx + 22, 211, k), lerp(62, 60, k) - Math.sin(k * Math.PI) * 14, k * 14);
      else {
        // PLAFT: o rolo quica de volta e cai; estrelinhas girando na cabeça do João
        const k2 = clamp((since - 360) / 650);
        rollingPin(g, lerp(207, 186, k2), lerp(58, 110, k2 * k2), 14 + k2 * 7);
        if (since - 360 < 240) { disc(g, 214, 60, 7, '#fff6c0'); [[-11, 0], [11, 0], [0, -11], [0, 11], [-8, -8], [8, 8], [-8, 8], [8, -8]].forEach(([dx, dy]) => R(g, 214 + dx, 60 + dy, 2, 2, '#f6d870')); }
        for (let i = 0; i < 3; i++) { const a = now / 240 + i * 2.1; R(g, Math.round(214 + Math.cos(a) * 9), Math.round(55 + Math.sin(a) * 2), 2, 2, i % 2 ? '#f6d870' : '#ffffff'); }
      }
      return;
    }
    if (A.mode === 'drop') {
      idleLeft(); arm([[cx + 8, 77], [cx + 10, 84], [cx + 10, 91]]);
      const k = clamp(since / 500); rollingPin(g, cx + 14, lerp(88, 110, k * k), k * 2);
      return;
    }
    // o rolo de amassar pão nas duas mãos, batendo de leve na palma
    const tap = Math.sin(t * 4) > 0.6 ? 1 : 0;
    arm([[cx - 9, 77], [cx - 8, 84], [cx - 4, 88 + tw + tap]]); arm([[cx + 8, 77], [cx + 8, 84], [cx + 4, 88 + tw]]);
    rollingPin(g, cx, 88 + tw + tap, 0);
    return;
  }
  if (A.weapon === 'rifle') {
    if (A.mode === 'cock' || A.mode === 'aim' || A.mode === 'fire') {
      // rifle no ombro: engatilha, a mira balança e dispara com coice e fumaça
      const sway = A.mode === 'aim' ? Math.round(Math.sin(now / 150)) : 0;
      const recoil = A.mode === 'fire' && since < 170 ? -3 : 0;
      arm([[cx - 9, 77], [cx + 2, 81], [cx + 13 + recoil, 77 + sway]]); arm([[cx + 8, 77], [cx + 5, 80], [cx + 2 + recoil, 76 + sway]]);
      rifleLine(g, cx - 3 + recoil, 75 + sway, cx + 31 + recoil, 75 + sway, metal);
      if (A.mode === 'cock' && since < 280) { R(g, cx + 9, 77 + sway + (since < 140 ? 2 : 0), 3, 3, '#3a3634'); if (since > 120) R(g, cx + 12, 71, 2, 1, '#fff6c0'); }
      if (A.mode === 'fire') {
        if (since < 190) { muzzle(g, cx + 35, 75, true); g.fillStyle = 'rgba(255,248,220,0.4)'; g.fillRect(0, 0, SW, SH); }
        smoke(g, cx + 33, 72, since / 1100);
      }
      return;
    }
    arm([[cx - 9, 77], [cx - 6, 86], [cx - 2, 91 + tw]]); arm([[cx + 8, 77], [cx + 10, 82], [cx + 8, 79 + tw]]);
    rifleLine(g, cx - 6, 97, cx + 12, 73, metal);
    return;
  }
}
