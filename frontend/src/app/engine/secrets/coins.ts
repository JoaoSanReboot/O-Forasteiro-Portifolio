import { Ctx } from '../core/canvas';
import { disc, K, O, Pt, R, seg, sparkle } from '../draw/primitives';
import { revolver } from '../figures/props';
import { tinyText } from '../text/tiny-font';

// ================= Segredos: moedas escondidas e o revólver do Xavier =================
// escondidas em lugares do cenário: na vitrine, nas brasas, no relógio, entre os potes...
export const COINS = { armeiro: [163, 104], ferraria: [262, 92], delegacia: [176, 12], telegrafo: [178, 78], escola: [190, 105], saloon: [245, 53], fimdarua: [247, 53] } as const satisfies Record<string, Pt>;
export type CoinId = keyof typeof COINS;
export const COIN_IDS = Object.keys(COINS) as CoinId[];
export const isCoinId = (id: string): id is CoinId => id in COINS;
export const GUN_PRICE = COIN_IDS.length;
/** as moedas, o revólver e o segredo do Saloon */
export const SECRETS_TOTAL = COIN_IDS.length + 2;

// o revólver aprimorado fica no balcão do armeiro, discreto, com a etiqueta de preço
export const GUN_SPOT = { x0: 96, x1: 134, y0: 70, y1: 88 };

export function drawCoin(g: Ctx, id: CoinId, t: number): void {
  const [x, y] = COINS[id];
  disc(g, x, y, 3, K); disc(g, x, y, 2, '#e8b030'); R(g, x - 1, y - 1, 1, 1, '#fff0b0');
  if ((t % 5.2) < 0.16) sparkle(g, x + 2, y - 2, 1);
}

export function drawGunForSale(g: Ctx, t: number): void {
  O(g, 98, 81, 24, 3, '#5a2626');
  revolver(g, 100, 75, '#c89a3a', '#4a2a1a');
  seg(g, 121, 77, 124, 79, 1, '#c8a870'); O(g, 123, 78, 9, 7, '#f3e3c3');
  disc(g, 126, 81, 1, '#c0902a'); tinyText(g, String(GUN_PRICE), 130, 79, '#8a2a20');
  if ((t % 6.4) < 0.14) sparkle(g, 108, 75, 1);
}

export const nearCoin = (id: CoinId, [lx, ly]: Pt): boolean => { const [x, y] = COINS[id]; return Math.hypot(lx - x, ly - y) < 7; };
export const onGun = ([lx, ly]: Pt): boolean => lx > GUN_SPOT.x0 && lx < GUN_SPOT.x1 && ly > GUN_SPOT.y0 && ly < GUN_SPOT.y1;
