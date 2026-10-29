import { clamp } from './math';

/** escurece ou clareia um #hex e devolve rgb() (o `shade` das cenas) */
export function shade(hex: string, f = 0.75): string {
  const n = parseInt(hex.slice(1), 16);
  const s = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${s(n >> 16)},${s((n >> 8) & 255)},${s(n & 255)})`;
}

/** mesma ideia, mas devolve #hex (o `shadeHex` da abertura) */
export function shadeHex(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function mixColor(a: string, b: string, k: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * clamp(k)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
