import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { lerp } from '../core/math';
import { K, O, R, sparkle } from '../draw/primitives';

/** o que muda de um baú para outro */
export interface ChestLook {
  num: string;
  wood: string;
  iron: string;
  trim: string;
  /** baú ainda quente da forja (projeto em produção) */
  hot?: boolean;
}

// algarismo romano entalhado: hastes de 2 px com serifas em cima e embaixo
function numeral(g: Ctx, n: string, cx: number, y: number, c: string): void {
  const k = n.length, w = k * 2 + (k - 1) * 2, x0 = Math.round(cx - w / 2);
  for (let i = 0; i < k; i++) R(g, x0 + i * 4, y + 1, 2, 5, c);
  R(g, x0 - 1, y, w + 2, 1, c); R(g, x0 - 1, y + 6, w + 2, 1, c);
  g.fillStyle = 'rgba(255,240,200,0.35)'; for (let i = 0; i < k; i++) g.fillRect(x0 + i * 4, y + 1, 1, 5);
}

/** baú de ferreiro em 64 × 58; k = quanto a tampa está aberta (0..1) */
export function drawChest(g: Ctx, P: ChestLook, k: number, tt: number): void {
  g.clearRect(0, 0, 64, 58);
  // sombra
  g.fillStyle = 'rgba(40,24,12,0.25)'; g.fillRect(8, 54, 48, 2); g.fillRect(12, 56, 40, 1);
  const lift = Math.round(k * 6);
  // tampa abaulada, presa por dobradiça atrás: a base dela nunca sai do corpo
  const inside = k > 0.5;
  const lw = 52 - Math.round(k * 4), lx = Math.round(32 - lw / 2);
  const ly = Math.round(lerp(8, 1, k)), lb = 24;
  const lh = lb - ly;
  g.fillStyle = K; g.fillRect(lx - 1, ly + 1, lw + 2, lh); g.fillRect(lx + 1, ly - 1, lw - 2, 3);
  g.fillStyle = inside ? shade(P.wood, 0.55) : P.wood; g.fillRect(lx, ly + 2, lw, lh - 2); g.fillRect(lx + 2, ly, lw - 4, 2);
  g.fillStyle = shade(P.wood, inside ? 0.75 : 1.25); g.fillRect(lx + 2, ly, lw - 4, 1);
  for (let y = ly + 4; y < lb - 1; y += 4) R(g, lx, y, lw, 1, shade(P.wood, inside ? 0.45 : 0.8));
  [lx + 4, lx + lw - 8].forEach((bx) => { R(g, bx, ly - 1, 4, lh, P.iron); R(g, bx + 1, ly, 1, lh - 2, shade(P.iron, inside ? 1.1 : 1.5)); R(g, bx + 1, ly + 2, 2, 1, '#b0aca4'); });
  // interior aberto e o brilho do que está guardado
  if (k > 0.3) {
    const a = Math.min(1, (k - 0.3) * 2);
    O(g, 8, 21, 48, 3, '#2a1810');
    g.fillStyle = `rgba(255,214,120,${0.7 * a})`; g.fillRect(9, 21, 46, 2);
    for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,224,150,${0.2 * a})`; g.fillRect(14 + i * 9, 21 - 14 * a, 3, 14 * a); }
  }
  // corpo
  O(g, 6, 23, 52, 30, P.wood);
  for (let y = 27; y < 53; y += 5) R(g, 6, y, 52, 1, shade(P.wood, 0.78));
  R(g, 6, 23, 2, 30, shade(P.wood, 1.2)); R(g, 54, 23, 4, 30, shade(P.wood, 0.75));
  // ferragens
  [10, 50].forEach((bx) => { O(g, bx, 23, 4, 30, P.iron); R(g, bx + 1, 23, 1, 30, shade(P.iron, 1.5)); [27, 38, 48].forEach((ry) => R(g, bx + 1, ry, 2, 2, '#b0aca4')); });
  O(g, 6, 50, 52, 3, P.iron); R(g, 6, 50, 52, 1, shade(P.iron, 1.5));
  O(g, 6, 23, 52, 2, P.iron);
  // fechadura com o número
  const hot = P.hot ? 0.5 + 0.5 * Math.sin(tt * 3) : 0;
  O(g, 23, 25, 18, 17, P.iron); R(g, 24, 26, 16, 1, shade(P.iron, 1.5));
  [[24, 26], [39, 26], [24, 40], [39, 40]].forEach(([x, y]) => R(g, x, y, 1, 1, '#b0aca4'));
  O(g, 25, 28, 14, 10, P.trim); R(g, 26, 29, 12, 8, '#1b120d');
  numeral(g, P.num, 32, 30, '#f3e3c3');
  R(g, 31, 39, 2, 2, K); R(g, 31, 40, 2, 1, '#1b120d');
  // argola lateral
  R(g, 2, 33, 1, 5, K); R(g, 3, 32, 3, 1, K); R(g, 3, 38, 3, 1, K); R(g, 3, 33, 1, 5, P.iron);
  if (P.hot) {
    // baú ainda quente da forja: as ferragens brilham e solta fumaça
    g.fillStyle = `rgba(255,120,40,${0.25 + hot * 0.25})`; g.fillRect(10, 23, 4, 30); g.fillRect(50, 23, 4, 30); g.fillRect(6, 50, 52, 3);
    for (let i = 0; i < 3; i++) { const s = (tt * 0.4 + i / 3) % 1; g.fillStyle = `rgba(220,210,200,${0.35 * (1 - s)})`; g.fillRect(Math.round(18 + i * 13 + Math.sin(tt + i) * 2), Math.round(6 - lift - s * 6), 2 + Math.round(s * 2), 2); }
  }
  // brilho de metal de vez em quando
  if ((tt % 3.4) < 0.18) sparkle(g, 47, 25, 2, '#fff8e0');
}
