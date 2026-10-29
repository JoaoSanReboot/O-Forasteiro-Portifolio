import { Ctx, makeCanvas } from '../core/canvas';
import { clamp } from '../core/math';

// ---------- Pontilhado (usado pela abertura) ----------
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const patternCache = new WeakMap<Ctx, Map<string, CanvasPattern>>();

export function ditherPattern(ctx: Ctx, color: string, level: number): CanvasPattern {
  let cache = patternCache.get(ctx);
  if (!cache) { cache = new Map(); patternCache.set(ctx, cache); }
  const key = color + level;
  const hit = cache.get(key);
  if (hit) return hit;
  const [c, g] = makeCanvas(4, 4);
  g.fillStyle = color;
  for (let i = 0; i < 16; i++) if (BAYER[i] < level) g.fillRect(i % 4, Math.floor(i / 4), 1, 1);
  const p = ctx.createPattern(c, 'repeat')!;
  cache.set(key, p);
  return p;
}

/** cobre a tela inteira (W × H) com a cor, na proporção `amount` */
export function ditherFill(ctx: Ctx, W: number, H: number, color: string, amount: number): void {
  const level = Math.round(clamp(amount) * 16);
  if (level <= 0) return;
  if (level >= 16) { ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); return; }
  ctx.fillStyle = ditherPattern(ctx, color, level);
  ctx.fillRect(0, 0, W, H);
}
