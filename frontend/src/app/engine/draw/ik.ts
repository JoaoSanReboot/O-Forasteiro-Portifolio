import { clamp } from '../core/math';
import { Pt } from './primitives';

export type Arm = [Pt, Pt, Pt];

// braço com cotovelo calculado (dois segmentos de tamanho fixo até a mão)
export function ik(sx: number, sy: number, hx: number, hy: number, L1: number, L2: number, bend: number): Arm {
  let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy);
  const max = L1 + L2 - 0.01;
  if (d > max) { hx = sx + dx / d * max; hy = sy + dy / d * max; d = max; }
  const a = Math.atan2(hy - sy, hx - sx);
  const c = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * Math.max(d, 0.01)), -1, 1);
  const e = a + bend * Math.acos(c);
  return [[sx, sy], [sx + Math.cos(e) * L1, sy + Math.sin(e) * L1], [hx, hy]];
}

// braço que dobra sempre para fora do corpo e para baixo, como um braço de verdade
// side: -1 para o braço do lado esquerdo da tela, +1 para o do lado direito
export function armIK(sx: number, sy: number, hx: number, hy: number, L1: number, L2: number, side: number): Arm {
  const a = ik(sx, sy, hx, hy, L1, L2, 1), b = ik(sx, sy, hx, hy, L1, L2, -1);
  const score = (pts: Arm) => side * (pts[1][0] - sx) + 2 * (pts[1][1] - sy);
  return score(a) >= score(b) ? a : b;
}

/** memória do cotovelo entre quadros */
export interface ElbowMemory { e?: Pt }

// mesma ideia, mas lembrando o cotovelo do quadro anterior: o braço nunca "vira" de lado no meio do movimento
export function armIKkeep(mem: ElbowMemory, sx: number, sy: number, hx: number, hy: number, L1: number, L2: number, side: number): Arm {
  const a = ik(sx, sy, hx, hy, L1, L2, 1), b = ik(sx, sy, hx, hy, L1, L2, -1);
  let pick: Arm;
  if (!mem.e) pick = armIK(sx, sy, hx, hy, L1, L2, side);
  else {
    const da = Math.hypot(a[1][0] - mem.e[0], a[1][1] - mem.e[1]), db = Math.hypot(b[1][0] - mem.e[0], b[1][1] - mem.e[1]);
    pick = da <= db ? a : b;
  }
  mem.e = pick[1];
  return pick;
}
