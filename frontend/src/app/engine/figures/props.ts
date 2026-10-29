import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { sceneRng } from '../core/rng';
import { SH, SW } from '../core/stage';
import { K, O, R } from '../draw/primitives';
import { pixelText, textWidth } from '../text/pixel-font';

export function planksV(g: Ctx, x: number, y: number, w: number, h: number, base: string, seam: string, step: number): void {
  R(g, x, y, w, h, base);
  g.fillStyle = seam;
  for (let px = x + step - 1; px < x + w; px += step) g.fillRect(px, y, 1, h);
  const rnd = sceneRng;
  rnd.seed = 17;
  for (let i = 0; i < w * h / 500; i++) { g.fillStyle = shade(base, 0.85 + rnd.next() * 0.3); g.fillRect(Math.floor(x + rnd.next() * w), Math.floor(y + rnd.next() * h), 1, 2 + Math.floor(rnd.next() * 3)); }
}

export function floorBoards(g: Ctx, y: number, base: string, seam: string): void {
  R(g, 0, y, SW, SH - y, base);
  g.fillStyle = seam;
  for (let yy = y + 5, r = 0; yy < SH; yy += 6, r++) { g.fillRect(0, yy, SW, 1); for (let x = (r % 2) * 23; x < SW; x += 46) g.fillRect(x, yy - 5, 1, 5); }
  R(g, 0, y, SW, 1, shade(base, 0.6));
}

export function windowSky(g: Ctx, x: number, y: number, w: number, h: number, colors: readonly string[]): void {
  O(g, x - 3, y - 3, w + 6, h + 6, '#4a3020');
  colors.forEach((c, i) => R(g, x, y + Math.floor(i * h / colors.length), w, Math.ceil(h / colors.length), c));
}

export function sign(g: Ctx, cx: number, y: number, text: string): void {
  const w = textWidth(text) + 10;
  O(g, cx - w / 2, y, w, 12, '#ecd6a6');
  R(g, cx - w / 2, y + 11, w, 1, '#c8a870');
  pixelText(g, text, cx, y + 3, '#2b1a10');
}

// revólver detalhado, apontando para a direita (x, y = canto de cima do corpo da arma)
export function revolver(g: Ctx, x: number, y: number, c = '#6a6662', wood = '#7a4a2a'): void {
  O(g, x - 1, y + 3, 3, 6, wood); R(g, x, y + 4, 1, 4, shade(wood, 1.3)); R(g, x - 2, y + 7, 1, 2, wood);
  R(g, x + 1, y + 6, 1, 1, '#c0902a');
  O(g, x + 2, y, 6, 4, c);
  O(g, x + 4, y - 1, 5, 5, shade(c, 1.15)); R(g, x + 5, y, 1, 3, shade(c, 0.7)); R(g, x + 7, y, 1, 3, shade(c, 0.7));
  O(g, x + 9, y, 11, 2, c); R(g, x + 9, y, 11, 1, '#c8c4bc'); R(g, x + 19, y - 1, 1, 1, K);
  R(g, x + 9, y + 2, 7, 1, shade(c, 0.6));
  R(g, x + 1, y - 2, 2, 2, K);
  R(g, x + 4, y + 4, 1, 2, K); R(g, x + 5, y + 6, 3, 1, K); R(g, x + 8, y + 4, 1, 2, K); R(g, x + 6, y + 4, 1, 2, '#3a3634');
}

/** 0 winchester de latão, 1 espingarda de dois canos, 2 rifle com luneta */
export type RifleKind = 0 | 1 | 2;

// rifle em pé na estante (x = cano, top = ponta)
export function rifle(g: Ctx, x: number, top: number, kind: RifleKind): void {
  const steel = '#4a4644', brass = '#c0902a', wood = kind === 2 ? '#5a3820' : '#7a4a2a';
  if (kind === 1) { O(g, x - 1, top, 2, 26, steel); O(g, x + 1, top, 2, 26, steel); R(g, x - 1, top, 1, 26, '#8a8682'); }
  else { O(g, x, top, 2, 26, steel); R(g, x, top, 1, 26, '#8a8682'); O(g, x + 2, top + 4, 1, 18, '#3a3634'); }
  O(g, x - 2, top + 12, 6, 9, wood); R(g, x - 2, top + 12, 1, 9, shade(wood, 1.3));
  for (let i = 0; i < 3; i++) R(g, x - 1, top + 14 + i * 2, 4, 1, shade(wood, 0.75));
  O(g, x - 1, top + 26, 5, 6, kind === 0 ? brass : steel); R(g, x, top + 27, 1, 4, kind === 0 ? '#e8c060' : '#8a8682');
  if (kind !== 1) { R(g, x + 4, top + 30, 1, 5, K); R(g, x + 1, top + 34, 4, 1, K); }
  O(g, x - 2, top + 32, 6, 4, wood); O(g, x - 3, top + 36, 7, 7, wood); O(g, x - 3, top + 43, 7, 2, '#3a3634');
  R(g, x - 2, top + 33, 1, 10, shade(wood, 1.3));
  if (kind === 2) { O(g, x - 1, top + 6, 4, 4, '#2a2624'); R(g, x, top + 6, 1, 1, '#8ab0c0'); }
}
