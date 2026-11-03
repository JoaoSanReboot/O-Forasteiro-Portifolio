// O elenco: a ficha de cada personagem (cores, roupa e arma). O desenho fica em hero-sprite.ts.
export type HeroId = 'pistoleiro' | 'misterioso' | 'cowgirl' | 'senhora' | 'cangaceiro';
export type Weapon = 'revolver' | 'twin' | 'lasso' | 'pin' | 'rifle';

/** a mesma ficha desenha o personagem na seleção (frente, lado e costas), na cavalgada (costas) e no duelo (frente) */
export interface Hero {
  id: HeroId;
  name: string;
  short: string;
  weapon: Weapon;
  tag: string;
  skin: string;
  skinD: string;
  hair: string;
  hairStyle: 'short' | 'ponytail' | 'big';
  tie?: string;
  facial: 'beard' | 'stubble' | 'stache' | null;
  facialColor?: string;
  glasses?: boolean;
  hat: string | null;
  hatStyle: 'cowboy' | 'flat' | 'halfmoon' | null;
  band?: string;
  star?: string;
  coat: string | null;
  shirt: string;
  vest?: string;
  fringe?: boolean;
  shawl?: string;
  skirt?: string;
  bandoleer?: string;
  scarf?: string | null;
  pants: string;
  boot: string;
}

// ---------- Elenco: cinco forasteiros para escolher ----------
export const HEROES: readonly Hero[] = [
  { id: 'pistoleiro', name: 'Pistoleiro clássico', short: 'Pistoleiro', weapon: 'revolver', tag: 'Chapéu escuro, sobretudo, lenço vermelho e o revólver de sempre.',
    skin: '#c48c64', skinD: '#8a5c40', hair: '#2a1e18', hairStyle: 'short', facial: 'beard', facialColor: '#3a2a22',
    hat: '#2c2421', hatStyle: 'cowboy', band: '#3e2e28', coat: '#3c3230', shirt: '#2a2422', scarf: '#8a2a22', pants: '#28221f', boot: '#1e1816' },
  { id: 'misterioso', name: 'Forasteiro misterioso', short: 'Misterioso', weapon: 'twin', tag: 'Fala pouco e saca com as duas mãos. Ninguém sabe de onde veio.',
    skin: '#c8946c', skinD: '#946446', hair: '#141010', hairStyle: 'short', facial: 'stubble', facialColor: '#4a3a32',
    hat: '#141212', hatStyle: 'flat', band: '#8a8682', coat: '#1c1a1a', shirt: '#5a5654', vest: '#2a2626', scarf: null, pants: '#2a2626', boot: '#100c0a' },
  { id: 'cowgirl', name: 'Vaqueira aventureira', short: 'Vaqueira', weapon: 'lasso', tag: 'Laço na mão e coragem de sobra. Topa qualquer trilha.',
    skin: '#e0aa84', skinD: '#b07a5a', hair: '#9a4a1e', hairStyle: 'ponytail', tie: '#e8c050', facial: null,
    hat: '#d8b880', hatStyle: 'cowboy', band: '#7a3a22', coat: null, shirt: '#3a7ab0', vest: '#8a5a2a', fringe: true, scarf: '#2a8a7a', pants: '#34466a', boot: '#6a3a1e' },
  { id: 'senhora', name: 'Senhora cabeluda', short: 'Senhora', weapon: 'pin', tag: 'Cabeleira que o vento não vence e um rolo de amassar pão que ninguém quer levar na testa.',
    skin: '#c08a64', skinD: '#8a5c40', hair: '#e8e0d4', hairStyle: 'big', facial: null, glasses: true,
    hat: null, hatStyle: null, coat: null, shirt: '#7a2a4a', shawl: '#c89a3a', skirt: '#4a3a5a', pants: '#4a3a5a', boot: '#2a1e18' },
  { id: 'cangaceiro', name: 'Cangaceiro do sertão', short: 'Cangaceiro', weapon: 'rifle', tag: 'Chapéu de couro em meia-lua, cartucheira cruzada e um rifle que ecoa no sertão.',
    skin: '#a8704a', skinD: '#7a4a30', hair: '#1e1612', hairStyle: 'short', facial: 'stache', facialColor: '#1e1612',
    hat: '#8a5a30', hatStyle: 'halfmoon', star: '#e8c050', band: '#5a3a20', coat: null, shirt: '#8a7a5a', bandoleer: '#5a3a20', scarf: '#a8322a', pants: '#6a5a40', boot: '#4a2e1a' },
];

export const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h])) as Record<HeroId, Hero>;
export const isHeroId = (v: unknown): v is HeroId => typeof v === 'string' && v in HERO_BY_ID;
