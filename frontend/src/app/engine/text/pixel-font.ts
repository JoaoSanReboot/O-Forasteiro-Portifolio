import { Ctx } from '../core/canvas';

// fonte 5 x 7 das placas das cenas
const GL: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'], K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'], M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'], O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'], Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'], S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'], W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  '#': ['01010', '11111', '01010', '01010', '11111', '01010', '00000'], '.': ['0', '0', '0', '0', '0', '0', '1'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'],
};
GL['É'] = GL['E'];
GL['Ã'] = GL['A'];

/** altura das letras da fonte grande */
export const PIXEL_FONT_HEIGHT = 7;

export const textWidth = (t: string): number => [...t].reduce((w, ch) => w + GL[ch][0].length + 1, -1);

export function pixelText(g: Ctx, text: string, x: number, y: number, color: string, center = true, upto = Infinity): number {
  let cx = center ? Math.round(x - textWidth(text) / 2) : x;
  g.fillStyle = color;
  let i = 0;
  for (const ch of text) {
    if (i++ >= upto) break;
    const gl = GL[ch];
    gl.forEach((row, ry) => [...row].forEach((b, rx) => { if (b === '1') g.fillRect(cx + rx, y + ry, 1, 1); }));
    if (ch === 'É') { g.fillRect(cx + 3, y - 3, 1, 1); g.fillRect(cx + 2, y - 2, 1, 1); }
    if (ch === 'Ã') { g.fillRect(cx + 1, y - 2, 1, 1); g.fillRect(cx + 2, y - 3, 1, 1); g.fillRect(cx + 3, y - 2, 1, 1); g.fillRect(cx + 4, y - 3, 1, 1); }
    cx += gl[0].length + 1;
  }
  return cx;
}

/** x onde começa a letra de índice n */
export function charX(text: string, x: number, n: number): number {
  let cx = x;
  let i = 0;
  for (const ch of text) { if (i++ >= n) break; cx += GL[ch][0].length + 1; }
  return cx;
}

// fonte 5 x 7 da placa da porteira (abertura), com sombra clara; o espaço tem 3 px, não 2
const GATE: Record<string, readonly string[]> = {
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  I: ['111', '010', '010', '010', '010', '010', '111'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Ê': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  ' ': ['000', '000', '000', '000', '000', '000', '000'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'Ó': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
};

export function gateText(ctx: Ctx, text: string, cx: number, y: number, color: string, light: string): void {
  const chars = [...text];
  const width = chars.reduce((w, ch) => w + GATE[ch][0].length + 1, -1);
  let x = Math.round(cx - width / 2);
  for (const ch of chars) {
    const g = GATE[ch];
    g.forEach((row, ry) => [...row].forEach((b, rx) => {
      if (b !== '1') return;
      ctx.fillStyle = light; ctx.fillRect(x + rx + 1, y + ry + 1, 1, 1);
      ctx.fillStyle = color; ctx.fillRect(x + rx, y + ry, 1, 1);
    }));
    if (ch === 'Ó') { ctx.fillStyle = color; ctx.fillRect(x + 3, y - 3, 1, 1); ctx.fillRect(x + 2, y - 2, 1, 1); }
    if (ch === 'Ê') { ctx.fillStyle = color; ctx.fillRect(x + 2, y - 3, 1, 1); ctx.fillRect(x + 1, y - 2, 1, 1); ctx.fillRect(x + 3, y - 2, 1, 1); }
    x += g[0].length + 1;
  }
}
