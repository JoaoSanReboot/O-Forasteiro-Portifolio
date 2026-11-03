import { Rng } from '../../../engine/core/rng';
import { Palette } from './palette';
import { FlyingPapers } from './particles';
import { RideSprites } from './sprites';
import { project as projectOn, RideView, stageDisc as disc } from './stage';
import { TIMELINE as P } from './timeline';

// A beira da estrada: cactos, árvores secas, pedras, cercas, caveiras, rachaduras, panfletos no chão e os postes do telégrafo

interface Prop { kind: string; wx: number; z: number; v?: number; spr?: 'tree' | 'boulder' | 'fence'; k?: number; r?: number; len?: number; tilt?: number }

export class Roadside {
  private props: Prop[] = [];
  private poles: number[] = [];
  private readonly rnd: () => number;

  constructor(private readonly v: RideView, private readonly pal: Palette, private readonly rng: Rng, private readonly papers: FlyingPapers) {
    this.rnd = () => rng.next();
  }

  /** a estrada começa sempre igual (semente fixa) */
  reset(p: number): void {
    this.rng.seed = 7;
    this.props = [];
    for (let i = 0; i < 70; i++) this.props.push(this.spawn(6 + this.rnd() * 240, p));
    this.poles = [];
  }

  /** `dz` é o quanto o cavalo andou neste quadro; `p` é a história (os panfletos só aparecem perto do fim) */
  drawProps(dz: number, p: number, spr: RideSprites): void {
    const { ctx, W, horizon: HORIZON } = this.v, rnd = this.rnd, COL = this.pal;
    const project = (wx: number, z: number) => projectOn(this.v, wx, z);
    for (const pr of this.props) {
      pr.z -= dz;
      // um panfleto no chão, quando o cavalo passa, é erguido pela poeira
      if (pr.kind === 'paper' && pr.z < 13) {
        const q = project(pr.wx, pr.z);
        this.papers.kick(p, q.x, q.y, Math.sign(pr.wx || (rnd() - 0.5)), q.s);
        replace(pr, this.spawn(240 + rnd() * 20, p));
        continue;
      }
      if (pr.z < 3) replace(pr, this.spawn(240 + rnd() * 20, p));
    }
    this.props.sort((a, b) => b.z - a.z);
    for (const pr of this.props) {
      const q = project(pr.wx, pr.z);
      if (q.y < HORIZON + 1 || q.x < -60 || q.x > W + 60) continue;
      if (pr.kind === 'cactus') {
        const img = spr.cactus[pr.v!], s = q.s * 0.9;
        const w = img.width * s, h = img.height * s;
        if (w < 1) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.28)';
        ctx.fillRect(Math.round(q.x - w * 0.4), Math.round(q.y - 1), Math.round(w * 0.9), Math.max(1, Math.round(s)));
        ctx.drawImage(img, Math.round(q.x - w / 2), Math.round(q.y - h), Math.round(w), Math.round(h));
      } else if (pr.kind === 'paper') {
        // deitado na terra: um retângulo achatado pela perspectiva
        const w = Math.max(1, Math.round(6 * q.s)), h = Math.max(1, Math.round(2 * q.s));
        if (q.s < 0.25) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.35)'; ctx.fillRect(Math.round(q.x - w / 2) + 1, Math.round(q.y) + 1, w, h);
        ctx.fillStyle = pr.tilt ? COL.paperD : COL.paper; ctx.fillRect(Math.round(q.x - w / 2), Math.round(q.y), w, h);
      } else if (pr.kind === 'big') {
        const img = spr[pr.spr!], s = q.s * pr.k!;
        const w = img.width * s, h = img.height * s;
        if (w < 2) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.25)';
        ctx.fillRect(Math.round(q.x - w * 0.45), Math.round(q.y - 1), Math.round(w * 0.9), Math.max(1, Math.round(s)));
        ctx.drawImage(img, Math.round(q.x - w / 2), Math.round(q.y - h), Math.round(w), Math.round(h));
      } else if (pr.kind === 'skull') {
        const img = spr.skull, s = q.s * 0.7;
        if (s < 0.4) continue;
        ctx.drawImage(img, Math.round(q.x - (img.width * s) / 2), Math.round(q.y - img.height * s), Math.round(img.width * s), Math.round(img.height * s));
      } else if (pr.kind === 'stone') {
        const r = pr.r! * q.s;
        if (r < 0.5) { ctx.fillStyle = COL.groundD; ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); continue; }
        disc(ctx, q.x, q.y - r * 0.5, r, '#a8794a');
        disc(ctx, q.x - r * 0.3, q.y - r * 0.7, r * 0.5, '#c89a64');
      } else {
        ctx.fillStyle = COL.crack;
        const len = Math.max(1, Math.round(pr.len! * q.s));
        ctx.fillRect(Math.round(q.x), Math.round(q.y), len, 1);
        if (len > 3) ctx.fillRect(Math.round(q.x + len * 0.6), Math.round(q.y) + 1, Math.round(len * 0.5), 1);
      }
    }
  }

  /** os postes do telégrafo do lado direito, com o fio caindo entre eles */
  drawPoles(dz: number): void {
    const { ctx, W } = this.v, COL = this.pal;
    if (!this.poles.length) for (let i = 0; i < 9; i++) this.poles.push(8 + i * 30);
    this.poles = this.poles.map((z) => { z -= dz; return z < 3 ? z + 270 : z; }).sort((a, b) => b - a);
    const tops: ({ x: number; y: number } | null)[] = [];
    for (const z of this.poles) {
      const q = projectOn(this.v, 78, z);
      const h = Math.round(46 * q.s), w = Math.max(1, Math.round(1.6 * q.s));
      if (q.x > W + 20) { tops.push(null); continue; }
      ctx.fillStyle = COL.k; ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y - h), w + 2, h);
      ctx.fillStyle = '#6e5642'; ctx.fillRect(Math.round(q.x), Math.round(q.y - h), w, h);
      const cw = Math.max(2, Math.round(9 * q.s));
      ctx.fillStyle = COL.k; ctx.fillRect(Math.round(q.x - cw / 2), Math.round(q.y - h + 3 * q.s), cw, Math.max(1, Math.round(q.s)));
      tops.push({ x: q.x, y: q.y - h + 3 * q.s });
    }
    ctx.fillStyle = 'rgba(43,29,22,0.7)';
    for (let i = 0; i < tops.length - 1; i++) {
      const a = tops[i], b = tops[i + 1];
      if (!a || !b) continue;
      const n = Math.ceil(Math.abs(b.x - a.x));
      for (let k = 0; k <= n; k++) {
        const t = k / Math.max(1, n);
        const sag = Math.sin(t * Math.PI) * Math.abs(b.x - a.x) * 0.06;
        ctx.fillRect(Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t + sag), 1, 1);
      }
    }
  }

  private spawn(z: number, p: number): Prop {
    const rnd = this.rnd;
    const r = rnd(), side = rnd() < 0.5 ? -1 : 1;
    if (p >= P.papersFrom - 4 && p < P.posterStart && rnd() < 0.5)
      return { kind: 'paper', wx: (rnd() - 0.5) * 70, z, tilt: rnd() < 0.5 ? 0 : 1 };
    if (r < 0.17) return { kind: 'cactus', v: Math.floor(rnd() * 3), wx: side * (40 + rnd() * 130), z };
    if (r < 0.25) return { kind: 'big', spr: 'tree', wx: side * (55 + rnd() * 130), z, k: 0.9 };
    if (r < 0.31) return { kind: 'big', spr: 'boulder', wx: side * (45 + rnd() * 140), z, k: 0.8 };
    if (r < 0.35) return { kind: 'big', spr: 'fence', wx: side * (40 + rnd() * 60), z, k: 0.8 };
    if (r < 0.38) return { kind: 'skull', wx: side * (18 + rnd() * 40), z };
    if (r < 0.55) return { kind: 'stone', wx: (rnd() - 0.5) * 220, z, r: 0.6 + rnd() * 1.2 };
    return { kind: 'crack', wx: (rnd() - 0.5) * 200, z, len: 4 + rnd() * 10 };
  }
}

// Object.assign: os campos antigos que a peça nova não tem continuam lá
const replace = (pr: Prop, next: Prop) => Object.assign(pr, next);
