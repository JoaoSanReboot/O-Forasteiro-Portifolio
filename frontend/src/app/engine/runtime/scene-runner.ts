import { Ctx, makeCanvas } from '../core/canvas';
import { clamp } from '../core/math';
import { SH, SW } from '../core/stage';
import { Pt } from '../draw/primitives';
import { SceneDef } from '../scenes/scene';

// uma cena montada num canvas: fundo e frente pré-desenhados, buffer em 320 × 150 e o recorte em volta do foco
export class SceneRunner {
  /** relógio da cena: só anda enquanto ela está na tela */
  t = 0;
  visible = false;
  drawn = false;
  /** largura do recorte mostrado (em pixels da arte) */
  W = SW;
  /** ampliação inteira; 0 até a primeira medida */
  scale = 0;
  camX = 0;
  /** desenhado por cima de tudo a cada quadro: as moedas e o revólver escondidos */
  overlay: ((g: Ctx, t: number) => void) | null = null;

  private readonly ctx: Ctx;
  private readonly bc: HTMLCanvasElement;
  private readonly fc: HTMLCanvasElement | null = null;
  private readonly wc: HTMLCanvasElement;
  private readonly wg: Ctx;

  constructor(readonly id: string, readonly canvas: HTMLCanvasElement, readonly def: SceneDef) {
    this.ctx = canvas.getContext('2d')!;
    const [bc, bg] = makeCanvas(SW, SH); def.back(bg); this.bc = bc;
    if (def.front) { const [c2, g2] = makeCanvas(SW, SH); def.front(g2); this.fc = c2; }
    [this.wc, this.wg] = makeCanvas(SW, SH);
  }

  /** o fundo pré-desenhado (o segredo do Saloon repinta a parede a partir dele) */
  get backCanvas(): HTMLCanvasElement { return this.bc; }

  /** `figWidth` é o clientWidth da figura */
  size(figWidth: number): void {
    const cw = Math.max(160, figWidth - 12);
    const scale = clamp(Math.ceil(cw / SW), 1, 6);
    const W = Math.min(SW, Math.floor(cw / scale));
    this.W = W; this.scale = scale;
    this.camX = Math.round(clamp(this.def.focus - W / 2, 0, SW - W));
    this.canvas.width = W; this.canvas.height = SH;
    this.canvas.style.width = W * scale + 'px'; this.canvas.style.height = SH * scale + 'px';
    this.ctx.imageSmoothingEnabled = false;
    this.drawn = false;
  }

  paint(t: number, dt: number): void {
    const g = this.wg;
    g.clearRect(0, 0, SW, SH);
    g.drawImage(this.bc, 0, 0);
    this.def.draw(g, t, dt);
    if (this.fc) g.drawImage(this.fc, 0, 0);
    if (this.def.after) this.def.after(g, t, dt);
    this.overlay?.(g, t);
    this.ctx.drawImage(this.wc, this.camX, 0, this.W, SH, 0, 0, this.W, SH);
    this.drawn = true;
  }

  // converte o clique em coordenadas da arte (320 × 150)
  toScene(clientX: number, clientY: number): Pt {
    const r = this.canvas.getBoundingClientRect();
    return [this.camX + (clientX - r.left - this.canvas.clientLeft) / this.scale, (clientY - r.top - this.canvas.clientTop) / this.scale];
  }
}
