import { shadeHex } from '../../engine/core/color';
import { Hero } from '../../engine/heroes/heroes';

// As cores da abertura. As pernas e o casaco do cavaleiro seguem o personagem escolhido.
const BASE = {
  k: '#1b120d',
  horse: '#7c4f2c', horseL: '#a06c3e', horseD: '#563419', horseDD: '#3e2412',
  mane: '#3e2618', hoof: '#2a1e18', sole: '#7a6a5c',
  pants: '#28221f', pantsL: '#3c3430', boot: '#1e1816', stirrup: '#b0a898',
  coat: '#3c3230', coatD: '#26201e',
  blanket: '#8e2a20', blanketL: '#b04434', saddle: '#4a2e1c', saddleL: '#6a4428',
  cactus: '#5e7d4a', cactusL: '#7fa060', cactusD: '#3e5a32',
  weed: '#a07a48', weedD: '#6e5030',
  road: '#e8c28a', crack: '#8a5a34', groundD: '#b98450',
  town: '#8a5a40', townD: '#5e3a28', townL: '#b07a52', roof: '#a8502e', window: '#2b1a12',
  paper: '#f3e6c4', paperD: '#cdb68a',
};
export type Palette = typeof BASE;

const LEG_DEFAULT = { pants: BASE.pants, pantsL: BASE.pantsL, boot: BASE.boot, coat: BASE.coat };

export const createPalette = (): Palette => ({ ...BASE });

/** pinta as pernas, a bota e o casaco do cavaleiro com as cores do personagem (o pistoleiro usa as originais) */
export function dressRider(col: Palette, h: Hero): void {
  if (h.id === 'pistoleiro') Object.assign(col, LEG_DEFAULT);
  else {
    const legs = h.skirt || h.pants;
    Object.assign(col, { pants: legs, pantsL: shadeHex(legs, 1.2), boot: h.boot, coat: h.coat || h.vest || h.shirt });
  }
}
