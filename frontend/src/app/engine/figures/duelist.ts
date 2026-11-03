import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { disc, K, limb, O, R } from '../draw/primitives';
import { Hero, Weapon } from '../heroes/heroes';
import { head, Person, torso } from './people';

// Os duelistas do fim da rua: o visitante (com o personagem escolhido) e o João, de frente um para o outro.

/** um duelista de frente: a pessoa e o que ela veste da cintura para baixo */
export interface Duelist extends Person {
  pants?: string;
  boot?: string;
  skirt?: string;
  shawl?: string;
  bandoleer?: string;
  bigHair?: boolean;
  ponytail?: boolean;
  hatStyle?: Hero['hatStyle'];
  star?: string;
  coat?: boolean;
  coatD?: string | null;
  gun?: string;
  /** o chapéu que voa quando ele leva o tiro */
  flyHat?: string | null;
  weapon?: Weapon;
  weaponDraw?: (g: Ctx, cx: number) => void;
}

const forasteiro: Duelist = { skin: '#c48c64', skinD: '#8a5c40', hair: '#2a1e18', hairH: 2, beard: '#3a2a22', brow: '#1b120d', hat: '#2c2421', band: '#3e2e28', shirt: '#3c3230', scarf: '#8a2a22', blinkOff: 1.7 };

// o duelista do visitante é o personagem escolhido na tela inicial
export function duelHero(H: Hero | null | undefined): Duelist {
  if (!H || H.id === 'pistoleiro') return { ...forasteiro, flyHat: forasteiro.hat, weapon: 'revolver' };
  return {
    skin: H.skin, skinD: H.skinD, hair: H.hair, hairH: 2, brow: '#1b120d',
    beard: H.facial === 'beard' ? H.facialColor : null, stache: H.facial === 'stache' ? H.facialColor : null,
    goatee: H.facial === 'stubble' ? H.facialColor : null,
    hat: H.hat, hatStyle: H.hatStyle, band: H.band, star: H.star,
    shirt: H.coat || H.shirt, vest: H.vest, scarf: H.scarf, coatD: H.coat ? shade(H.coat, 0.75) : null,
    pants: H.pants, boot: H.boot, skirt: H.skirt, shawl: H.shawl, bandoleer: H.bandoleer,
    bigHair: H.hairStyle === 'big', ponytail: H.hairStyle === 'ponytail', tie: H.tie,
    glasses: H.glasses, blinkOff: 1.7, coat: !!H.coat, flyHat: H.hat || null, weapon: H.weapon || 'revolver',
  };
}

// pistoleiro de frente; side = para que lado ele atira (+1 direita, -1 esquerda);
// twitchAt = quando o João mexeu os dedos perto do coldre (performance.now())
export function drawGunslinger(g: Ctx, cx: number, P: Duelist, side: number, hasHat: boolean, shooting: boolean, tense: boolean, t: number, coat: boolean, twitchAt: number): void {
  const pants = P.pants || '#2e2826', boot = P.boot || '#1e1612';
  O(g, cx - 6, 92, 5, 20, pants); O(g, cx + 1, 92, 5, 20, pants);
  R(g, cx - 6, 108, 5, 4, boot); R(g, cx + 1, 108, 5, 4, boot);
  if (P.skirt) { for (let y = 89; y < 109; y++) { const w = 7 + Math.floor((y - 89) / 5); R(g, cx - w - 1, y, w * 2 + 2, 1, K); R(g, cx - w, y, w * 2, 1, y > 105 ? shade(P.skirt, 0.8) : P.skirt); } }
  if (coat) { O(g, cx - 8, 88, 3, 12, P.coatD || '#26201e'); O(g, cx + 5, 88, 3, 12, P.coatD || '#26201e'); }
  // cabeleira volumosa e rabo de cavalo ficam atrás da cabeça
  if (P.bigHair) { disc(g, cx, 66, 10, K); disc(g, cx, 66, 9, P.hair!); disc(g, cx - 6, 70, 6, K); disc(g, cx - 6, 70, 5, P.hair!); disc(g, cx + 6, 70, 6, K); disc(g, cx + 6, 70, 5, P.hair!); R(g, cx - 5, 59, 3, 1, shade(P.hair!, 1.15)); }
  if (P.ponytail) { O(g, cx + 4, 64, 3, 15, P.hair!); R(g, cx + 4, 66, 3, 1, P.tie || '#e8c050'); }
  torso(g, cx, 74, P, 19);
  if (P.shawl) { R(g, cx - 8, 74, 16, 4, P.shawl); for (let i = 0; i < 5; i++) R(g, cx - 6 + i, 78 + i, 12 - i * 2, 1, P.shawl); }
  if (P.bandoleer) { for (let i = 0; i < 14; i++) { R(g, cx - 6 + i, 75 + i, 2, 2, P.bandoleer); if (i % 3 === 0) R(g, cx - 6 + i, 75 + i, 1, 1, '#e8c878'); } }
  if (!P.skirt) { R(g, cx - 7, 90, 14, 2, '#1e1612'); R(g, cx - 1, 90, 2, 2, '#c0b090'); }
  const hx = cx + side * 7;
  if (!P.weaponDraw) O(g, hx - 1, 91, 3, 6, '#5a3820');
  const customHat = P.hatStyle === 'halfmoon';
  head(g, cx, 63, { ...P, hat: hasHat && !customHat ? P.hat : null, look: 1 }, t);
  if (customHat && hasHat) {
    // chapéu de couro em meia-lua, com a estrela na frente
    [[0, 5], [1, 8], [2, 10], [3, 11], [4, 12]].forEach(([dy, w]) => { R(g, cx - w - 1, 57 + dy, w * 2 + 2, 1, K); R(g, cx - w, 57 + dy, w * 2, 1, dy === 4 ? shade(P.hat!, 0.75) : P.hat!); });
    R(g, cx - 1, 58, 2, 2, P.star || '#e8c050');
  }
  if (!hasHat && !P.bigHair) { R(g, cx - 5, 62, 10, 3, P.hair!); if (P.curls) { R(g, cx - 6, 61, 3, 3, P.hair!); R(g, cx - 1, 60, 3, 3, P.hair!); R(g, cx + 3, 61, 3, 3, P.hair!); } }
  if (P.weaponDraw) { P.weaponDraw(g, cx); return; }
  const off = side < 0 ? 8 : -9, gunSh = side < 0 ? -9 : 8;
  // braço livre, solto ao lado do corpo
  limb(g, [[cx + off, 77], [cx + off * 1.25, 84], [cx + off * 1.15, 91]], 3, P.shirt, P.skin);
  if (shooting) {
    limb(g, [[cx + gunSh, 77], [cx + side * 16, 78], [cx + side * 24, 78]], 3, P.shirt, P.skin);
    O(g, side > 0 ? cx + 24 : cx - 31, 76, 7, 2, P.gun || '#6a6662'); R(g, side > 0 ? cx + 24 : cx - 30, 78, 2, 3, '#5a3820');
  } else {
    const tw = (tense ? Math.round(Math.sin(t * 9)) : 0) - (side < 0 && performance.now() - twitchAt < 280 ? 3 : 0);
    limb(g, [[cx + gunSh, 77], [cx + gunSh * 1.3, 84], [hx + side * 2, 89 + tw]], 3, P.shirt, P.skin);
    R(g, hx, 89, 2, 2, P.gun || '#6a6662');
  }
}
