import { clamp, easeIn, prog } from '../../engine/core/math';
import { Rng } from '../../engine/core/rng';
import { ditherPattern } from '../../engine/draw/dither';
import { Palette } from './palette';
import { RideSprites } from './sprites';
import { FOCAL, groundY, project, RideView } from './stage';
import { TIMELINE as P } from './timeline';

// O que voa na estrada: bolas de feno, poeira dos cascos e os panfletos de procurado erguidos pelo vento

interface Weed { dir: number; z: number; x: number; phase: number; spin: number; speed: number }
interface Dust { x: number; y: number; vx: number; vy: number; r: number; grow: number; life: number; max: number }
interface Paper { x: number; y: number; side: number; vx: number; vy: number; flip: number; spin: number; phase: number; size: number; life: number; max: number }

/** bolas de feno rolando de um lado para o outro da estrada */
export class Tumbleweeds {
  private weeds: Weed[] = [];
  private readonly rnd: () => number;

  constructor(private readonly v: RideView, rng: Rng) { this.rnd = () => rng.next(); }

  reset(): void { this.weeds = []; }

  update(p: number, dt: number, rate: number, spr: RideSprites): void {
    const { ctx, W } = this.v, rnd = this.rnd;
    if (this.weeds.length < 3 && rnd() < dt * 0.5 && p > 1) {
      const dir = rnd() < 0.5 ? -1 : 1;
      this.weeds.push({ dir, z: 20 + rnd() * 50, x: dir < 0 ? W + 20 : -20, phase: rnd() * 6, spin: 0, speed: 28 + rnd() * 20 });
    }
    for (const w of this.weeds) {
      w.x += w.dir * w.speed * dt * (FOCAL / w.z) * 0.6;
      w.z -= dt * 10 * rate;
      w.spin += dt * w.dir * 6;
      w.phase += dt * 7;
    }
    this.weeds = this.weeds.filter((w) => w.x > -40 && w.x < W + 40 && w.z > 6);
    for (const w of this.weeds) {
      const q = project(this.v, 0, w.z), s = q.s * 0.7;
      const size = spr.weed.width * s, bounce = Math.abs(Math.sin(w.phase)) * 6 * s;
      ctx.fillStyle = 'rgba(90,50,24,0.25)';
      ctx.fillRect(Math.round(w.x - size / 2), Math.round(q.y - 1), Math.round(size), 1);
      ctx.save();
      ctx.translate(Math.round(w.x), Math.round(q.y - size / 2 - bounce));
      ctx.rotate(Math.round(w.spin * 4) / 4);
      ctx.drawImage(spr.weed, Math.round(-size / 2), Math.round(-size / 2), Math.round(size), Math.round(size));
      ctx.restore();
    }
  }
}

/** a poeira que os cascos levantam e que vira névoa no fim da estrada */
export class DustCloud {
  private dust: Dust[] = [];
  private readonly rnd: () => number;

  constructor(private readonly v: RideView, rng: Rng) { this.rnd = () => rng.next(); }

  reset(): void { this.dust = []; }

  emit(dt: number, intensity: number, rate: number): void {
    const { W, H } = this.v, rnd = this.rnd;
    const n = Math.floor((22 + intensity * 150) * dt * (0.6 + rate * 0.4) + rnd());
    for (let i = 0; i < n; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      this.dust.push({
        x: W / 2 + side * (5 + rnd() * 9), y: groundY(this.v) - 2 - rnd() * 3,
        vx: side * (6 + rnd() * 26) * (0.6 + intensity), vy: -(4 + rnd() * 10) * (0.6 + intensity),
        r: 1 + rnd() * 2, grow: 4 + rnd() * 10 * (0.4 + intensity), life: 0, max: 1.1 + rnd() * 1.4,
      });
    }
    if (intensity > 0.18 && rnd() < dt * intensity * 34) {
      const side = rnd() < 0.5 ? -1 : 1;
      this.dust.push({
        x: side < 0 ? rnd() * W * 0.3 : W - rnd() * W * 0.3, y: H + 4,
        vx: -side * (4 + rnd() * 10), vy: -(8 + rnd() * 14),
        r: 10 + rnd() * 10, grow: 16 + rnd() * 18, life: 0, max: 2.4 + rnd(),
      });
    }
  }

  draw(dt: number): void {
    const { ctx } = this.v;
    for (const d of this.dust) {
      d.life += dt; d.x += d.vx * dt; d.y += d.vy * dt;
      d.vx *= 0.985; d.vy *= 0.985; d.r += d.grow * dt;
    }
    this.dust = this.dust.filter((d) => d.life < d.max);
    for (const d of this.dust) {
      const lvl = Math.round(clamp((1 - d.life / d.max) * 1.1) * 16);
      if (lvl <= 0) continue;
      const r = d.r;
      ctx.fillStyle = ditherPattern(ctx, '#d9b88a', lvl);
      for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
        const w = Math.floor(Math.sqrt(r * r - dy * dy));
        ctx.fillRect(Math.round(d.x - w), Math.round(d.y + dy), w * 2 + 1, 1);
      }
      ctx.fillStyle = ditherPattern(ctx, '#ecd4a8', Math.max(1, lvl - 6));
      const r2 = r * 0.55;
      for (let dy = -Math.floor(r2); dy <= Math.floor(r2); dy++) {
        const w = Math.floor(Math.sqrt(r2 * r2 - dy * dy));
        ctx.fillRect(Math.round(d.x - r * 0.25 - w), Math.round(d.y - r * 0.25 + dy), w * 2 + 1, 1);
      }
    }
  }
}

/** panfletos erguidos do chão: sobem com a poeira, giram, perdem força e voltam a cair devagar */
export class FlyingPapers {
  private papers: Paper[] = [];
  private readonly rnd: () => number;

  constructor(private readonly v: RideView, private readonly pal: Palette, rng: Rng) { this.rnd = () => rng.next(); }

  reset(): void { this.papers = []; }

  kick(p: number, x: number, y: number, side: number, s: number): void {
    const rnd = this.rnd;
    const up = 0.6 + easeIn(prog(p, P.dustFrom, P.fogFull)) * 0.9;
    this.papers.push({
      x, y, side,
      vx: side * (18 + rnd() * 30) * up, vy: -(45 + rnd() * 45) * up,
      flip: rnd() * 6, spin: (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 9),
      phase: rnd() * 6, size: clamp(s * 0.9, 0.9, 2.2), life: 0, max: 3.5 + rnd() * 2,
    });
  }

  update(p: number, dt: number, rate: number): void {
    const { ctx, W, H } = this.v, rnd = this.rnd, COL = this.pal;
    const lift = easeIn(prog(p, P.dustFrom, P.fogFull));
    // de vez em quando o casco também chuta um panfleto que estava perto
    if (p > P.papersFrom && p < P.posterStart && rnd() < dt * (0.4 + lift * 3) * rate) {
      const side = rnd() < 0.5 ? -1 : 1;
      this.kick(p, W / 2 + side * (8 + rnd() * 8), groundY(this.v) - 2, side, 1.6);
    }
    for (const q of this.papers) {
      q.life += dt;
      // gravidade fraca, arrasto do ar e a corrente de ar quente da poeira
      q.vy += (26 - 40 * lift * Math.max(0, 1 - q.life / 2)) * dt;
      q.vx *= Math.pow(0.55, dt); q.vy *= Math.pow(0.7, dt);
      // o papel desliza de lado enquanto vira (folha caindo)
      const wob = Math.sin(q.life * 4.2 + q.phase);
      q.x += (q.vx + wob * 14 + q.side * 6 * rate) * dt;
      q.y += (q.vy + Math.abs(wob) * 4) * dt;
      q.flip += q.spin * dt * (0.6 + Math.abs(q.vy) / 60);
    }
    this.papers = this.papers.filter((q) => q.x > -20 && q.x < W + 20 && q.y > -20 && q.y < H + 10 && q.life < q.max);
    for (const q of this.papers) {
      const fade = clamp((q.max - q.life) / 0.6);
      if (fade <= 0) continue;
      const w = Math.max(1, Math.round(Math.abs(Math.cos(q.flip)) * 5 * q.size));
      const h = Math.max(2, Math.round((4 + Math.abs(Math.sin(q.flip * 0.5)) * 2) * q.size));
      const x = Math.round(q.x - w / 2), y = Math.round(q.y - h / 2);
      ctx.globalAlpha = fade;
      ctx.fillStyle = COL.k; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = Math.cos(q.flip) > 0 ? COL.paper : COL.paperD;
      ctx.fillRect(x, y, w, h);
      if (w >= 3 && h >= 4 && Math.cos(q.flip) > 0) {
        ctx.fillStyle = '#8a6a44';
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
        ctx.fillRect(x + 1, y + 3, Math.max(1, w - 3), 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}
