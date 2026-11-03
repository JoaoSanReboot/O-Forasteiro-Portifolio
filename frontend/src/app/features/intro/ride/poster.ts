import { Ctx } from '../../../engine/core/canvas';
import { clamp, easeIn, easeOut, lerp, prog } from '../../../engine/core/math';
import { Rng } from '../../../engine/core/rng';
import { TIMELINE as P } from './timeline';

// O cartaz de PROCURADO em alta resolução: montado uma vez (quando as fontes e o retrato chegam)
// e depois voando da poeira até a câmera, tremulando e sendo arrancado pelo vento.

// escreve centralizado, diminuindo a letra até caber na largura
function fitText(g: Ctx, text: string, size: number, family: string, x: number, y: number, maxW: number): void {
  let px = size;
  g.font = `${px}px ${family}`;
  while (g.measureText(text).width > maxW && px > 10) { px -= 2; g.font = `${px}px ${family}`; }
  g.fillText(text, x, y);
}

/** o cartaz inteiro em 600 × 920, com papel rasgado, manchas e bordas queimadas */
export function buildPoster(portrait: HTMLImageElement, rng: Rng): HTMLCanvasElement {
  const rnd = () => rng.next();
  const PW = 600, PH = 920;
  const c = document.createElement('canvas');
  c.width = PW; c.height = PH;
  const g = c.getContext('2d')!;
  rng.seed = 4242;

  // papel com bordas rasgadas
  const pts: [number, number][] = [];
  const jag = (n: number, f: (t: number, j: number) => [number, number]) => { for (let i = 0; i <= n; i++) pts.push(f(i / n, (rnd() - 0.5) * 10)); };
  jag(30, (t, j) => [14 + t * (PW - 28), 12 + j]);
  jag(44, (t, j) => [PW - 12 + j, 14 + t * (PH - 28)]);
  jag(30, (t, j) => [PW - 14 - t * (PW - 28), PH - 12 + j]);
  jag(44, (t, j) => [12 + j, PH - 14 - t * (PH - 28)]);
  g.save();
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.shadowColor = 'rgba(20,10,5,0.45)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
  g.fillStyle = '#ecd9ad'; g.fill();
  g.shadowColor = 'transparent';
  g.clip();
  // manchas e granulação
  for (let i = 0; i < 6000; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '120,80,40' : '255,245,220'},${0.05 + rnd() * 0.08})`;
    g.fillRect(rnd() * PW, rnd() * PH, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  for (let i = 0; i < 7; i++) {
    const x = rnd() * PW, y = rnd() * PH, r = 30 + rnd() * 90;
    const rg = g.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, 'rgba(150,100,50,0.13)'); rg.addColorStop(1, 'rgba(150,100,50,0)');
    g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // bordas queimadas
  const edge = g.createRadialGradient(PW / 2, PH / 2, PH * 0.32, PW / 2, PH / 2, PH * 0.66);
  edge.addColorStop(0, 'rgba(90,50,20,0)'); edge.addColorStop(1, 'rgba(90,50,20,0.55)');
  g.fillStyle = edge; g.fillRect(0, 0, PW, PH);
  g.restore();

  const ink = '#2a1a10';
  g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';

  // prego no topo
  g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(PW / 2, 34, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#8a7a6a'; g.beginPath(); g.arc(PW / 2 - 2, 32, 2.5, 0, Math.PI * 2); g.fill();

  g.fillStyle = ink;
  fitText(g, 'PROCURADO', 104, 'Rye, "Times New Roman", serif', PW / 2, 138, PW - 96);
  g.fillRect(70, 160, PW - 140, 4); g.fillRect(70, 168, PW - 140, 1);

  // retrato
  const fx = 110, fy = 188, fw = 380, fh = 475;
  g.fillStyle = ink; g.fillRect(fx - 10, fy - 10, fw + 20, fh + 20);
  g.fillStyle = '#e3cfa0'; g.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
  g.fillStyle = ink; g.fillRect(fx - 3, fy - 3, fw + 6, fh + 6);
  g.imageSmoothingEnabled = false;
  if (portrait.complete && portrait.naturalWidth) g.drawImage(portrait, fx, fy, fw, fh);
  g.imageSmoothingEnabled = true;

  g.fillStyle = ink;
  fitText(g, 'JOÃO PEDRO', 70, 'Rye, "Times New Roman", serif', PW / 2, 742, PW - 110);
  fitText(g, 'o código mais limpo do oeste', 33, '"IM Fell English SC", Georgia, serif', PW / 2, 782, PW - 110);
  g.fillRect(150, 802, PW - 300, 2);
  g.font = '28px Rye, "Times New Roman", serif';
  g.fillText('RECOMPENSA', PW / 2, 838);
  fitText(g, '$ 1.000.000', 58, 'Rye, "Times New Roman", serif', PW / 2, 896, PW - 140);
  return c;
}

/** a camada do cartaz por cima do palco, no instante `p` da história */
export function drawPosterLayer(pctx: Ctx, posterCanvas: HTMLCanvasElement | null, p: number, t: number): void {
  const cw = pctx.canvas.width, ch = pctx.canvas.height;
  pctx.clearRect(0, 0, cw, ch);
  if (!posterCanvas || p < P.posterStart || p > P.posterGone) return;
  const fit = Math.min((ch * 0.86) / posterCanvas.height, (cw * 0.9) / posterCanvas.width);
  let scale: number, x: number, y: number, rot: number, alpha = 1, squash = 1;
  if (p < P.posterArrive) {
    // sai da poeira, girando e se aproximando
    const k = easeOut(prog(p, P.posterStart, P.posterArrive));
    scale = lerp(0.05, 1, k) * fit;
    x = lerp(cw * 0.62, cw / 2, k) + Math.sin(k * 9) * cw * 0.05 * (1 - k);
    y = lerp(ch * 0.62, ch / 2, k) + Math.cos(k * 7) * ch * 0.04 * (1 - k);
    rot = lerp(2.6, 0.04, k) + Math.sin(t * 6) * 0.25 * (1 - k);
    squash = 0.35 + 0.65 * Math.abs(Math.cos(lerp(6, 0, k)));
    alpha = clamp(k * 3);
  } else if (p < P.posterLeave) {
    // fica tremulando no vento
    scale = fit; x = cw / 2; y = ch / 2 + Math.sin(t * 1.3) * ch * 0.006;
    rot = 0.03 + Math.sin(t * 1.7) * 0.025;
    squash = 1 - Math.abs(Math.sin(t * 2.3)) * 0.03;
  } else {
    // é arrancado pelo vento para o alto
    const k = easeIn(prog(p, P.posterLeave, P.posterGone));
    scale = lerp(1, 1.25, k) * fit;
    x = lerp(cw / 2, -cw * 0.4, k); y = lerp(ch / 2, -ch * 0.3, k);
    rot = lerp(0.03, -1.6, k);
    squash = 1 - k * 0.6;
    alpha = 1 - k * 0.3;
  }
  pctx.save();
  pctx.globalAlpha = alpha;
  pctx.translate(x, y);
  pctx.rotate(rot);
  pctx.scale(scale * squash, scale);
  pctx.drawImage(posterCanvas, -posterCanvas.width / 2, -posterCanvas.height / 2);
  pctx.restore();
}
