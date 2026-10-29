import { Ctx } from '../core/canvas';
import { lerp } from '../core/math';

export type Pt = readonly [number, number];

/** contorno (tição) */
export const K = '#1b120d';

export function R(g: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** retângulo com contorno de 1 px */
export function O(g: Ctx, x: number, y: number, w: number, h: number, c: string): void {
  R(g, x - 1, y - 1, w + 2, h + 2, K);
  R(g, x, y, w, h, c);
}

// a abertura tinha uma cópia com raio mínimo de 0,5; para r ≥ 0 as duas desenham os mesmos pixels
export function disc(g: Ctx, x: number, y: number, r: number, c: string): void {
  g.fillStyle = c;
  for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
    const w = Math.floor(Math.sqrt(r * r - dy * dy));
    g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
  }
}

export function seg(g: Ctx, x0: number, y0: number, x1: number, y1: number, w: number, c: string): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  g.fillStyle = c;
  for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w);
}

// braço/perna: contorno primeiro, cor por cima
export function limb(g: Ctx, pts: readonly Pt[], w: number, c: string, c2?: string | null): void {
  if (pts.length !== 3) {
    for (let i = 0; i < pts.length - 1; i++) seg(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w + 2, K);
    for (let i = 0; i < pts.length - 1; i++) seg(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, i === pts.length - 2 && c2 ? c2 : c);
    return;
  }
  // ombro, cotovelo e mão viram uma curva suave (sem quina no cotovelo); o cotovelo puxa a curva sem exagerar
  const [S, E, H] = pts;
  const C = [lerp((S[0] + H[0]) / 2, E[0], 1.1), lerp((S[1] + H[1]) / 2, E[1], 1.1)];
  const n = Math.max(8, Math.ceil(Math.hypot(E[0] - S[0], E[1] - S[1]) + Math.hypot(H[0] - E[0], H[1] - E[1])) * 2);
  const P: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; P.push([u * u * S[0] + 2 * u * t * C[0] + t * t * H[0], u * u * S[1] + 2 * u * t * C[1] + t * t * H[1], t]); }
  g.fillStyle = K;
  for (const [x, y] of P) g.fillRect(Math.round(x - (w + 2) / 2), Math.round(y - (w + 2) / 2), w + 2, w + 2);
  for (const [x, y, t] of P) { g.fillStyle = t > 0.52 && c2 ? c2 : c; g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
}

export function sparkle(g: Ctx, x: number, y: number, s: number, c = '#fff8e0'): void {
  R(g, x, y - s, 1, s * 2 + 1, c);
  R(g, x - s, y, s * 2 + 1, 1, c);
}
