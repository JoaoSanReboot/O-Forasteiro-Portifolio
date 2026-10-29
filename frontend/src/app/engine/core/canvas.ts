import { inBrowser } from './browser';

export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, Ctx] {
  // canvas só no navegador: quem desenha no SSR tem um caminho que escapou do afterNextRender
  if (!inBrowser) throw new Error('makeCanvas chamado fora do navegador (SSR)');
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  g.imageSmoothingEnabled = false;
  return [c, g];
}
