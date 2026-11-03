import { makeCanvas } from '../../../engine/core/canvas';
import { Rng } from '../../../engine/core/rng';
import { Palette } from './palette';

// Os sprites da estrada, desenhados uma vez (e de novo quando o personagem ou a tela mudam)

export interface RideSprites {
  /** 4 quadros de galope do cavalo com o cavaleiro de costas */
  mount: HTMLCanvasElement[];
  cactus: HTMLCanvasElement[];
  weed: HTMLCanvasElement;
  town: HTMLCanvasElement;
  skull: HTMLCanvasElement;
  tree: HTMLCanvasElement;
  boulder: HTMLCanvasElement;
  fence: HTMLCanvasElement;
}

/** `rider` é o personagem de costas (drawHero), já com as pernas pintadas na paleta */
export function buildSprites(pal: Palette, rider: HTMLCanvasElement | null, rng: Rng): RideSprites {
  return {
    mount: [0, 1, 2, 3].map((f) => drawMountFrame(pal, rider, f)),
    cactus: [0, 1, 2].map((v) => drawCactus(pal, v)),
    weed: drawWeed(pal, rng),
    town: drawTown(pal),
    skull: drawSkull(pal),
    tree: drawDeadTree(pal),
    boulder: drawBoulder(pal),
    fence: drawFence(pal),
  };
}

// ---------- Cavalo e cavaleiro, vistos de trás ----------
// 4 quadros de galope. Ordem: 0 apoio, 1 perna esquerda no ar, 2 suspensão, 3 perna direita no ar
export function drawMountFrame(pal: Palette, rider: HTMLCanvasElement | null, f: number): HTMLCanvasElement {
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
    g.fillStyle = pal.k; g.fillRect(x - 1, top, 5, bottom - top + 2);
    g.fillStyle = pal.horseDD; g.fillRect(x, top, 3, bottom - top);
    g.fillStyle = pal.hoof; g.fillRect(x, bottom - 1, 3, 2);
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
      g.fillStyle = pal.k; g.fillRect(x - 1, y, w + 2, 1);
      g.fillStyle = upper ? (i === 0 ? pal.horse : pal.horseD) : pal.horseDD; g.fillRect(x, y, w, 1);
      if (!upper && i === 0) { g.fillStyle = pal.horseD; g.fillRect(x, y, 1, 1); }
    }
    // casco: mostra a sola quando a perna sobe
    g.fillStyle = pal.k; g.fillRect(legX[i], bottom - 2, 6, 3);
    g.fillStyle = lift[i] > 3 ? pal.sole : pal.hoof; g.fillRect(legX[i] + 1, bottom - 2, 4, 2);
  }

  // --- garupa ---
  for (let dy = -ry; dy <= ry; dy++) {
    const w = Math.floor(rx * Math.sqrt(1 - (dy * dy) / (ry * ry)));
    g.fillStyle = pal.k; g.fillRect(cx - w - 1, cy + dy, w * 2 + 3, 1);
    for (let x = -w; x <= w; x++) {
      let col = x < -w * 0.4 ? pal.horseL : x > w * 0.5 ? pal.horseD : pal.horse;
      if (Math.abs(x) <= 1 && dy > -3) col = pal.horseD; // vinco entre as ancas
      px(cx + x, cy + dy, col);
    }
  }
  g.fillStyle = pal.k; g.fillRect(cx - 11, cy - ry - 1, 23, 1);

  // --- rabo, que sobe e balança no galope ---
  const sway = [0, 3, 1, -3][f];
  const tailTop = cy - ry + 3;
  for (let i = 0; i < 18; i++) {
    const y = tailTop + i;
    const x = cx + Math.round(sway * i / 12 + Math.sin(i * 0.5 + f) * 0.6);
    const w = i < 3 ? 3 : 4;
    g.fillStyle = pal.k; g.fillRect(x - 2, y, w + 2, 1);
    g.fillStyle = i % 5 === 2 ? '#5a3a24' : pal.mane; g.fillRect(x - 1, y, w, 1);
  }

  // --- abas do casaco caídas nos flancos, balançando ---
  const flap = [0, 1, 2, 1][f];
  for (const side of [-1, 1]) {
    for (let y = saddleY - 1; y < saddleY + 7 + flap; y++) {
      const x = side < 0 ? cx - 14 - Math.floor((y - saddleY) / 4) : cx + 11 + Math.floor((y - saddleY) / 4);
      g.fillStyle = pal.k; g.fillRect(x - 1, y, 5, 1);
      g.fillStyle = y === saddleY + 6 + flap ? pal.coatD : pal.coat; g.fillRect(x, y, 3, 1);
    }
  }

  // --- manta e sela ---
  for (let y = saddleY - 3; y <= saddleY + 2; y++) {
    g.fillStyle = y === saddleY ? pal.blanketL : pal.blanket;
    g.fillRect(cx - 13, y, 27, 1);
  }
  g.fillStyle = pal.k; g.fillRect(cx - 14, saddleY - 3, 1, 6); g.fillRect(cx + 14, saddleY - 3, 1, 6);
  g.fillRect(cx - 13, saddleY + 3, 27, 1);
  g.fillStyle = pal.saddle; g.fillRect(cx - 9, saddleY - 5, 19, 4);
  g.fillStyle = pal.saddleL; g.fillRect(cx - 9, saddleY - 5, 19, 1);

  // --- pernas do cavaleiro: coxa sobre a sela, canela pelo flanco, bota no estribo ---
  for (const side of [-1, 1]) {
    const thighX = side < 0 ? cx - 12 : cx + 9;
    const shinX = side < 0 ? cx - 17 : cx + 14;
    const yTop = saddleY - 6 + bobR;
    // coxa (diagonal para fora)
    for (let i = 0; i < 6; i++) {
      const x = thighX + side * Math.floor(i / 2);
      g.fillStyle = pal.k; g.fillRect(x - 1, yTop + i, 6, 1);
      g.fillStyle = side < 0 ? pal.pantsL : pal.pants; g.fillRect(x, yTop + i, 4, 1);
    }
    // canela descendo pelo flanco
    for (let y = yTop + 6; y < yTop + 14; y++) {
      g.fillStyle = pal.k; g.fillRect(shinX - 1, y, 5, 1);
      g.fillStyle = pal.pants; g.fillRect(shinX, y, 3, 1);
    }
    // bota e estribo
    g.fillStyle = pal.k; g.fillRect(shinX - 2, yTop + 14, 7, 5);
    g.fillStyle = pal.boot; g.fillRect(shinX - 1, yTop + 14, 5, 4);
    g.fillStyle = pal.stirrup; g.fillRect(shinX - 1, yTop + 18, 5, 1);
    g.fillStyle = '#6a5a4e'; g.fillRect(shinX + (side < 0 ? 2 : 0), yTop + 15, 1, 1); // espora
  }

  // --- tronco do cavaleiro (sprite de costas), sentado na sela ---
  // cabeça e ombros em tamanho normal; o tronco é alongado para ele não parecer baixinho
  if (rider) {
    const head = 17, torsoSrc = 8, torso = 15;   // linhas do sprite: 0-16 cabeça/ombros, 17-24 tronco
    const sx = cx - 16 + (f === 2 ? 1 : 0);
    const top = saddleY - head - torso - 2 + bobR;
    g.drawImage(rider, 0, head, 32, torsoSrc, sx, top + head, 32, torso);
    g.drawImage(rider, 0, 0, 32, head, sx, top, 32, head);
    // cintura apoiada na sela
    const waist = top + head + torso;
    g.fillStyle = pal.k; g.fillRect(cx - 10, waist, 21, 1);
    g.fillStyle = pal.coat; g.fillRect(cx - 9, waist, 19, 1);
  }
  return c;
}

// ---------- Outros sprites ----------
export function drawCactus(pal: Palette, variant: number): HTMLCanvasElement {
  const [c, g] = makeCanvas(18, 30);
  const stem = (x: number, y0: number, y1: number, w: number) => {
    g.fillStyle = pal.k; g.fillRect(x - 1, y0 - 1, w + 2, y1 - y0 + 2);
    g.fillStyle = pal.cactus; g.fillRect(x, y0, w, y1 - y0);
    g.fillStyle = pal.cactusL; g.fillRect(x, y0, 1, y1 - y0);
    g.fillStyle = pal.cactusD; g.fillRect(x + w - 1, y0, 1, y1 - y0);
  };
  stem(7, 3, 29, 4);
  if (variant !== 2) { stem(2, 9, 18, 3); g.fillStyle = pal.k; g.fillRect(4, 17, 4, 3); g.fillStyle = pal.cactus; g.fillRect(4, 18, 4, 1); }
  if (variant !== 1) { stem(13, 6, 15, 3); g.fillStyle = pal.k; g.fillRect(10, 14, 4, 3); g.fillStyle = pal.cactus; g.fillRect(10, 15, 4, 1); }
  g.fillStyle = '#e8dcc0';
  for (let y = 6; y < 28; y += 4) { g.fillRect(6, y, 1, 1); g.fillRect(11, y + 2, 1, 1); }
  return c;
}

export function drawWeed(pal: Palette, rng: Rng): HTMLCanvasElement {
  const [c, g] = makeCanvas(14, 14);
  const rnd = () => rng.next();
  rng.seed = 99;
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 2 + rnd() * 4.5;
    g.fillStyle = rnd() < 0.35 ? pal.weedD : pal.weed;
    g.fillRect(Math.round(7 + Math.cos(a) * r), Math.round(7 + Math.sin(a) * r), 1, 1);
  }
  for (let i = 0; i < 20; i++) {
    const a = rnd() * Math.PI * 2;
    g.fillStyle = pal.weedD;
    g.fillRect(Math.round(7 + Math.cos(a) * 6), Math.round(7 + Math.sin(a) * 6), 1, 1);
  }
  return c;
}

export function drawTown(pal: Palette): HTMLCanvasElement {
  const [c, g] = makeCanvas(120, 40);
  const box = (x: number, y: number, w: number, h: number, wall: string, roof: string | null) => {
    g.fillStyle = pal.k; g.fillRect(x - 1, y - 1, w + 2, h + 1);
    g.fillStyle = wall; g.fillRect(x, y, w, h);
    if (roof) { g.fillStyle = roof; g.fillRect(x - 1, y - 2, w + 2, 2); }
  };
  const win = (x: number, y: number) => { g.fillStyle = pal.window; g.fillRect(x, y, 2, 2); };
  box(4, 28, 14, 12, pal.townL, pal.roof); win(7, 31); win(12, 31);
  box(20, 26, 12, 14, pal.town, null); g.fillStyle = pal.townD; g.fillRect(20, 24, 12, 2); win(23, 30);
  box(84, 27, 16, 13, pal.townL, pal.roof); win(88, 31); win(94, 31);
  box(102, 29, 14, 11, pal.town, pal.roof); win(106, 32);
  g.fillStyle = pal.k; g.fillRect(34, 22, 1, 18); g.fillRect(43, 22, 1, 18); g.fillRect(36, 30, 6, 1);
  box(33, 12, 12, 10, pal.townD, null); g.fillStyle = pal.townD; g.fillRect(34, 10, 10, 2);
  box(48, 22, 24, 18, pal.townL, null);
  g.fillStyle = pal.k; for (let i = 0; i < 13; i++) g.fillRect(47 + i, 22 - i * 0.6, 26 - i * 2, 1);
  g.fillStyle = pal.roof; for (let i = 1; i < 12; i++) g.fillRect(48 + i, 22 - i * 0.6, 24 - i * 2, 1);
  box(56, 4, 8, 18, pal.town, null);
  g.fillStyle = pal.window; g.fillRect(58, 8, 4, 4);
  g.fillStyle = pal.k; g.fillRect(59, 0, 2, 5); g.fillRect(57, 1, 6, 1);
  g.fillStyle = pal.window; g.fillRect(58, 32, 4, 8);
  g.fillStyle = pal.k; g.fillRect(78, 14, 1, 26); g.fillRect(74, 13, 9, 1); g.fillRect(78, 9, 1, 9);
  g.fillRect(75, 10, 7, 1); g.fillRect(76, 16, 5, 1);
  box(73, 30, 10, 10, pal.town, pal.roof); win(76, 33);
  return c;
}

// árvore seca da caatinga: 22 x 30
export function drawDeadTree(pal: Palette): HTMLCanvasElement {
  const [c, g] = makeCanvas(22, 30);
  const br = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      g.fillStyle = pal.k; g.fillRect(x - 1, y, 3, 1);
      g.fillStyle = '#6e5642'; g.fillRect(x, y, 1, 1);
    }
  };
  g.fillStyle = pal.k; g.fillRect(9, 12, 4, 18);
  g.fillStyle = '#6e5642'; g.fillRect(10, 12, 2, 18);
  br(10, 14, 3, 6); br(5, 9, 2, 3); br(11, 12, 18, 4); br(16, 7, 20, 2); br(11, 16, 16, 12); br(10, 13, 9, 1);
  return c;
}
// pedra grande: 26 x 16
export function drawBoulder(pal: Palette): HTMLCanvasElement {
  const [c, g] = makeCanvas(26, 16);
  for (let y = 0; y < 16; y++) {
    const w = Math.round(12 * Math.sqrt(1 - Math.pow((y - 10) / 10, 2)) || 0);
    if (w <= 0) continue;
    g.fillStyle = pal.k; g.fillRect(13 - w - 1, y, w * 2 + 2, 1);
    g.fillStyle = y < 6 ? '#c79a68' : '#a8794a'; g.fillRect(13 - w, y, w * 2, 1);
    g.fillStyle = '#8a6038'; g.fillRect(13 + Math.round(w * 0.4), y, Math.round(w * 0.6), 1);
  }
  g.fillStyle = '#e0b886'; g.fillRect(7, 4, 5, 1);
  return c;
}
// cerca de varas quebrada: 28 x 12
export function drawFence(pal: Palette): HTMLCanvasElement {
  const [c, g] = makeCanvas(28, 12);
  [1, 12, 24].forEach((x, i) => {
    g.fillStyle = pal.k; g.fillRect(x - 1, i === 1 ? 3 : 0, 4, 12);
    g.fillStyle = '#7a5a3c'; g.fillRect(x, i === 1 ? 4 : 1, 2, 11);
  });
  g.fillStyle = pal.k; g.fillRect(0, 3, 15, 3); g.fillRect(12, 6, 15, 3);
  g.fillStyle = '#9a7650'; g.fillRect(1, 4, 13, 1); g.fillRect(13, 7, 13, 1);
  return c;
}

export function drawSkull(pal: Palette): HTMLCanvasElement {
  const [c, g] = makeCanvas(12, 6);
  g.fillStyle = '#efe4cc';
  g.fillRect(4, 1, 4, 4); g.fillRect(0, 0, 3, 1); g.fillRect(9, 0, 3, 1); g.fillRect(2, 1, 2, 1); g.fillRect(8, 1, 2, 1);
  g.fillStyle = pal.k; g.fillRect(4, 2, 1, 1); g.fillRect(7, 2, 1, 1);
  return c;
}
