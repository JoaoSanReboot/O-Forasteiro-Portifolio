import { makeCanvas } from '../core/canvas';
import { shadeHex } from '../core/color';
import { K } from '../draw/primitives';

export type HeroId = 'pistoleiro' | 'misterioso' | 'cowgirl' | 'senhora' | 'cangaceiro';
export type Weapon = 'revolver' | 'twin' | 'lasso' | 'pin' | 'rifle';
export type HeroView = 'front' | 'side' | 'back';

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

/**
 * personagem inteiro em 32 × 48: "front", "side" (olhando para a direita) ou "back".
 * O pistoleiro de costas é o sprite desenhado à mão (`rider`), quando ele já carregou.
 */
export function drawHero(h: Hero, view: HeroView, rider?: HTMLImageElement | null): HTMLCanvasElement {
  const [c, g] = makeCanvas(32, 48);
  if (view === 'back' && h.id === 'pistoleiro' && rider?.complete && rider.naturalWidth) { g.drawImage(rider, 0, 0); return c; }
  const px = (x: number, y: number, w: number, hh: number, col: string | undefined | null) => { g.fillStyle = col!; g.fillRect(x, y, w, hh); };
  const box = (x: number, y: number, w: number, hh: number, col: string | undefined | null) => { px(x - 1, y - 1, w + 2, hh + 2, K); px(x, y, w, hh, col); };
  const blob = (cx: number, cy: number, r: number, col: string) => { for (let dy = -r; dy <= r; dy++) { const w = Math.round(Math.sqrt(r * r - dy * dy)); px(cx - w, cy + dy, w * 2 + 1, 1, col); } };
  const side = view === 'side', back = view === 'back', front = view === 'front';
  const sleeve = h.coat || h.shirt;
  // cabeleira volumosa: atrás de tudo
  if (h.hairStyle === 'big') {
    const parts = side ? [[13, 10, 9], [9, 14, 6], [14, 4, 6], [19, 7, 5]] : [[16, 9, 9], [9, 12, 6], [23, 12, 6], [16, 3, 6], [10, 6, 5], [22, 6, 5]];
    parts.forEach(([x, y, r]) => blob(x, y, r + 1, K));
    parts.forEach(([x, y, r]) => blob(x, y, r, h.hair));
    parts.forEach(([x, y, r]) => px(x - Math.round(r / 2), y - r + 1, 2, 1, shadeHex(h.hair, 1.08)));
    [[11, 4], [20, 5], [7, 11], [24, 13], [14, 15], [18, 2]].forEach(([x, y]) => px(side ? x - 2 : x, y, 1, 1, shadeHex(h.hair, 0.82)));
  }
  // rabo de cavalo: atrás do corpo nas costas e de lado
  if (h.hairStyle === 'ponytail' && (side || back)) { if (side) { box(8, 8, 3, 13, h.hair); px(8, 9, 3, 1, h.tie); } }
  // pernas, botas ou saia
  if (h.skirt) {
    for (let y = 30; y < 45; y++) {
      const w = side ? 5 + Math.floor((y - 30) / 4) : 8 + Math.floor((y - 30) / 4);
      const x0 = 16 - w;
      px(x0 - 1, y, w * 2 + 2, 1, K); px(x0, y, w * 2, 1, y > 41 ? shadeHex(h.skirt, 0.8) : h.skirt);
    }
    if (side) box(14, 44, 7, 3, h.boot); else { box(11, 44, 4, 3, h.boot); box(17, 44, 4, 3, h.boot); }
  } else if (side) {
    box(13, 34, 4, 10, shadeHex(h.pants, 0.85)); box(16, 34, 4, 10, h.pants);
    box(12, 44, 6, 3, h.boot); box(16, 44, 6, 3, h.boot);
  } else {
    box(11, 34, 4, 10, h.pants); box(17, 34, 4, 10, h.pants);
    box(10, 44, 6, 3, h.boot); box(16, 44, 6, 3, h.boot);
  }
  // tronco
  if (side) {
    if (h.coat) { box(11, 16, 10, 22, h.coat); px(19, 17, 2, 13, h.shirt); }
    else { box(11, 16, 10, 16, h.shirt); if (h.vest) px(11, 17, 6, 14, h.vest); if (!h.skirt) px(11, 30, 10, 2, '#2a1e18'); }
    if (h.shawl) { px(10, 16, 12, 4, h.shawl); px(11, 20, 8, 3, h.shawl); }
    if (h.bandoleer) for (let i = 0; i < 12; i++) { px(12 + Math.floor(i * 0.7), 17 + i, 2, 1, h.bandoleer); if (i % 3 === 0) px(12 + Math.floor(i * 0.7), 17 + i, 1, 1, '#e8c878'); }
    if (!h.skirt && !h.coat) px(20, 27, 2, 5, '#5a3820');
    box(14, 17, 4, 13, sleeve); px(14, 30, 4, 3, h.skin); px(14, 32, 4, 1, K);
  } else {
    if (h.coat) {
      box(7, 16, 18, 22, h.coat);
      if (front) { px(13, 17, 6, 14, h.shirt); px(12, 17, 1, 11, shadeHex(h.coat, 0.7)); px(19, 17, 1, 11, shadeHex(h.coat, 0.7)); px(15, 37, 2, 1, K); }
      else { px(15, 26, 2, 12, shadeHex(h.coat, 0.8)); }
    } else {
      box(8, 16, 16, 16, h.shirt);
      if (h.vest) { if (front) { px(8, 16, 4, 14, h.vest); px(20, 16, 4, 14, h.vest); } else px(8, 16, 16, 14, h.vest); if (h.fringe) for (let x = 8; x < 24; x += 2) { if (front && x > 11 && x < 20) continue; px(x, 30, 1, 2, shadeHex(h.vest, 0.75)); } }
      if (!h.skirt) { px(8, 30, 16, 2, '#2a1e18'); if (front) px(15, 30, 2, 2, '#c0a050'); }
    }
    if (h.shawl) { px(7, 16, 18, 4, h.shawl); for (let i = 0; i < 6; i++) px(9 + i, 20 + i, 14 - i * 2, 1, h.shawl); px(15, 18, 2, 2, shadeHex(h.shawl, 0.75)); }
    if (h.bandoleer) for (let i = 0; i < 14; i++) {
      px(9 + i, 17 + i, 2, 1, h.bandoleer); if (i % 3 === 0) px(9 + i, 17 + i, 1, 1, '#e8c878');
      px(22 - i, 17 + i, 2, 1, shadeHex(h.bandoleer, 0.85)); if (i % 3 === 1) px(23 - i, 17 + i, 1, 1, '#e8c878');
    }
    if (front && !h.skirt) px(22, 27, 2, 6, '#5a3820');
    box(4, 17, 3, 13, sleeve); box(25, 17, 3, 13, sleeve);
    px(4, 30, 3, 3, h.skin); px(25, 30, 3, 3, h.skin); px(4, 32, 3, 1, h.skinD); px(25, 32, 3, 1, h.skinD);
  }
  // pescoço e lenço
  px(14, 14, 4, 2, h.skinD);
  if (h.scarf) { if (side) { px(13, 15, 7, 2, h.scarf); px(19, 17, 2, 2, h.scarf); } else { px(12, 15, 8, 2, h.scarf); if (front) px(15, 17, 2, 2, h.scarf); else px(15, 15, 2, 3, shadeHex(h.scarf, 0.8)); } }
  // cabeça
  if (side) {
    box(12, 6, 9, 9, h.skin); px(21, 10, 1, 2, h.skin); px(22, 10, 0, 0, K);
    px(12, 6, 4, 9, h.hair); px(12, 6, 9, 2, h.hair);
    px(18, 9, 1, 2, K); px(19, 13, 2, 1, h.skinD);
    if (h.facial === 'beard') px(15, 11, 6, 4, h.facialColor);
    if (h.facial === 'stubble') { [[16, 12], [18, 12], [20, 12], [17, 13], [19, 13], [16, 14], [18, 14]].forEach(([x, y]) => px(x, y, 1, 1, h.facialColor)); }
    if (h.facial === 'stache') { px(18, 12, 4, 1, h.facialColor); px(21, 13, 1, 1, h.facialColor); }
    if (h.glasses) { px(17, 9, 3, 1, '#d8d0b8'); px(17, 11, 3, 1, '#d8d0b8'); px(17, 9, 1, 3, '#d8d0b8'); px(19, 9, 1, 3, '#d8d0b8'); }
  } else {
    box(11, 6, 10, 9, back ? h.hair : h.skin);
    px(10, 9, 1, 3, h.skinD); px(21, 9, 1, 3, h.skinD);
    if (front) {
      px(11, 6, 10, 2, h.hair); px(11, 8, 1, 3, h.hair); px(20, 8, 1, 3, h.hair);
      px(13, 10, 1, 2, K); px(18, 10, 1, 2, K);
      if (h.facial === 'beard') { px(11, 11, 10, 4, h.facialColor); px(14, 12, 4, 1, '#5a2a1a'); }
      else if (h.facial === 'stubble') { [[12, 12], [14, 13], [16, 12], [18, 13], [19, 12], [13, 14], [17, 14], [15, 14]].forEach(([x, y]) => px(x, y, 1, 1, h.facialColor)); px(14, 12, 4, 1, shadeHex(h.skin, 0.7)); }
      else if (h.facial === 'stache') { px(13, 12, 6, 1, h.facialColor); px(12, 13, 1, 2, h.facialColor); px(19, 13, 1, 2, h.facialColor); }
      else { px(15, 13, 2, 1, '#a8504a'); px(12, 12, 1, 1, shadeHex(h.skin, 0.9)); px(19, 12, 1, 1, shadeHex(h.skin, 0.9)); }
      if (h.glasses) { px(12, 9, 3, 1, '#d8d0b8'); px(17, 9, 3, 1, '#d8d0b8'); px(12, 9, 1, 3, '#d8d0b8'); px(14, 9, 1, 3, '#d8d0b8'); px(17, 9, 1, 3, '#d8d0b8'); px(19, 9, 1, 3, '#d8d0b8'); px(15, 10, 2, 1, '#d8d0b8'); }
    } else {
      px(12, 7, 2, 1, shadeHex(h.hair, 1.15));
    }
    if (h.hairStyle === 'ponytail' && front) { box(22, 9, 3, 12, h.hair); px(22, 10, 3, 1, h.tie); }
    if (h.hairStyle === 'ponytail' && back) { box(15, 10, 3, 14, h.hair); px(15, 11, 3, 1, h.tie); }
  }
  // chapéus
  if (h.hatStyle === 'cowboy') {
    const bx = side ? 6 : 5, bw = side ? 21 : 22;
    box(bx, 6, bw, 1, h.hat); px(bx - 1, 4, 2, 2, h.hat); px(bx + bw - 1, 4, 2, 2, h.hat); px(bx - 2, 4, 1, 3, K); px(bx + bw + 1, 4, 1, 3, K);
    box(side ? 11 : 10, 1, side ? 10 : 12, 5, h.hat); px(side ? 11 : 10, 4, side ? 10 : 12, 1, h.band);
    if (!side) px(15, 1, 2, 1, shadeHex(h.hat!, 0.6));
    px(side ? 12 : 11, 2, 2, 2, shadeHex(h.hat!, 1.2));
  } else if (h.hatStyle === 'flat') {
    box(side ? 5 : 4, 6, side ? 23 : 24, 1, h.hat);
    box(side ? 11 : 10, 2, side ? 10 : 12, 4, h.hat); px(side ? 11 : 10, 4, side ? 10 : 12, 1, h.band);
  } else if (h.hatStyle === 'halfmoon') {
    const rows = side ? [[15, 3], [13, 6], [12, 8], [11, 10], [10, 12], [9, 13]] : [[13, 6], [10, 12], [8, 16], [6, 20], [5, 22], [4, 24]];
    rows.forEach(([x, w], i) => px(x - 1, i, w + 2, 1, K));
    px(rows[rows.length - 1][0] - 1, rows.length, rows[rows.length - 1][1] + 2, 1, K);
    rows.forEach(([x, w], i) => px(x, i, w, 1, i === rows.length - 1 ? shadeHex(h.hat!, 0.75) : h.hat));
    if (front) { px(15, 1, 2, 3, h.star); px(14, 2, 4, 1, h.star); [[8, 4], [11, 4], [20, 4], [23, 4]].forEach(([x, y]) => px(x, y, 1, 1, '#c8a070')); }
    if (side) px(12, 2, 2, 2, h.star);
  } else if (h.hairStyle !== 'big') {
    px(side ? 12 : 11, 5, side ? 9 : 10, 2, h.hair);
  }
  return c;
}
