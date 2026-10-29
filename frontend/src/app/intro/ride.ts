import { VilaAudio } from '../engine/audio/vila-audio';
import { Ctx, makeCanvas } from '../engine/core/canvas';
import { shadeHex } from '../engine/core/color';
import { clamp, easeIn, easeOut, lerp, prog, smooth } from '../engine/core/math';
import { Rng } from '../engine/core/rng';
import { ditherFill as dither, ditherPattern } from '../engine/draw/dither';
import { drawHero, Hero } from '../engine/heroes/heroes';
import { gateText } from '../engine/text/pixel-font';

// A abertura: cena de tela cheia em canvas de baixa resolução, narração na faixa de cima e
// o cartaz em canvas de alta resolução por cima. Mundo único (sertão ao entardecer).
// Port do legado (intro.src.html) quase linha a linha: o estado que muda a cada quadro fica em variáveis comuns.

// Linha do tempo em "segundos de história" (avança mais rápido com espaço)
export const P = {
  fadeIn: 1.5,
  townFull: 32.0,
  dustFrom: 9.0,
  papersFrom: 20.0,
  fogStart: 26.0,
  fogFull: 31.5,
  posterStart: 30.5,
  posterArrive: 33.5,
  posterLeave: 41.0,
  posterGone: 42.2,
  revealEnd: 43.4,
  arrivalText: 42.8,
} as const;

export const TALE: readonly { at: number; text: string; big?: boolean }[] = [
  { at: 2.0, text: 'Contam as lendas que, numa vila simples do sertão, surgiu um grande programador.' },
  { at: 7.6, text: 'Um dos mais rápidos do oeste.' },
  { at: 11.6, text: 'Nunca perdeu um duelo.' },
  { at: 15.6, text: 'Nunca teve piedade de bugs.' },
  { at: 20.0, text: 'Dizem que o código dele é tão limpo que brilha no sol. Dá para reconhecer a mais de um quilômetro.' },
  { at: 26.6, big: true, text: 'Um dos programadores mais temidos do oeste.' },
];
const WORDS_PER_S = 4.2; // palavras por segundo de história

export interface RideElements {
  stage: HTMLCanvasElement;
  poster: HTMLCanvasElement;
  tale: HTMLElement;
  taleSr: HTMLElement;
  hint: HTMLElement;
}

export interface RideHooks {
  audio: VilaAudio;
  hero: () => Hero;
  /** o site já está aberto: a abertura só repinta enquanto o topo aparece */
  siteOn: () => boolean;
  /** a narração chegou ao fim (ou foi pulada) */
  onFinish: () => void;
  /** liga e desliga as faixas de cinema */
  cinema: (on: boolean) => void;
}

export interface Ride {
  begin(reduceMotion: boolean): void;
  skip(): void;
  stop(): void;
  setBoost(on: boolean): void;
  readonly boosting: boolean;
  /** a cavalgada está andando e ainda não terminou (espaço e toque aceleram) */
  readonly riding: boolean;
  /** monta de novo os sprites (troca de personagem, tamanho da tela, sprite carregado) */
  rebuild(): void;
  resize(): void;
  redrawGate(): void;
  destroy(): void;
  /** o sprite do pistoleiro de costas chega depois: quem usa a abertura remonta tudo no load */
  readonly riderImg: HTMLImageElement;
}

// ---------- Cores ----------
const COL = {
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
const LEG_DEFAULT = { pants: COL.pants, pantsL: COL.pantsL, boot: COL.boot, coat: COL.coat };

interface Prop { kind: string; wx: number; z: number; v?: number; spr?: 'tree' | 'boulder' | 'fence'; k?: number; r?: number; len?: number; tilt?: number }
interface Weed { dir: number; z: number; x: number; phase: number; spin: number; speed: number }
interface Dust { x: number; y: number; vx: number; vy: number; r: number; grow: number; life: number; max: number }
interface Paper { x: number; y: number; side: number; vx: number; vy: number; flip: number; spin: number; phase: number; size: number; life: number; max: number }
interface Petal { x: number; y: number; ph: number; v: number }
interface TaleNode { el: HTMLElement; line: (typeof TALE)[number]; words: HTMLElement[]; shown: number; announced: boolean }

export function createRide(els: RideElements, hooks: RideHooks): Ride {
  const { stage: canvas, poster: pcan } = els;
  const ctx = canvas.getContext('2d')!;
  const pctx = pcan.getContext('2d')!;
  const Audio = hooks.audio;
  let H = 180, W = 320, HORIZON = 85;

  const rng = new Rng(7);
  const rnd = () => rng.next();
  const ditherFill = (color: string, amount: number) => dither(ctx, W, H, color, amount);

  function resize(): void {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    if (aspect >= 1) { H = 180; W = Math.round(clamp(H * aspect, 180, 400)); }
    else { W = 180; H = Math.round(clamp(W / aspect, 180, 400)); }
    canvas.width = W; canvas.height = H;
    HORIZON = Math.round(H * (aspect < 0.8 ? 0.56 : 0.47));
    ctx.imageSmoothingEnabled = false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    pcan.width = Math.round(window.innerWidth * dpr);
    pcan.height = Math.round(window.innerHeight * dpr);
  }

  function disc(g: Ctx, x: number, y: number, r: number, color: string): void {
    g.fillStyle = color;
    const rr = Math.max(0.5, r);
    for (let dy = -Math.floor(rr); dy <= Math.floor(rr); dy++) {
      const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
      g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
    }
  }

  // ---------- Cavalo e cavaleiro, vistos de trás ----------
  const riderImg = new Image();
  riderImg.src = 'assets/forasteiro-costas.png';
  // a cavalgada usa o mesmo personagem, de costas, e pinta as pernas com as cores dele
  let RIDER: HTMLCanvasElement | null = null;
  function prepareRider(): void {
    const h = hooks.hero();
    RIDER = drawHero(h, 'back', riderImg);
    if (h.id === 'pistoleiro') Object.assign(COL, LEG_DEFAULT);
    else {
      const legs = h.skirt || h.pants;
      Object.assign(COL, { pants: legs, pantsL: shadeHex(legs, 1.2), boot: h.boot, coat: h.coat || h.vest || h.shirt });
    }
  }

  // 4 quadros de galope. Ordem: 0 apoio, 1 perna esquerda no ar, 2 suspensão, 3 perna direita no ar
  function drawMountFrame(f: number): HTMLCanvasElement {
    const FW = 60, FH = 78;
    const [c, g] = makeCanvas(FW, FH);
    const cx = 30;
    const bobH = [0, -1, -2, -1][f];             // garupa sobe e desce
    const bobR = [1, 0, -1, 0][f];               // cavaleiro atrasado meio passo
    const cy = 46 + bobH;                         // centro da garupa
    const rx = 15, ry = 10;
    const saddleY = cy - ry;                      // topo da garupa
    const px = (x: number, y: number, col: string) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };

    // --- patas dianteiras, entre as traseiras e mais escuras ---
    const liftF = [[3, 0], [0, 0], [0, 3], [1, 1]][f];
    [cx - 5, cx + 2].forEach((x, i) => {
      const top = cy + 4, bottom = FH - 5 - liftF[i];
      g.fillStyle = COL.k; g.fillRect(x - 1, top, 5, bottom - top + 2);
      g.fillStyle = COL.horseDD; g.fillRect(x, top, 3, bottom - top);
      g.fillStyle = COL.hoof; g.fillRect(x, bottom - 1, 3, 2);
    });

    // --- pernas traseiras ---
    const lift = [[0, 0], [7, 0], [2, 2], [0, 7]][f];
    const legX = [cx - 11, cx + 6];
    for (let i = 0; i < 2; i++) {
      const top = cy + 3, bottom = FH - 2 - lift[i];
      for (let y = top; y <= bottom; y++) {
        const upper = y < top + 8;
        const w = upper ? 6 : 4;
        const x = legX[i] + (upper ? 0 : 1);
        g.fillStyle = COL.k; g.fillRect(x - 1, y, w + 2, 1);
        g.fillStyle = upper ? (i === 0 ? COL.horse : COL.horseD) : COL.horseDD; g.fillRect(x, y, w, 1);
        if (!upper && i === 0) { g.fillStyle = COL.horseD; g.fillRect(x, y, 1, 1); }
      }
      // casco: mostra a sola quando a perna sobe
      g.fillStyle = COL.k; g.fillRect(legX[i], bottom - 2, 6, 3);
      g.fillStyle = lift[i] > 3 ? COL.sole : COL.hoof; g.fillRect(legX[i] + 1, bottom - 2, 4, 2);
    }

    // --- garupa ---
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.floor(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
      g.fillStyle = COL.k; g.fillRect(cx - w - 1, cy + dy, w * 2 + 3, 1);
      for (let x = -w; x <= w; x++) {
        let col = x < -w * 0.4 ? COL.horseL : x > w * 0.5 ? COL.horseD : COL.horse;
        if (Math.abs(x) <= 1 && dy > -3) col = COL.horseD; // vinco entre as ancas
        px(cx + x, cy + dy, col);
      }
    }
    g.fillStyle = COL.k; g.fillRect(cx - 11, cy - ry - 1, 23, 1);

    // --- rabo, que sobe e balança no galope ---
    const sway = [0, 3, 1, -3][f];
    const tailTop = cy - ry + 3;
    for (let i = 0; i < 18; i++) {
      const y = tailTop + i;
      const x = cx + Math.round(sway * i / 12 + Math.sin(i * 0.5 + f) * 0.6);
      const w = i < 3 ? 3 : 4;
      g.fillStyle = COL.k; g.fillRect(x - 2, y, w + 2, 1);
      g.fillStyle = i % 5 === 2 ? '#5a3a24' : COL.mane; g.fillRect(x - 1, y, w, 1);
    }

    // --- abas do casaco caídas nos flancos, balançando ---
    const flap = [0, 1, 2, 1][f];
    for (const side of [-1, 1]) {
      for (let y = saddleY - 1; y < saddleY + 7 + flap; y++) {
        const x = side < 0 ? cx - 14 - Math.floor((y - saddleY) / 4) : cx + 11 + Math.floor((y - saddleY) / 4);
        g.fillStyle = COL.k; g.fillRect(x - 1, y, 5, 1);
        g.fillStyle = y === saddleY + 6 + flap ? COL.coatD : COL.coat; g.fillRect(x, y, 3, 1);
      }
    }

    // --- manta e sela ---
    for (let y = saddleY - 3; y <= saddleY + 2; y++) {
      g.fillStyle = y === saddleY ? COL.blanketL : COL.blanket;
      g.fillRect(cx - 13, y, 27, 1);
    }
    g.fillStyle = COL.k; g.fillRect(cx - 14, saddleY - 3, 1, 6); g.fillRect(cx + 14, saddleY - 3, 1, 6);
    g.fillRect(cx - 13, saddleY + 3, 27, 1);
    g.fillStyle = COL.saddle; g.fillRect(cx - 9, saddleY - 5, 19, 4);
    g.fillStyle = COL.saddleL; g.fillRect(cx - 9, saddleY - 5, 19, 1);

    // --- pernas do cavaleiro: coxa sobre a sela, canela pelo flanco, bota no estribo ---
    for (const side of [-1, 1]) {
      const thighX = side < 0 ? cx - 12 : cx + 9;
      const shinX = side < 0 ? cx - 17 : cx + 14;
      const yTop = saddleY - 6 + bobR;
      // coxa (diagonal para fora)
      for (let i = 0; i < 6; i++) {
        const x = thighX + side * Math.floor(i / 2);
        g.fillStyle = COL.k; g.fillRect(x - 1, yTop + i, 6, 1);
        g.fillStyle = side < 0 ? COL.pantsL : COL.pants; g.fillRect(x, yTop + i, 4, 1);
      }
      // canela descendo pelo flanco
      for (let y = yTop + 6; y < yTop + 14; y++) {
        g.fillStyle = COL.k; g.fillRect(shinX - 1, y, 5, 1);
        g.fillStyle = COL.pants; g.fillRect(shinX, y, 3, 1);
      }
      // bota e estribo
      g.fillStyle = COL.k; g.fillRect(shinX - 2, yTop + 14, 7, 5);
      g.fillStyle = COL.boot; g.fillRect(shinX - 1, yTop + 14, 5, 4);
      g.fillStyle = COL.stirrup; g.fillRect(shinX - 1, yTop + 18, 5, 1);
      g.fillStyle = '#6a5a4e'; g.fillRect(shinX + (side < 0 ? 2 : 0), yTop + 15, 1, 1); // espora
    }

    // --- tronco do cavaleiro (sprite de costas), sentado na sela ---
    // cabeça e ombros em tamanho normal; o tronco é alongado para ele não parecer baixinho
    if (RIDER) {
      const head = 17, torsoSrc = 8, torso = 15;   // linhas do sprite: 0-16 cabeça/ombros, 17-24 tronco
      const sx = cx - 16 + (f === 2 ? 1 : 0);
      const top = saddleY - head - torso - 2 + bobR;
      g.drawImage(RIDER, 0, head, 32, torsoSrc, sx, top + head, 32, torso);
      g.drawImage(RIDER, 0, 0, 32, head, sx, top, 32, head);
      // cintura apoiada na sela
      const waist = top + head + torso;
      g.fillStyle = COL.k; g.fillRect(cx - 10, waist, 21, 1);
      g.fillStyle = COL.coat; g.fillRect(cx - 9, waist, 19, 1);
    }
    return c;
  }

  // ---------- Outros sprites ----------
  function drawCactus(variant: number): HTMLCanvasElement {
    const [c, g] = makeCanvas(18, 30);
    const stem = (x: number, y0: number, y1: number, w: number) => {
      g.fillStyle = COL.k; g.fillRect(x - 1, y0 - 1, w + 2, y1 - y0 + 2);
      g.fillStyle = COL.cactus; g.fillRect(x, y0, w, y1 - y0);
      g.fillStyle = COL.cactusL; g.fillRect(x, y0, 1, y1 - y0);
      g.fillStyle = COL.cactusD; g.fillRect(x + w - 1, y0, 1, y1 - y0);
    };
    stem(7, 3, 29, 4);
    if (variant !== 2) { stem(2, 9, 18, 3); g.fillStyle = COL.k; g.fillRect(4, 17, 4, 3); g.fillStyle = COL.cactus; g.fillRect(4, 18, 4, 1); }
    if (variant !== 1) { stem(13, 6, 15, 3); g.fillStyle = COL.k; g.fillRect(10, 14, 4, 3); g.fillStyle = COL.cactus; g.fillRect(10, 15, 4, 1); }
    g.fillStyle = '#e8dcc0';
    for (let y = 6; y < 28; y += 4) { g.fillRect(6, y, 1, 1); g.fillRect(11, y + 2, 1, 1); }
    return c;
  }

  function drawWeed(): HTMLCanvasElement {
    const [c, g] = makeCanvas(14, 14);
    rng.seed = 99;
    for (let i = 0; i < 70; i++) {
      const a = rnd() * Math.PI * 2, r = 2 + rnd() * 4.5;
      g.fillStyle = rnd() < 0.35 ? COL.weedD : COL.weed;
      g.fillRect(Math.round(7 + Math.cos(a) * r), Math.round(7 + Math.sin(a) * r), 1, 1);
    }
    for (let i = 0; i < 20; i++) {
      const a = rnd() * Math.PI * 2;
      g.fillStyle = COL.weedD;
      g.fillRect(Math.round(7 + Math.cos(a) * 6), Math.round(7 + Math.sin(a) * 6), 1, 1);
    }
    return c;
  }

  function drawTown(): HTMLCanvasElement {
    const [c, g] = makeCanvas(120, 40);
    const box = (x: number, y: number, w: number, h: number, wall: string, roof: string | null) => {
      g.fillStyle = COL.k; g.fillRect(x - 1, y - 1, w + 2, h + 1);
      g.fillStyle = wall; g.fillRect(x, y, w, h);
      if (roof) { g.fillStyle = roof; g.fillRect(x - 1, y - 2, w + 2, 2); }
    };
    const win = (x: number, y: number) => { g.fillStyle = COL.window; g.fillRect(x, y, 2, 2); };
    box(4, 28, 14, 12, COL.townL, COL.roof); win(7, 31); win(12, 31);
    box(20, 26, 12, 14, COL.town, null); g.fillStyle = COL.townD; g.fillRect(20, 24, 12, 2); win(23, 30);
    box(84, 27, 16, 13, COL.townL, COL.roof); win(88, 31); win(94, 31);
    box(102, 29, 14, 11, COL.town, COL.roof); win(106, 32);
    g.fillStyle = COL.k; g.fillRect(34, 22, 1, 18); g.fillRect(43, 22, 1, 18); g.fillRect(36, 30, 6, 1);
    box(33, 12, 12, 10, COL.townD, null); g.fillStyle = COL.townD; g.fillRect(34, 10, 10, 2);
    box(48, 22, 24, 18, COL.townL, null);
    g.fillStyle = COL.k; for (let i = 0; i < 13; i++) g.fillRect(47 + i, 22 - i * 0.6, 26 - i * 2, 1);
    g.fillStyle = COL.roof; for (let i = 1; i < 12; i++) g.fillRect(48 + i, 22 - i * 0.6, 24 - i * 2, 1);
    box(56, 4, 8, 18, COL.town, null);
    g.fillStyle = COL.window; g.fillRect(58, 8, 4, 4);
    g.fillStyle = COL.k; g.fillRect(59, 0, 2, 5); g.fillRect(57, 1, 6, 1);
    g.fillStyle = COL.window; g.fillRect(58, 32, 4, 8);
    g.fillStyle = COL.k; g.fillRect(78, 14, 1, 26); g.fillRect(74, 13, 9, 1); g.fillRect(78, 9, 1, 9);
    g.fillRect(75, 10, 7, 1); g.fillRect(76, 16, 5, 1);
    box(73, 30, 10, 10, COL.town, COL.roof); win(76, 33);
    return c;
  }

  // árvore seca da caatinga: 22 x 30
  function drawDeadTree(): HTMLCanvasElement {
    const [c, g] = makeCanvas(22, 30);
    const br = (x0: number, y0: number, x1: number, y1: number) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
        g.fillStyle = COL.k; g.fillRect(x - 1, y, 3, 1);
        g.fillStyle = '#6e5642'; g.fillRect(x, y, 1, 1);
      }
    };
    g.fillStyle = COL.k; g.fillRect(9, 12, 4, 18);
    g.fillStyle = '#6e5642'; g.fillRect(10, 12, 2, 18);
    br(10, 14, 3, 6); br(5, 9, 2, 3); br(11, 12, 18, 4); br(16, 7, 20, 2); br(11, 16, 16, 12); br(10, 13, 9, 1);
    return c;
  }
  // pedra grande: 26 x 16
  function drawBoulder(): HTMLCanvasElement {
    const [c, g] = makeCanvas(26, 16);
    for (let y = 0; y < 16; y++) {
      const w = Math.round(12 * Math.sqrt(1 - Math.pow((y - 10) / 10, 2)) || 0);
      if (w <= 0) continue;
      g.fillStyle = COL.k; g.fillRect(13 - w - 1, y, w * 2 + 2, 1);
      g.fillStyle = y < 6 ? '#c79a68' : '#a8794a'; g.fillRect(13 - w, y, w * 2, 1);
      g.fillStyle = '#8a6038'; g.fillRect(13 + Math.round(w * 0.4), y, Math.round(w * 0.6), 1);
    }
    g.fillStyle = '#e0b886'; g.fillRect(7, 4, 5, 1);
    return c;
  }
  // cerca de varas quebrada: 28 x 12
  function drawFence(): HTMLCanvasElement {
    const [c, g] = makeCanvas(28, 12);
    [1, 12, 24].forEach((x, i) => {
      g.fillStyle = COL.k; g.fillRect(x - 1, i === 1 ? 3 : 0, 4, 12);
      g.fillStyle = '#7a5a3c'; g.fillRect(x, i === 1 ? 4 : 1, 2, 11);
    });
    g.fillStyle = COL.k; g.fillRect(0, 3, 15, 3); g.fillRect(12, 6, 15, 3);
    g.fillStyle = '#9a7650'; g.fillRect(1, 4, 13, 1); g.fillRect(13, 7, 13, 1);
    return c;
  }

  function drawSkull(): HTMLCanvasElement {
    const [c, g] = makeCanvas(12, 6);
    g.fillStyle = '#efe4cc';
    g.fillRect(4, 1, 4, 4); g.fillRect(0, 0, 3, 1); g.fillRect(9, 0, 3, 1); g.fillRect(2, 1, 2, 1); g.fillRect(8, 1, 2, 1);
    g.fillStyle = COL.k; g.fillRect(4, 2, 1, 1); g.fillRect(7, 2, 1, 1);
    return c;
  }

  const SPR = {} as {
    mount: HTMLCanvasElement[]; cactus: HTMLCanvasElement[]; weed: HTMLCanvasElement; town: HTMLCanvasElement;
    skull: HTMLCanvasElement; tree: HTMLCanvasElement; boulder: HTMLCanvasElement; fence: HTMLCanvasElement;
  };
  function buildSprites(): void {
    prepareRider();
    SPR.mount = [0, 1, 2, 3].map(drawMountFrame);
    SPR.cactus = [0, 1, 2].map(drawCactus);
    SPR.weed = drawWeed();
    SPR.town = drawTown();
    SPR.skull = drawSkull();
    SPR.tree = drawDeadTree();
    SPR.boulder = drawBoulder();
    SPR.fence = drawFence();
  }

  // ---------- Cartaz de procurado (alta resolução) ----------
  const portrait = new Image();
  portrait.src = 'assets/retrato.png';
  let posterCanvas: HTMLCanvasElement | null = null;

  // escreve centralizado, diminuindo a letra até caber na largura
  function fitText(g: Ctx, text: string, size: number, family: string, x: number, y: number, maxW: number): void {
    let px = size;
    g.font = `${px}px ${family}`;
    while (g.measureText(text).width > maxW && px > 10) { px -= 2; g.font = `${px}px ${family}`; }
    g.fillText(text, x, y);
  }

  function buildPoster(): void {
    const PW = 600, PH = 920;
    const c = document.createElement('canvas');
    c.width = PW; c.height = PH;
    const g = c.getContext('2d')!;
    rng.seed = 4242;

    // papel com bordas rasgadas
    const pts: [number, number][] = [];
    const jag = (n: number, f: (t: number, j: number) => [number, number]) => { for (let i = 0; i <= n; i++) pts.push(f(i / n, (rnd() - 0.5) * 10)); };
    jag(30, (t, j) => [14 + t * (PW - 28), 12 + j]);
    jag(44, (t, j) => [PW - 12 + j, 14 + t * (PH - 28)]);
    jag(30, (t, j) => [PW - 14 - t * (PW - 28), PH - 12 + j]);
    jag(44, (t, j) => [12 + j, PH - 14 - t * (PH - 28)]);
    g.save();
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.shadowColor = 'rgba(20,10,5,0.45)'; g.shadowBlur = 18; g.shadowOffsetY = 8;
    g.fillStyle = '#ecd9ad'; g.fill();
    g.shadowColor = 'transparent';
    g.clip();
    // manchas e granulação
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = `rgba(${rnd() < 0.5 ? '120,80,40' : '255,245,220'},${0.05 + rnd() * 0.08})`;
      g.fillRect(rnd() * PW, rnd() * PH, 1 + rnd() * 2, 1 + rnd() * 2);
    }
    for (let i = 0; i < 7; i++) {
      const x = rnd() * PW, y = rnd() * PH, r = 30 + rnd() * 90;
      const rg = g.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(150,100,50,0.13)'); rg.addColorStop(1, 'rgba(150,100,50,0)');
      g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // bordas queimadas
    const edge = g.createRadialGradient(PW / 2, PH / 2, PH * 0.32, PW / 2, PH / 2, PH * 0.66);
    edge.addColorStop(0, 'rgba(90,50,20,0)'); edge.addColorStop(1, 'rgba(90,50,20,0.55)');
    g.fillStyle = edge; g.fillRect(0, 0, PW, PH);
    g.restore();

    const ink = '#2a1a10';
    g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';

    // prego no topo
    g.fillStyle = '#3a2a20'; g.beginPath(); g.arc(PW / 2, 34, 7, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#8a7a6a'; g.beginPath(); g.arc(PW / 2 - 2, 32, 2.5, 0, Math.PI * 2); g.fill();

    g.fillStyle = ink;
    fitText(g, 'PROCURADO', 104, 'Rye, "Times New Roman", serif', PW / 2, 138, PW - 96);
    g.fillRect(70, 160, PW - 140, 4); g.fillRect(70, 168, PW - 140, 1);

    // retrato
    const fx = 110, fy = 188, fw = 380, fh = 475;
    g.fillStyle = ink; g.fillRect(fx - 10, fy - 10, fw + 20, fh + 20);
    g.fillStyle = '#e3cfa0'; g.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
    g.fillStyle = ink; g.fillRect(fx - 3, fy - 3, fw + 6, fh + 6);
    g.imageSmoothingEnabled = false;
    if (portrait.complete && portrait.naturalWidth) g.drawImage(portrait, fx, fy, fw, fh);
    g.imageSmoothingEnabled = true;

    g.fillStyle = ink;
    fitText(g, 'JOÃO PEDRO', 70, 'Rye, "Times New Roman", serif', PW / 2, 742, PW - 110);
    fitText(g, 'o código mais limpo do oeste', 33, '"IM Fell English SC", Georgia, serif', PW / 2, 782, PW - 110);
    g.fillRect(150, 802, PW - 300, 2);
    g.font = '28px Rye, "Times New Roman", serif';
    g.fillText('RECOMPENSA', PW / 2, 838);
    fitText(g, '$ 1.000.000', 58, 'Rye, "Times New Roman", serif', PW / 2, 896, PW - 140);
    posterCanvas = c;
  }

  // ---------- Mundo em pseudo-3D ----------
  const FOCAL = 60, CAM_H = 30;
  let props: Prop[] = [], weeds: Weed[] = [], dust: Dust[] = [], papers: Paper[] = [], poles: number[] = [];
  let p = 0;

  const project = (wx: number, z: number) => { const s = FOCAL / z; return { x: W / 2 + wx * s, y: HORIZON + CAM_H * s, s }; };

  function spawnProp(z: number): Prop {
    const r = rnd(), side = rnd() < 0.5 ? -1 : 1;
    if (p >= P.papersFrom - 4 && p < P.posterStart && rnd() < 0.5)
      return { kind: 'paper', wx: (rnd() - 0.5) * 70, z, tilt: rnd() < 0.5 ? 0 : 1 };
    if (r < 0.17) return { kind: 'cactus', v: Math.floor(rnd() * 3), wx: side * (40 + rnd() * 130), z };
    if (r < 0.25) return { kind: 'big', spr: 'tree', wx: side * (55 + rnd() * 130), z, k: 0.9 };
    if (r < 0.31) return { kind: 'big', spr: 'boulder', wx: side * (45 + rnd() * 140), z, k: 0.8 };
    if (r < 0.35) return { kind: 'big', spr: 'fence', wx: side * (40 + rnd() * 60), z, k: 0.8 };
    if (r < 0.38) return { kind: 'skull', wx: side * (18 + rnd() * 40), z };
    if (r < 0.55) return { kind: 'stone', wx: (rnd() - 0.5) * 220, z, r: 0.6 + rnd() * 1.2 };
    return { kind: 'crack', wx: (rnd() - 0.5) * 200, z, len: 4 + rnd() * 10 };
  }

  function resetWorld(): void {
    rng.seed = 7;
    props = [];
    for (let i = 0; i < 70; i++) props.push(spawnProp(6 + rnd() * 240));
    weeds = []; dust = []; papers = []; poles = [];
  }

  function drawSky(t: number): void {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#d9813f'); g.addColorStop(0.55, '#f0b567'); g.addColorStop(1, '#f9e3b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON);
    ctx.fillStyle = ditherPattern(ctx, '#fff1cf', 4); ctx.fillRect(0, HORIZON - 14, W, 14);
    const sx = Math.round(W * 0.7), sy = Math.round(HORIZON * 0.42);
    const pulse = Math.sin(t * 2) * 0.6;
    disc(ctx, sx, sy, 30 + pulse, 'rgba(255,236,190,0.18)');
    disc(ctx, sx, sy, 22 + pulse, 'rgba(255,240,205,0.28)');
    disc(ctx, sx, sy, 15, '#fff3d6');
    disc(ctx, sx, sy, 12, '#fffbea');
  }

  function drawMountains(): void {
    ctx.fillStyle = '#c48b62';
    for (let x = 0; x < W; x++) {
      const h = 6 + Math.round(Math.sin(x * 0.045) * 4 + Math.sin(x * 0.11 + 1) * 2 + Math.sin(x * 0.017) * 5);
      ctx.fillRect(x, HORIZON - h, 1, h);
    }
    ctx.fillStyle = '#b07a56';
    for (let x = 0; x < W; x++) {
      const h = 2 + Math.round(Math.sin(x * 0.07 + 2) * 2 + Math.sin(x * 0.023) * 3);
      if (h > 0) ctx.fillRect(x, HORIZON - h, 1, h);
    }
  }

  function drawTownAt(t: number, scale: number, haze: number): void {
    const img = SPR.town;
    const w = img.width * scale, h = img.height * scale;
    const x0 = W / 2 - w / 2, y0 = HORIZON - h + Math.max(1, scale * 1.5);
    const slices = Math.max(6, Math.round(h / 2));
    for (let i = 0; i < slices; i++) {
      const sy = (img.height / slices) * i, sh = img.height / slices;
      const off = Math.round(Math.sin(t * 7 + i * 0.9) * haze);
      ctx.drawImage(img, 0, sy, img.width, sh, Math.round(x0 + off), Math.round(y0 + (h / slices) * i), Math.round(w), Math.ceil(h / slices));
    }
  }

  function drawGround(dist: number): void {
    const g = ctx.createLinearGradient(0, HORIZON, 0, H);
    g.addColorStop(0, '#e4b97e'); g.addColorStop(1, '#c98f55');
    ctx.fillStyle = g; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 2, HORIZON); ctx.lineTo(W / 2 + 2, HORIZON);
    ctx.lineTo(W / 2 + W * 0.32, H); ctx.lineTo(W / 2 - W * 0.32, H); ctx.closePath(); ctx.clip();
    ctx.fillStyle = ditherPattern(ctx, COL.road, 7); ctx.fillRect(0, HORIZON, W, H - HORIZON);
    for (let i = 0; i < 18; i++) {
      const z = ((i * 14 - dist) % 252 + 252) % 252 + 4;
      for (const side of [-1, 1]) {
        const q = project(side * 14, z);
        ctx.fillStyle = 'rgba(160,110,64,0.55)';
        ctx.fillRect(Math.round(q.x), Math.round(q.y), Math.max(1, Math.round(q.s)), Math.max(1, Math.round(q.s * 3)));
      }
    }
    ctx.restore();
    for (let i = 0; i < 14; i++) {
      const z = ((i * 18 - dist) % 252 + 252) % 252 + 4;
      const q = project(0, z);
      ctx.fillStyle = 'rgba(185,132,80,0.22)';
      ctx.fillRect(0, Math.round(q.y), W, Math.max(1, Math.round(q.s * 0.6)));
    }
  }

  function drawPoles(dz: number): void {
    if (!poles.length) for (let i = 0; i < 9; i++) poles.push(8 + i * 30);
    poles = poles.map((z) => { z -= dz; return z < 3 ? z + 270 : z; }).sort((a, b) => b - a);
    const tops: ({ x: number; y: number } | null)[] = [];
    for (const z of poles) {
      const q = project(78, z);
      const h = Math.round(46 * q.s), w = Math.max(1, Math.round(1.6 * q.s));
      if (q.x > W + 20) { tops.push(null); continue; }
      ctx.fillStyle = COL.k; ctx.fillRect(Math.round(q.x) - 1, Math.round(q.y - h), w + 2, h);
      ctx.fillStyle = '#6e5642'; ctx.fillRect(Math.round(q.x), Math.round(q.y - h), w, h);
      const cw = Math.max(2, Math.round(9 * q.s));
      ctx.fillStyle = COL.k; ctx.fillRect(Math.round(q.x - cw / 2), Math.round(q.y - h + 3 * q.s), cw, Math.max(1, Math.round(q.s)));
      tops.push({ x: q.x, y: q.y - h + 3 * q.s });
    }
    ctx.fillStyle = 'rgba(43,29,22,0.7)';
    for (let i = 0; i < tops.length - 1; i++) {
      const a = tops[i], b = tops[i + 1];
      if (!a || !b) continue;
      const n = Math.ceil(Math.abs(b.x - a.x));
      for (let k = 0; k <= n; k++) {
        const t = k / Math.max(1, n);
        const sag = Math.sin(t * Math.PI) * Math.abs(b.x - a.x) * 0.06;
        ctx.fillRect(Math.round(a.x + (b.x - a.x) * t), Math.round(a.y + (b.y - a.y) * t + sag), 1, 1);
      }
    }
  }

  function drawProps(dz: number): void {
    for (const pr of props) {
      pr.z -= dz;
      // um panfleto no chão, quando o cavalo passa, é erguido pela poeira
      if (pr.kind === 'paper' && pr.z < 13) {
        const q = project(pr.wx, pr.z);
        kickPaper(q.x, q.y, Math.sign(pr.wx || (rnd() - 0.5)), q.s);
        replace(pr, spawnProp(240 + rnd() * 20));
        continue;
      }
      if (pr.z < 3) replace(pr, spawnProp(240 + rnd() * 20));
    }
    props.sort((a, b) => b.z - a.z);
    for (const pr of props) {
      const q = project(pr.wx, pr.z);
      if (q.y < HORIZON + 1 || q.x < -60 || q.x > W + 60) continue;
      if (pr.kind === 'cactus') {
        const img = SPR.cactus[pr.v!], s = q.s * 0.9;
        const w = img.width * s, h = img.height * s;
        if (w < 1) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.28)';
        ctx.fillRect(Math.round(q.x - w * 0.4), Math.round(q.y - 1), Math.round(w * 0.9), Math.max(1, Math.round(s)));
        ctx.drawImage(img, Math.round(q.x - w / 2), Math.round(q.y - h), Math.round(w), Math.round(h));
      } else if (pr.kind === 'paper') {
        // deitado na terra: um retângulo achatado pela perspectiva
        const w = Math.max(1, Math.round(6 * q.s)), h = Math.max(1, Math.round(2 * q.s));
        if (q.s < 0.25) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.35)'; ctx.fillRect(Math.round(q.x - w / 2) + 1, Math.round(q.y) + 1, w, h);
        ctx.fillStyle = pr.tilt ? COL.paperD : COL.paper; ctx.fillRect(Math.round(q.x - w / 2), Math.round(q.y), w, h);
      } else if (pr.kind === 'big') {
        const img = SPR[pr.spr!], s = q.s * pr.k!;
        const w = img.width * s, h = img.height * s;
        if (w < 2) continue;
        ctx.fillStyle = 'rgba(90,50,24,0.25)';
        ctx.fillRect(Math.round(q.x - w * 0.45), Math.round(q.y - 1), Math.round(w * 0.9), Math.max(1, Math.round(s)));
        ctx.drawImage(img, Math.round(q.x - w / 2), Math.round(q.y - h), Math.round(w), Math.round(h));
      } else if (pr.kind === 'skull') {
        const img = SPR.skull, s = q.s * 0.7;
        if (s < 0.4) continue;
        ctx.drawImage(img, Math.round(q.x - (img.width * s) / 2), Math.round(q.y - img.height * s), Math.round(img.width * s), Math.round(img.height * s));
      } else if (pr.kind === 'stone') {
        const r = pr.r! * q.s;
        if (r < 0.5) { ctx.fillStyle = COL.groundD; ctx.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); continue; }
        disc(ctx, q.x, q.y - r * 0.5, r, '#a8794a');
        disc(ctx, q.x - r * 0.3, q.y - r * 0.7, r * 0.5, '#c89a64');
      } else {
        ctx.fillStyle = COL.crack;
        const len = Math.max(1, Math.round(pr.len! * q.s));
        ctx.fillRect(Math.round(q.x), Math.round(q.y), len, 1);
        if (len > 3) ctx.fillRect(Math.round(q.x + len * 0.6), Math.round(q.y) + 1, Math.round(len * 0.5), 1);
      }
    }
  }
  // o Object.assign do legado: os campos antigos que a peça nova não tem continuam lá
  const replace = (pr: Prop, next: Prop) => Object.assign(pr, next);

  function updateWeeds(p: number, dt: number, rate: number): void {
    if (weeds.length < 3 && rnd() < dt * 0.5 && p > 1) {
      const dir = rnd() < 0.5 ? -1 : 1;
      weeds.push({ dir, z: 20 + rnd() * 50, x: dir < 0 ? W + 20 : -20, phase: rnd() * 6, spin: 0, speed: 28 + rnd() * 20 });
    }
    for (const w of weeds) {
      w.x += w.dir * w.speed * dt * (FOCAL / w.z) * 0.6;
      w.z -= dt * 10 * rate;
      w.spin += dt * w.dir * 6;
      w.phase += dt * 7;
    }
    weeds = weeds.filter((w) => w.x > -40 && w.x < W + 40 && w.z > 6);
    for (const w of weeds) {
      const q = project(0, w.z), s = q.s * 0.7;
      const size = SPR.weed.width * s, bounce = Math.abs(Math.sin(w.phase)) * 6 * s;
      ctx.fillStyle = 'rgba(90,50,24,0.25)';
      ctx.fillRect(Math.round(w.x - size / 2), Math.round(q.y - 1), Math.round(size), 1);
      ctx.save();
      ctx.translate(Math.round(w.x), Math.round(q.y - size / 2 - bounce));
      ctx.rotate(Math.round(w.spin * 4) / 4);
      ctx.drawImage(SPR.weed, Math.round(-size / 2), Math.round(-size / 2), Math.round(size), Math.round(size));
      ctx.restore();
    }
  }

  // a faixa de baixo cobre 7,5% da tela: o cavalo galopa logo acima dela
  const groundY = () => H - Math.round(H * 0.075) - 2;
  function mountPos() {
    const img = SPR.mount[0];
    return { x: Math.round(W / 2 - img.width / 2), y: Math.round(groundY() - img.height + 3) };
  }

  function drawMount(frame: number): void {
    const img = SPR.mount && SPR.mount[frame];
    if (!img) return;
    const { x, y } = mountPos();
    ctx.fillStyle = 'rgba(80,44,20,0.35)';
    ctx.fillRect(x + 12, groundY() + 1, img.width - 24, 2);
    ctx.drawImage(img, x, y);
  }

  function emitDust(dt: number, intensity: number, rate: number): void {
    const n = Math.floor((22 + intensity * 150) * dt * (0.6 + rate * 0.4) + rnd());
    for (let i = 0; i < n; i++) {
      const side = rnd() < 0.5 ? -1 : 1;
      dust.push({
        x: W / 2 + side * (5 + rnd() * 9), y: groundY() - 2 - rnd() * 3,
        vx: side * (6 + rnd() * 26) * (0.6 + intensity), vy: -(4 + rnd() * 10) * (0.6 + intensity),
        r: 1 + rnd() * 2, grow: 4 + rnd() * 10 * (0.4 + intensity), life: 0, max: 1.1 + rnd() * 1.4,
      });
    }
    if (intensity > 0.18 && rnd() < dt * intensity * 34) {
      const side = rnd() < 0.5 ? -1 : 1;
      dust.push({
        x: side < 0 ? rnd() * W * 0.3 : W - rnd() * W * 0.3, y: H + 4,
        vx: -side * (4 + rnd() * 10), vy: -(8 + rnd() * 14),
        r: 10 + rnd() * 10, grow: 16 + rnd() * 18, life: 0, max: 2.4 + rnd(),
      });
    }
  }

  function drawDust(dt: number): void {
    for (const d of dust) {
      d.life += dt; d.x += d.vx * dt; d.y += d.vy * dt;
      d.vx *= 0.985; d.vy *= 0.985; d.r += d.grow * dt;
    }
    dust = dust.filter((d) => d.life < d.max);
    for (const d of dust) {
      const lvl = Math.round(clamp((1 - d.life / d.max) * 1.1) * 16);
      if (lvl <= 0) continue;
      const r = d.r;
      ctx.fillStyle = ditherPattern(ctx, '#d9b88a', lvl);
      for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
        const w = Math.floor(Math.sqrt(r * r - dy * dy));
        ctx.fillRect(Math.round(d.x - w), Math.round(d.y + dy), w * 2 + 1, 1);
      }
      ctx.fillStyle = ditherPattern(ctx, '#ecd4a8', Math.max(1, lvl - 6));
      const r2 = r * 0.55;
      for (let dy = -Math.floor(r2); dy <= Math.floor(r2); dy++) {
        const w = Math.floor(Math.sqrt(r2 * r2 - dy * dy));
        ctx.fillRect(Math.round(d.x - r * 0.25 - w), Math.round(d.y - r * 0.25 + dy), w * 2 + 1, 1);
      }
    }
  }

  // panfletos erguidos do chão: sobem com a poeira, giram, perdem força e voltam a cair devagar
  function kickPaper(x: number, y: number, side: number, s: number): void {
    const up = 0.6 + easeIn(prog(p, P.dustFrom, P.fogFull)) * 0.9;
    papers.push({
      x, y, side,
      vx: side * (18 + rnd() * 30) * up, vy: -(45 + rnd() * 45) * up,
      flip: rnd() * 6, spin: (rnd() < 0.5 ? -1 : 1) * (5 + rnd() * 9),
      phase: rnd() * 6, size: clamp(s * 0.9, 0.9, 2.2), life: 0, max: 3.5 + rnd() * 2,
    });
  }
  function updatePapers(p: number, dt: number, rate: number): void {
    const lift = easeIn(prog(p, P.dustFrom, P.fogFull));
    // de vez em quando o casco também chuta um panfleto que estava perto
    if (p > P.papersFrom && p < P.posterStart && rnd() < dt * (0.4 + lift * 3) * rate) {
      const side = rnd() < 0.5 ? -1 : 1;
      kickPaper(W / 2 + side * (8 + rnd() * 8), groundY() - 2, side, 1.6);
    }
    for (const q of papers) {
      q.life += dt;
      // gravidade fraca, arrasto do ar e a corrente de ar quente da poeira
      q.vy += (26 - 40 * lift * Math.max(0, 1 - q.life / 2)) * dt;
      q.vx *= Math.pow(0.55, dt); q.vy *= Math.pow(0.7, dt);
      // o papel desliza de lado enquanto vira (folha caindo)
      const wob = Math.sin(q.life * 4.2 + q.phase);
      q.x += (q.vx + wob * 14 + q.side * 6 * rate) * dt;
      q.y += (q.vy + Math.abs(wob) * 4) * dt;
      q.flip += q.spin * dt * (0.6 + Math.abs(q.vy) / 60);
    }
    papers = papers.filter((q) => q.x > -20 && q.x < W + 20 && q.y > -20 && q.y < H + 10 && q.life < q.max);
    for (const q of papers) {
      const fade = clamp((q.max - q.life) / 0.6);
      if (fade <= 0) continue;
      const w = Math.max(1, Math.round(Math.abs(Math.cos(q.flip)) * 5 * q.size));
      const h = Math.max(2, Math.round((4 + Math.abs(Math.sin(q.flip * 0.5)) * 2) * q.size));
      const x = Math.round(q.x - w / 2), y = Math.round(q.y - h / 2);
      ctx.globalAlpha = fade;
      ctx.fillStyle = COL.k; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = Math.cos(q.flip) > 0 ? COL.paper : COL.paperD;
      ctx.fillRect(x, y, w, h);
      if (w >= 3 && h >= 4 && Math.cos(q.flip) > 0) {
        ctx.fillStyle = '#8a6a44';
        ctx.fillRect(x + 1, y + 1, w - 2, 1);
        ctx.fillRect(x + 1, y + 3, Math.max(1, w - 3), 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---------- Chegada ----------
  // ipê-amarelo ao lado da porteira, soltando flores
  let petals: Petal[] = [];
  function drawIpe(t: number, x: number, baseY: number): void {
    rng.seed = 321;
    ctx.fillStyle = COL.k; ctx.fillRect(x - 2, baseY - 46, 6, 47);
    ctx.fillStyle = '#5a4232'; ctx.fillRect(x - 1, baseY - 46, 4, 46);
    ctx.fillStyle = '#7a5a44'; ctx.fillRect(x - 1, baseY - 46, 1, 46);
    // galhos
    [[-10, -58], [12, -60], [-4, -66], [6, -54]].forEach(([dx, dy]) => {
      const n = Math.max(Math.abs(dx), Math.abs(dy + 46));
      for (let i = 0; i <= n; i++) {
        ctx.fillStyle = '#4a3426';
        ctx.fillRect(Math.round(x + 1 + dx * i / n), Math.round(baseY - 46 + (dy + 46) * i / n), 2, 1);
      }
    });
    // copa: bolotas amarelas com sombra e brilho
    const blobs = [[0, -66, 14], [-12, -60, 11], [13, -60, 12], [-5, -54, 10], [8, -52, 9], [-16, -52, 7], [18, -52, 7]];
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx, baseY + dy + 1, r + 1, '#8a5a1a'));
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx, baseY + dy, r, '#e8b020'));
    blobs.forEach(([dx, dy, r]) => disc(ctx, x + dx - r * 0.3, baseY + dy - r * 0.35, r * 0.55, '#ffd84a'));
    for (let i = 0; i < 40; i++) {
      const a = rnd() * Math.PI * 2, rr = rnd() * 20;
      ctx.fillStyle = rnd() < 0.5 ? '#fff1a0' : '#c98a10';
      ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(baseY - 60 + Math.sin(a) * rr * 0.6), 1, 1);
    }
    // flores caindo
    if (petals.length < 14 && Math.random() < 0.08) petals.push({ x: x - 18 + Math.random() * 36, y: baseY - 56, ph: Math.random() * 6, v: 6 + Math.random() * 6 });
    for (const pt of petals) { pt.y += pt.v / 60; pt.x += Math.sin(t * 2 + pt.ph) * 0.15 - 0.05; }
    petals = petals.filter((pt) => pt.y < baseY + 18);
    ctx.fillStyle = '#ffd23a';
    for (const pt of petals) ctx.fillRect(Math.round(pt.x), Math.round(pt.y), 1, 1);
  }

  function drawArrival(t: number): void {
    drawSky(t);
    drawMountains();
    drawTownAt(t, 2, 0.3);
    ctx.fillStyle = '#d9a868'; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W / 2 - 40, HORIZON); ctx.lineTo(W / 2 + 40, HORIZON);
    ctx.lineTo(W / 2 + W * 0.5, H); ctx.lineTo(W / 2 - W * 0.5, H); ctx.closePath(); ctx.clip();
    ctx.fillStyle = ditherPattern(ctx, COL.road, 9); ctx.fillRect(0, HORIZON, W, H - HORIZON);
    ctx.restore();
    const gx0 = Math.round(W / 2 - 70), gx1 = Math.round(W / 2 + 70), gy = HORIZON + 30;
    drawIpe(t, gx1 + 34, gy + 6);
    // mourões mais altos e a trave
    const postTop = gy - 80;
    ctx.fillStyle = COL.k;
    ctx.fillRect(gx0 - 1, postTop, 8, gy - postTop + 2); ctx.fillRect(gx1 - 6, postTop, 8, gy - postTop + 2);
    ctx.fillStyle = '#6e4426'; ctx.fillRect(gx0, postTop + 1, 6, gy - postTop); ctx.fillRect(gx1 - 5, postTop + 1, 6, gy - postTop);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(gx0, postTop + 1, 2, gy - postTop); ctx.fillRect(gx1 - 5, postTop + 1, 2, gy - postTop);
    const beamY = postTop - 6;
    ctx.fillStyle = COL.k; ctx.fillRect(gx0 - 6, beamY, gx1 - gx0 + 13, 10);
    ctx.fillStyle = '#8a5a34'; ctx.fillRect(gx0 - 5, beamY + 1, gx1 - gx0 + 11, 8);
    ctx.fillStyle = '#a8743e'; ctx.fillRect(gx0 - 5, beamY + 1, gx1 - gx0 + 11, 2);
    ctx.fillStyle = '#5a3820'; for (let x = gx0; x < gx1; x += 9) ctx.fillRect(x, beamY + 5, 4, 1);
    // placa pendurada por correntes, balançando de leve
    const sway = Math.round(Math.sin(t * 1.3) * 1.2);
    const sw = 64, sh = 19, sx = Math.round(W / 2 - sw / 2) + sway, sy = beamY + 24;
    const hooks = [Math.round(W / 2 - 22), Math.round(W / 2 + 22)];
    hooks.forEach((hx) => {
      const ex = hx + sway;
      ctx.fillStyle = COL.k; ctx.fillRect(hx - 1, beamY + 9, 3, 2);
      for (let k = 0; k < 14; k++) {
        const x = Math.round(hx + (ex - hx) * k / 13), y = beamY + 11 + k;
        ctx.fillStyle = k % 2 ? '#5e5650' : '#b0a898'; ctx.fillRect(x, y, k % 2 ? 1 : 2, 1);
      }
    });
    ctx.fillStyle = COL.k; ctx.fillRect(sx - 1, sy - 1, sw + 2, sh + 2);
    for (let r = 0; r < sh; r++) {
      ctx.fillStyle = r % 6 === 5 ? '#8a5a34' : r % 6 === 0 ? '#d4a46a' : '#c08a52';
      ctx.fillRect(sx, sy + r, sw, 1);
    }
    ctx.fillStyle = '#5a3820'; [[3, 3], [sw - 4, 3], [3, sh - 4], [sw - 4, sh - 4]].forEach(([x, y]) => ctx.fillRect(sx + x, sy + y, 1, 1));
    gateText(ctx, 'PORTFÓLIO', Math.round(W / 2) + sway, sy + 7, '#2b1a10', '#e2b47a');
    // o cartaz pregado no mourão esquerdo
    ctx.fillStyle = COL.k; ctx.fillRect(gx0 + 6, gy - 34, 11, 14);
    ctx.fillStyle = COL.paper; ctx.fillRect(gx0 + 7, gy - 33, 9, 12);
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(gx0 + 9, gy - 30, 5, 5); ctx.fillRect(gx0 + 8, gy - 32, 7, 1); ctx.fillRect(gx0 + 8, gy - 23, 7, 1);
    ctx.drawImage(SPR.cactus[0], Math.round(gx0 - 40), gy - 40, 36, 60);
    drawMount(0);
  }

  // ---------- Cartaz voando até a câmera ----------
  function drawPosterLayer(p: number, t: number): void {
    const cw = pcan.width, ch = pcan.height;
    pctx.clearRect(0, 0, cw, ch);
    if (!posterCanvas || p < P.posterStart || p > P.posterGone) return;
    const fit = Math.min((ch * 0.86) / posterCanvas.height, (cw * 0.9) / posterCanvas.width);
    let scale: number, x: number, y: number, rot: number, alpha = 1, squash = 1;
    if (p < P.posterArrive) {
      // sai da poeira, girando e se aproximando
      const k = easeOut(prog(p, P.posterStart, P.posterArrive));
      scale = lerp(0.05, 1, k) * fit;
      x = lerp(cw * 0.62, cw / 2, k) + Math.sin(k * 9) * cw * 0.05 * (1 - k);
      y = lerp(ch * 0.62, ch / 2, k) + Math.cos(k * 7) * ch * 0.04 * (1 - k);
      rot = lerp(2.6, 0.04, k) + Math.sin(t * 6) * 0.25 * (1 - k);
      squash = 0.35 + 0.65 * Math.abs(Math.cos(lerp(6, 0, k)));
      alpha = clamp(k * 3);
    } else if (p < P.posterLeave) {
      // fica tremulando no vento
      scale = fit; x = cw / 2; y = ch / 2 + Math.sin(t * 1.3) * ch * 0.006;
      rot = 0.03 + Math.sin(t * 1.7) * 0.025;
      squash = 1 - Math.abs(Math.sin(t * 2.3)) * 0.03;
    } else {
      // é arrancado pelo vento para o alto
      const k = easeIn(prog(p, P.posterLeave, P.posterGone));
      scale = lerp(1, 1.25, k) * fit;
      x = lerp(cw / 2, -cw * 0.4, k); y = lerp(ch / 2, -ch * 0.3, k);
      rot = lerp(0.03, -1.6, k);
      squash = 1 - k * 0.6;
      alpha = 1 - k * 0.3;
    }
    pctx.save();
    pctx.globalAlpha = alpha;
    pctx.translate(x, y);
    pctx.rotate(rot);
    pctx.scale(scale * squash, scale);
    pctx.drawImage(posterCanvas, -posterCanvas.width / 2, -posterCanvas.height / 2);
    pctx.restore();
  }

  // ---------- Narração ----------
  let taleNodes: TaleNode[] = [];
  function resetTale(): void {
    els.tale.innerHTML = ''; taleNodes = [];
    TALE.forEach((line) => {
      const el = document.createElement('p');
      if (line.big) el.className = 'big';
      const words = line.text.split(' ').map((w, i) => {
        const span = document.createElement('span');
        span.className = 'w'; span.textContent = (i ? ' ' : '') + w;
        el.appendChild(span);
        return span;
      });
      els.tale.appendChild(el);
      taleNodes.push({ el, line, words, shown: 0, announced: false });
    });
  }
  // a frase inteira fica parada no lugar; só as palavras vão acendendo
  function updateTale(p: number): void {
    let current = -1;
    taleNodes.forEach((n, i) => { if (p >= n.line.at) current = i; });
    taleNodes.forEach((n, i) => {
      const next = taleNodes[i + 1];
      const end = next ? next.line.at - 0.6 : P.posterStart + 1.2;
      n.el.classList.toggle('on', i === current && p < end);
      if (i !== current) return;
      const count = Math.min(n.words.length, Math.floor((p - n.line.at) * WORDS_PER_S) + 1);
      for (let k = n.shown; k < count; k++) n.words[k].classList.add('in');
      n.shown = Math.max(n.shown, count);
      if (!n.announced) { n.announced = true; els.taleSr.textContent = n.line.text; }
    });
  }

  // ---------- Controle de velocidade ----------
  let boosting = false, rate = 1;
  function setBoost(on: boolean): void { boosting = on; els.hint.classList.toggle('boost', on); }

  // ---------- Laço principal ----------
  let dist = 0, last = 0, wall = 0, running = false, finished = false, rafId = 0;
  let animPhase = 0, lastFrame = -1, swelled = false, flapped = false, ended = false;

  function frame(now: number): void {
    if (!running) return;
    if (hooks.siteOn() && window.scrollY > window.innerHeight * 1.05) { last = now; rafId = requestAnimationFrame(frame); return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    wall += dt;
    const target = boosting && p < P.posterArrive ? 2.4 : 1;
    rate += (target - rate) * Math.min(1, dt * 3.5);
    p += dt * rate;
    render(dt);
    rafId = requestAnimationFrame(frame);
  }

  function render(dt: number): void {
    const riding = p < P.posterLeave;
    if (riding) {
      const speed = 34 * rate;
      dist += speed * dt;
      const approach = smooth(prog(p, 0, P.townFull));
      drawSky(wall);
      drawMountains();
      drawTownAt(wall, lerp(0.3, 1.7, easeIn(approach)), lerp(1.4, 0.6, approach));
      drawGround(dist);
      drawProps(speed * dt);
      drawPoles(speed * dt);
      updateWeeds(p, dt, rate);
      // galope: velocidade dos quadros acompanha o cavalo
      animPhase += dt * 8.5 * Math.pow(rate, 0.7);
      const f = Math.floor(animPhase) % 4;
      if (f !== lastFrame) {
        if (f === 0 || f === 2) Audio.clop((f === 0 ? 0.26 : 0.16) * (0.8 + rate * 0.2));
        if (f === 1 && rate > 1.4) Audio.clop(0.1);
        lastFrame = f;
      }
      drawMount(f);
      const intensity = easeIn(prog(p, P.dustFrom, P.fogFull));
      emitDust(dt, intensity, rate);
      drawDust(dt);
      ditherFill('#d9b88a', smooth(prog(p, P.fogStart, P.fogFull)));
      updatePapers(p, dt, rate);
      if (!swelled && p > P.fogStart) { swelled = true; Audio.swell((P.fogFull - P.fogStart) / rate + 1.5); }
    } else {
      if (!ended) { ended = true; Audio.finale(); }
      drawArrival(wall);
      ditherFill('#d9b88a', 1 - smooth(prog(p, P.posterLeave, P.revealEnd)));
      updatePapers(p, dt, 1);
    }
    if (!flapped && p > P.posterStart + 1.2) { flapped = true; Audio.flap(); }
    ditherFill('#1b120d', 1 - smooth(prog(p, 0, P.fadeIn)));
    updateTale(p);
    drawPosterLayer(p, wall);
    els.hint.style.opacity = p > 2 && p < P.posterArrive - 0.5 ? '1' : '0';
    hooks.cinema(p > 0.3 && p < P.posterStart + 1.0);
    if (p >= P.arrivalText && !finished) { finished = true; hooks.onFinish(); }
  }

  function begin(reduceMotion: boolean): void {
    finished = false; swelled = false; flapped = false; ended = false;
    p = 0; dist = 0; wall = 0; rate = 1; animPhase = 0; lastFrame = -1; setBoost(false);
    resetWorld(); resetTale();
    Audio.cue('ride', true);
    void Audio.unlock().then(() => Audio.wind());
    if (reduceMotion) { skip(); return; }
    running = true; last = performance.now();
    cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame);
  }

  function skip(): void {
    p = P.revealEnd; ended = false;
    running = true; last = performance.now();
    cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame);
    if (!finished) { finished = true; hooks.onFinish(); }
  }

  const redrawGate = () => { if (!running) { drawArrival(0); ditherFill('#1b120d', 0.6); } };

  // o cartaz só é montado quando as fontes e o retrato estão prontos
  const fontsReady = document.fonts
    ? Promise.race([
        Promise.all(['86px Rye', '23px "IM Fell English SC"', 'italic 28px "IM Fell English"'].map((f) => document.fonts.load(f))),
        new Promise((r) => setTimeout(r, 2500)),
      ])
    : Promise.resolve();
  const portraitReady = new Promise<void>((r) => { if (portrait.complete) r(); else { portrait.onload = () => r(); portrait.onerror = () => r(); } });
  void Promise.all([fontsReady, portraitReady]).then(buildPoster);

  resize();
  buildSprites();
  resetWorld();

  return {
    begin,
    skip,
    // "Rever a chegada" volta para a tela inicial
    stop() { running = false; finished = false; cancelAnimationFrame(rafId); },
    setBoost,
    get boosting() { return boosting; },
    get riding() { return running && !finished; },
    rebuild: buildSprites,
    resize,
    redrawGate,
    destroy() { running = false; cancelAnimationFrame(rafId); },
    riderImg,
  };
}
