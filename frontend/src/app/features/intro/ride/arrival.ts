import { Rng } from '../../../engine/core/rng';
import { ditherPattern } from '../../../engine/draw/dither';
import { gateText } from '../../../engine/text/pixel-font';
import { drawMount, drawMountains, drawSky, drawTownAt } from './landscape';
import { Palette } from './palette';
import { RideSprites } from './sprites';
import { RideView, stageDisc as disc } from './stage';

// A chegada: a porteira da vila com a placa PORTFÓLIO, o ipê-amarelo soltando flores e o cartaz pregado no mourão.
// Também é o fundo da tela inicial e a cena fixa atrás do topo do site.

interface Petal { x: number; y: number; ph: number; v: number }

export class Arrival {
  private petals: Petal[] = [];

  constructor(private readonly v: RideView, private readonly pal: Palette, private readonly rng: Rng) {}

  draw(t: number, spr: RideSprites): void {
    const v = this.v, { ctx, W, H, horizon: HORIZON } = v, COL = this.pal;
    drawSky(v, t);
    drawMountains(v);
    drawTownAt(v, spr.town, t, 2, 0.3);
    ctx.fillStyle = '#d9a868'; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 40, HORIZON); ctx.lineTo(W / 2 + 40, HORIZON);
    ctx.lineTo(W / 2 + W * 0.5, H); ctx.lineTo(W / 2 - W * 0.5, H); ctx.closePath(); ctx.clip();
    ctx.fillStyle = ditherPattern(ctx, COL.road, 9); ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.restore();
    const gx0 = Math.round(W / 2 - 70), gx1 = Math.round(W / 2 + 70), gy = HORIZON + 30;
    this.drawIpe(t, gx1 + 34, gy + 6);
    // mourões mais altos e a trave
    const postTop = gy - 80;
    ctx.fillStyle = COL.k;
    ctx.fillRect(gx0 - 1, postTop, 8, gy - postTop + 2); ctx.fillRect(gx1 - 6, postTop, 8, gy - postTop + 2);
    ctx.fillStyle = '#6e4426'; ctx.fillRect(gx0, postTop + 1, 6, gy - postTop); ctx.fillRect(gx1 - 5, postTop + 1, 6, gy - postTop);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(gx0, postTop + 1, 2, gy - postTop); ctx.fillRect(gx1 - 5, postTop + 1, 2, gy - postTop);
    const beamY = postTop - 6;
    ctx.fillStyle = COL.k; ctx.fillRect(gx0 - 6, beamY, gx1 - gx0 + 13, 10);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(gx0 - 5, beamY + 1, gx1 - gx0 + 11, 8);
    ctx.fillStyle = '#a8743e'; ctx.fillRect(gx0 - 5, beamY + 1, gx1 - gx0 + 11, 2);
    ctx.fillStyle = '#5a3820'; for (let x = gx0; x < gx1; x += 9) ctx.fillRect(x, beamY + 5, 4, 1);
    // placa pendurada por correntes, balançando de leve
    const sway = Math.round(Math.sin(t * 1.3) * 1.2);
    const sw = 64, sh = 19, sx = Math.round(W / 2 - sw / 2) + sway, sy = beamY + 24;
    const hooks = [Math.round(W / 2 - 22), Math.round(W / 2 + 22)];
    hooks.forEach((hx) => {
      const ex = hx + sway;
      ctx.fillStyle = COL.k; ctx.fillRect(hx - 1, beamY + 9, 3, 2);
      for (let k = 0; k < 14; k++) {
        const x = Math.round(hx + (ex - hx) * k / 13), y = beamY + 11 + k;
        ctx.fillStyle = k % 2 ? '#5e5650' : '#b0a898'; ctx.fillRect(x, y, k % 2 ? 1 : 2, 1);
      }
    });
    ctx.fillStyle = COL.k; ctx.fillRect(sx - 1, sy - 1, sw + 2, sh + 2);
    for (let r = 0; r < sh; r++) {
      ctx.fillStyle = r % 6 === 5 ? '#8a5a34' : r % 6 === 0 ? '#d4a46a' : '#c08a52';
      ctx.fillRect(sx, sy + r, sw, 1);
    }
    ctx.fillStyle = '#5a3820'; [[3, 3], [sw - 4, 3], [3, sh - 4], [sw - 4, sh - 4]].forEach(([x, y]) => ctx.fillRect(sx + x, sy + y, 1, 1));
    gateText(ctx, 'PORTFÓLIO', Math.round(W / 2) + sway, sy + 7, '#2b1a10', '#e2b47a');
    // o cartaz pregado no mourão esquerdo
    ctx.fillStyle = COL.k; ctx.fillRect(gx0 + 6, gy - 34, 11, 14);
    ctx.fillStyle = COL.paper; ctx.fillRect(gx0 + 7, gy - 33, 9, 12);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(gx0 + 9, gy - 30, 5, 5); ctx.fillRect(gx0 + 8, gy - 32, 7, 1); ctx.fillRect(gx0 + 8, gy - 23, 7, 1);
    ctx.drawImage(spr.cactus[0], Math.round(gx0 - 40), gy - 40, 36, 60);
    drawMount(v, spr, 0);
  }

  // ipê-amarelo ao lado da porteira, soltando flores
  private drawIpe(t: number, x: number, baseY: number): void {
    const { ctx } = this.v, rng = this.rng, rnd = () => rng.next(), COL = this.pal;
    rng.seed = 321;
    ctx.fillStyle = COL.k; ctx.fillRect(x - 2, baseY - 46, 6, 47);
    ctx.fillStyle = '#5a4232'; ctx.fillRect(x - 1, baseY - 46, 4, 46);
    ctx.fillStyle = '#7a5a44'; ctx.fillRect(x - 1, baseY - 46, 1, 46);
    // galhos
    [[-10, -58], [12, -60], [-4, -66], [6, -54]].forEach(([dx, dy]) => {
      const n = Math.max(Math.abs(dx), Math.abs(dy + 46));
      for (let i = 0; i <= n; i++) {
        ctx.fillStyle = '#4a3426';
        ctx.fillRect(Math.round(x + 1 + dx * i / n), Math.round(baseY - 46 + (dy + 46) * i / n), 2, 1);
      }
    });
    // copa: bolotas amarelas com sombra e brilho
    const blobs = [[0, -66, 14], [-12, -60, 11], [13, -60, 12], [-5, -54, 10], [8, -52, 9], [-16, -52, 7], [18, -52, 7]];
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx, baseY + dy + 1, r + 1, '#8a5a1a'));
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx, baseY + dy, r, '#e8b020'));
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx - r * 0.3, baseY + dy - r * 0.35, r * 0.55, '#ffd84a'));
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * 20;
      ctx.fillStyle = rnd() < 0.5 ? '#fff1a0' : '#c98a10';
      ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(baseY - 60 + Math.sin(a) * rr * 0.6), 1, 1);
    }
    // flores caindo
    if (this.petals.length < 14 && Math.random() < 0.08) this.petals.push({ x: x - 18 + Math.random() * 36, y: baseY - 56, ph: Math.random() * 6, v: 6 + Math.random() * 6 });
    for (const pt of this.petals) { pt.y += pt.v / 60; pt.x += Math.sin(t * 2 + pt.ph) * 0.15 - 0.05; }
    this.petals = this.petals.filter((pt) => pt.y < baseY + 18);
    ctx.fillStyle = '#ffd23a';
    for (const pt of this.petals) ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 1, 1);
  }
}
