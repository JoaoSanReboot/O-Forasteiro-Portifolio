import { Level } from './levels';

// As faixas da barra de reflexo: a amarela (perfeito) dentro da vermelha (só vale com o revólver aprimorado)

export interface Zone { s: number; w: number; p: number; mid: number; hit: boolean; yellow: boolean }

export function makeZone(L: Level, lo: number, hi: number, rand = Math.random): Zone {
  const w = L.zone, p = L.perfect, s = lo + rand() * (hi - lo - w);
  return { s, w, p, mid: s + w / 2, hit: false, yellow: false };
}

/** onde caiu o disparo: na faixa amarela, na vermelha (só com o revólver aprimorado) ou fora */
export function judge(a: number, z: Zone, hasGun: boolean): 'yellow' | 'red' | null {
  const g = 0.8;
  if (Math.abs(a - z.mid) <= z.p / 2 + g) return 'yellow';
  if (hasGun && a >= z.s - g && a <= z.s + z.w + g) return 'red';
  return null;
}
