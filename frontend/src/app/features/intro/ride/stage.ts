import { Ctx } from '../../../engine/core/canvas';

// O palco da abertura: canvas de baixa resolução com a estrada em pseudo-3D (câmera atrás do cavalo)

/** distância focal e altura da câmera, em pixels da arte */
export const FOCAL = 60;
export const CAM_H = 30;

/** o tamanho do palco muda com a janela (resize): quem desenha lê sempre daqui */
export interface RideView {
  readonly ctx: Ctx;
  W: number;
  H: number;
  horizon: number;
}

/** um ponto do chão (x no mundo, z de profundidade) na tela, com a escala daquela distância */
export function project(v: RideView, wx: number, z: number): { x: number; y: number; s: number } {
  const s = FOCAL / z;
  return { x: v.W / 2 + wx * s, y: v.horizon + CAM_H * s, s };
}

/** a faixa de baixo cobre 7,5% da tela: o cavalo galopa logo acima dela */
export const groundY = (v: RideView): number => v.H - Math.round(v.H * 0.075) - 2;

/** círculo cheio em pixels, com raio mínimo de meio pixel (sol, pedras e flores) */
export function stageDisc(g: Ctx, x: number, y: number, r: number, color: string): void {
  g.fillStyle = color;
  const rr = Math.max(0.5, r);
  for (let dy = -Math.floor(rr); dy <= Math.floor(rr); dy++) {
    const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
    g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
  }
}
