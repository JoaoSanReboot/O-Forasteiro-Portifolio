// O mesmo código roda no navegador e no Node (o prerender do build e o SSR do ng serve).
// No Node não há window, document, requestAnimationFrame, armazenamento, áudio nem canvas:
// quadros pedidos fora do navegador simplesmente não acontecem, e cancelar vira "nada a fazer".

/** estamos num navegador de verdade (o PlatformService diz o mesmo pelo PLATFORM_ID, já dentro do Angular) */
export const inBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/** requestAnimationFrame seguro: fora do navegador não agenda nada e devolve 0 */
export function raf(cb: FrameRequestCallback): number {
  return typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : 0;
}

/** cancelAnimationFrame seguro: aceita 0 (nada agendado) e não quebra fora do navegador */
export function cancelRaf(id: number): void {
  if (id && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(id);
}

/** espera o próximo quadro (fora do navegador, segue na hora) */
export function nextFrame(): Promise<void> {
  return new Promise((res) => { if (!raf(() => res())) res(); });
}
