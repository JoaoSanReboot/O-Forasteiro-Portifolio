import { ditherPattern } from '../../../engine/draw/dither';
import { Palette } from './palette';
import { RideSprites } from './sprites';
import { groundY, project as projectOn, RideView, stageDisc as disc } from './stage';

// O cenário fixo da estrada: céu com o sol, serra, a vila no horizonte, o chão e o cavalo galopando

export function drawSky(v: RideView, t: number): void {
  const { ctx, W, horizon: HORIZON } = v;
  const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
  g.addColorStop(0, '#d9813f'); g.addColorStop(0.55, '#f0b567'); g.addColorStop(1, '#f9e3b0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON);
  ctx.fillStyle = ditherPattern(ctx, '#fff1cf', 4); ctx.fillRect(0, HORIZON - 14, W, 14);
  const sx = Math.round(W * 0.7), sy = Math.round(HORIZON * 0.42);
  const pulse = Math.sin(t * 2) * 0.6;
  disc(ctx, sx, sy, 30 + pulse, 'rgba(255,236,190,0.18)');
  disc(ctx, sx, sy, 22 + pulse, 'rgba(255,240,205,0.28)');
  disc(ctx, sx, sy, 15, '#fff3d6');
  disc(ctx, sx, sy, 12, '#fffbea');
}

export function drawMountains(v: RideView): void {
  const { ctx, W, horizon: HORIZON } = v;
  ctx.fillStyle = '#c48b62';
  for (let x = 0; x < W; x++) {
    const h = 6 + Math.round(Math.sin(x * 0.045) * 4 + Math.sin(x * 0.11 + 1) * 2 + Math.sin(x * 0.017) * 5);
    ctx.fillRect(x, HORIZON - h, 1, h);
  }
  ctx.fillStyle = '#b07a56';
  for (let x = 0; x < W; x++) {
    const h = 2 + Math.round(Math.sin(x * 0.07 + 2) * 2 + Math.sin(x * 0.023) * 3);
    if (h > 0) ctx.fillRect(x, HORIZON - h, 1, h);
  }
}

/** a vila no horizonte, tremendo no calor (`haze`) e crescendo conforme o cavalo se aproxima (`scale`) */
export function drawTownAt(v: RideView, town: HTMLCanvasElement, t: number, scale: number, haze: number): void {
  const { ctx, W, horizon: HORIZON } = v;
  const img = town;
  const w = img.width * scale, h = img.height * scale;
  const x0 = W / 2 - w / 2, y0 = HORIZON - h + Math.max(1, scale * 1.5);
  const slices = Math.max(6, Math.round(h / 2));
  for (let i = 0; i < slices; i++) {
    const sy = (img.height / slices) * i, sh = img.height / slices;
    const off = Math.round(Math.sin(t * 7 + i * 0.9) * haze);
    ctx.drawImage(img, 0, sy, img.width, sh, Math.round(x0 + off), Math.round(y0 + (h / slices) * i), Math.round(w), Math.ceil(h / slices));
  }
}

/** chão, estrada e as marcas que passam (`dist` é o quanto o cavalo já andou) */
export function drawGround(v: RideView, pal: Palette, dist: number): void {
  const { ctx, W, H, horizon: HORIZON } = v;
  const project = (wx: number, z: number) => projectOn(v, wx, z);
  const g = ctx.createLinearGradient(0, HORIZON, 0, H);
  g.addColorStop(0, '#e4b97e'); g.addColorStop(1, '#c98f55');
  ctx.fillStyle = g; ctx.fillRect(0, HORIZON, W, H - HORIZON);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W / 2 - 2, HORIZON); ctx.lineTo(W / 2 + 2, HORIZON);
  ctx.lineTo(W / 2 + W * 0.32, H); ctx.lineTo(W / 2 - W * 0.32, H); ctx.closePath(); ctx.clip();
  ctx.fillStyle = ditherPattern(ctx, pal.road, 7); ctx.fillRect(0, HORIZON, W, H - HORIZON);
  for (let i = 0; i < 18; i++) {
    const z = ((i * 14 - dist) % 252 + 252) % 252 + 4;
    for (const side of [-1, 1]) {
      const q = project(side * 14, z);
      ctx.fillStyle = 'rgba(160,110,64,0.55)';
      ctx.fillRect(Math.round(q.x), Math.round(q.y), Math.max(1, Math.round(q.s)), Math.max(1, Math.round(q.s * 3)));
    }
  }
  ctx.restore();
  for (let i = 0; i < 14; i++) {
    const z = ((i * 18 - dist) % 252 + 252) % 252 + 4;
    const q = project(0, z);
    ctx.fillStyle = 'rgba(185,132,80,0.22)';
    ctx.fillRect(0, Math.round(q.y), W, Math.max(1, Math.round(q.s * 0.6)));
  }
}

/** o cavalo com o cavaleiro no quadro `frame` do galope, centrado logo acima da faixa de baixo */
export function drawMount(v: RideView, spr: RideSprites | null, frame: number): void {
  const img = spr && spr.mount[frame];
  if (!img) return;
  const { ctx, W } = v;
  const x = Math.round(W / 2 - spr.mount[0].width / 2), y = Math.round(groundY(v) - spr.mount[0].height + 3);
  ctx.fillStyle = 'rgba(80,44,20,0.35)';
  ctx.fillRect(x + 12, groundY(v) + 1, img.width - 24, 2);
  ctx.drawImage(img, x, y);
}
