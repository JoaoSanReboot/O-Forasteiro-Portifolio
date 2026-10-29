import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { engineEnv } from '../core/env';
import { K, O, R } from '../draw/primitives';

/** ficha de uma pessoa desenhada de frente (cabeça e tronco); os braços cada cena desenha */
export interface Person {
  skin: string;
  skinD: string;
  shirt: string;
  hair?: string | null;
  /** altura do cabelo na testa; 0 vira 3 */
  hairH?: number;
  side?: boolean;
  curls?: boolean;
  look?: number;
  brow?: string | null;
  glasses?: boolean;
  beard?: string | null;
  stache?: string | null;
  goatee?: string | null;
  hat?: string | null;
  band?: string | null;
  visor?: boolean;
  bowler?: string | null;
  blinkOff?: number;
  sleeve?: string;
  vest?: string | null;
  apron?: string;
  tie?: string | null;
  scarf?: string | null;
  badge?: boolean;
  garter?: string;
}

// pessoa de frente: cabeça (topo em y) e tronco
export function head(g: Ctx, cx: number, y: number, P: Person, t: number): void {
  const blink = !engineEnv.reduceMotion && ((t + (P.blinkOff || 0)) % 4.1) < 0.13;
  O(g, cx - 5, y, 10, 10, P.skin); R(g, cx - 5, y, 2, 10, P.skinD);
  R(g, cx - 6, y + 4, 1, 3, P.skinD); R(g, cx + 5, y + 4, 1, 3, P.skinD);
  if (P.hair) { R(g, cx - 5, y, 10, P.hairH || 3, P.hair); if (P.side) { R(g, cx - 6, y + 2, 2, 4, P.hair); R(g, cx + 4, y + 2, 2, 4, P.hair); } }
  if (P.curls && P.hair) { R(g, cx - 6, y + 1, 2, 5, P.hair); R(g, cx + 4, y + 1, 2, 5, P.hair); }
  const ey = y + 4 + (P.look || 0);
  if (blink) { R(g, cx - 3, ey + 1, 2, 1, P.skinD); R(g, cx + 1, ey + 1, 2, 1, P.skinD); }
  else { R(g, cx - 3, ey, 1, 2, K); R(g, cx + 2, ey, 1, 2, K); }
  if (P.brow) { R(g, cx - 4, y + 3, 3, 1, P.brow); R(g, cx + 1, y + 3, 3, 1, P.brow); }
  if (P.glasses) { g.fillStyle = '#c8c0a8'; g.fillRect(cx - 4, ey - 1, 3, 1); g.fillRect(cx + 1, ey - 1, 3, 1); g.fillRect(cx - 4, ey + 2, 3, 1); g.fillRect(cx + 1, ey + 2, 3, 1); g.fillRect(cx - 1, ey, 2, 1); }
  if (P.beard) R(g, cx - 5, y + 6, 10, 4, P.beard);
  if (P.stache) { R(g, cx - 4, y + 7, 8, 1, P.stache); R(g, cx - 4, y + 8, 1, 1, P.stache); R(g, cx + 3, y + 8, 1, 1, P.stache); }
  if (P.goatee) R(g, cx - 1, y + 8, 2, 2, P.goatee);
  if (P.hat) {
    O(g, cx - 4, y - 5, 8, 5, P.hat); R(g, cx - 4, y - 1, 8, 1, P.band || shade(P.hat, 0.6)); R(g, cx - 4, y - 5, 2, 3, shade(P.hat, 1.25));
    O(g, cx - 8, y, 16, 1, P.hat);
  }
  if (P.visor) { R(g, cx - 7, y - 1, 14, 1, K); R(g, cx - 7, y, 14, 2, '#4a9a5a'); R(g, cx - 7, y + 2, 14, 1, 'rgba(80,170,90,0.45)'); }
  if (P.bowler) { O(g, cx - 4, y - 4, 8, 4, P.bowler); O(g, cx - 6, y, 12, 1, P.bowler); }
}

export function torso(g: Ctx, cx: number, y: number, P: Person, h = 18): void {
  // ombros: os braços saem daqui, fora do tronco
  O(g, cx - 10, y + 1, 4, 5, P.sleeve || P.shirt); O(g, cx + 6, y + 1, 4, 5, P.sleeve || P.shirt);
  O(g, cx - 7, y, 14, h, P.shirt);
  if (P.vest) { R(g, cx - 7, y, 4, h, P.vest); R(g, cx + 3, y, 4, h, P.vest); R(g, cx - 3, y + 2, 1, 1, '#c0b090'); }
  if (P.apron) { R(g, cx - 6, y + 5, 12, h - 5, P.apron); R(g, cx - 6, y + 5, 12, 1, shade(P.apron, 0.7)); R(g, cx - 5, y, 1, 5, P.apron); R(g, cx + 4, y, 1, 5, P.apron); }
  if (P.tie) { R(g, cx - 2, y, 4, 2, P.tie); R(g, cx - 1, y + 2, 2, 1, P.tie); }
  if (P.scarf) { R(g, cx - 4, y, 8, 3, P.scarf); R(g, cx + 1, y + 3, 2, 2, P.scarf); }
  if (P.badge) { g.fillStyle = '#f2c230'; [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [3, 3]].forEach(([dx, dy]) => g.fillRect(cx - 6 + dx, y + 4 + dy, 1, 1)); }
  if (P.garter) { R(g, cx - 9, y + 4, 2, 2, P.garter); R(g, cx + 7, y + 4, 2, 2, P.garter); }
}
