(() => {
  "use strict";
  const site = document.getElementById("site");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* sem armazenamento: segue sem lembrar */ } }

  // ================= Entrar e rever a chegada =================
  try { history.scrollRestoration = "manual"; } catch { /* navegador antigo: segue o padrão */ }
  document.addEventListener("vila:enter", (ev) => {
    const quick = !!(ev.detail && ev.detail.quick);
    document.documentElement.classList.add("site-on");
    site.hidden = false;
    sizeScenes();
    // a chegada termina no mural: o visitante cai direto no conteúdo principal
    const mural = document.getElementById("procurado");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      mural.scrollIntoView({ behavior: reduceMotion || quick ? "auto" : "smooth", block: "start" });
      document.getElementById("t-mural").focus({ preventScroll: true });
    });
  });
  document.querySelectorAll(".site-replay").forEach((b) => b.addEventListener("click", () => {
    window.scrollTo(0, 0);
    site.hidden = true;
    document.documentElement.classList.remove("site-on");
    document.dispatchEvent(new CustomEvent("vila:replay"));
  }));

  // ================= Cartaz: os títulos sempre cabem no papel =================
  function fitPoster() {
    document.querySelectorAll(".p-top, .p-name").forEach((el) => {
      el.style.fontSize = "";
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && fs > 18) { fs -= 1; el.style.fontSize = fs + "px"; }
    });
  }
  document.addEventListener("vila:enter", () => requestAnimationFrame(fitPoster));
  window.addEventListener("resize", () => { if (!site.hidden) fitPoster(); });
  if (document.fonts) document.fonts.ready.then(() => { if (!site.hidden) fitPoster(); });

  // ================= Mural: o panfleto que vira =================

  // ================= Pixel art: utilitários =================
  const K = "#1b120d";
  const SW = 320, SH = 150; // tamanho de cada cena; no celular mostramos um recorte em volta do foco
  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function O(g, x, y, w, h, c) { R(g, x - 1, y - 1, w + 2, h + 2, K); R(g, x, y, w, h, c); }
  function disc(g, x, y, r, c) {
    g.fillStyle = c;
    for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
      const w = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillRect(Math.round(x - w), Math.round(y + dy), w * 2 + 1, 1);
    }
  }
  function seg(g, x0, y0, x1, y1, w, c) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w);
  }
  // braço/perna: contorno primeiro, cor por cima
  function limb(g, pts, w, c, c2) {
    if (pts.length !== 3) {
      for (let i = 0; i < pts.length - 1; i++) seg(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w + 2, K);
      for (let i = 0; i < pts.length - 1; i++) seg(g, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, i === pts.length - 2 && c2 ? c2 : c);
      return;
    }
    // ombro, cotovelo e mão viram uma curva suave (sem quina no cotovelo); o cotovelo puxa a curva sem exagerar
    const [S, E, H] = pts;
    const C = [lerp((S[0] + H[0]) / 2, E[0], 1.1), lerp((S[1] + H[1]) / 2, E[1], 1.1)];
    const n = Math.max(8, Math.ceil(Math.hypot(E[0] - S[0], E[1] - S[1]) + Math.hypot(H[0] - E[0], H[1] - E[1])) * 2);
    const P = [];
    for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; P.push([u * u * S[0] + 2 * u * t * C[0] + t * t * H[0], u * u * S[1] + 2 * u * t * C[1] + t * t * H[1], t]); }
    g.fillStyle = K;
    for (const [x, y] of P) g.fillRect(Math.round(x - (w + 2) / 2), Math.round(y - (w + 2) / 2), w + 2, w + 2);
    for (const [x, y, t] of P) { g.fillStyle = t > 0.52 && c2 ? c2 : c; g.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
  }
  function shade(hex, f = 0.75) {
    const n = parseInt(hex.slice(1), 16);
    const s = (v) => Math.max(0, Math.min(255, Math.round(v * f)));
    return `rgb(${s(n >> 16)},${s((n >> 8) & 255)},${s(n & 255)})`;
  }
  function makeCanvas(w, h) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return [c, g];
  }
  let seed = 1;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // fonte 5 x 7 das placas
  const GL = {
    A: ["01110","10001","10001","11111","10001","10001","10001"], B: ["11110","10001","10001","11110","10001","10001","11110"],
    C: ["01110","10001","10000","10000","10000","10001","01110"], D: ["11110","10001","10001","10001","10001","10001","11110"],
    E: ["11111","10000","10000","11110","10000","10000","11111"], F: ["11111","10000","10000","11110","10000","10000","10000"],
    G: ["01110","10001","10000","10111","10001","10001","01110"], H: ["10001","10001","10001","11111","10001","10001","10001"],
    I: ["111","010","010","010","010","010","111"], K: ["10001","10010","10100","11000","10100","10010","10001"],
    L: ["10000","10000","10000","10000","10000","10000","11111"], M: ["10001","11011","10101","10101","10001","10001","10001"],
    N: ["10001","11001","10101","10011","10001","10001","10001"], O: ["01110","10001","10001","10001","10001","10001","01110"],
    P: ["11110","10001","10001","11110","10000","10000","10000"], Q: ["01110","10001","10001","10001","10101","10010","01101"],
    R: ["11110","10001","10001","11110","10100","10010","10001"], S: ["01111","10000","10000","01110","00001","00001","11110"],
    T: ["11111","00100","00100","00100","00100","00100","00100"], U: ["10001","10001","10001","10001","10001","10001","01110"],
    V: ["10001","10001","10001","10001","01010","01010","00100"], W: ["10001","10001","10001","10101","10101","11011","10001"],
    "#": ["01010","11111","01010","01010","11111","01010","00000"], ".": ["0","0","0","0","0","0","1"],
    " ": ["00","00","00","00","00","00","00"],
  };
  GL["É"] = GL.E; GL["Ã"] = GL.A;
  const textWidth = (t) => [...t].reduce((w, ch) => w + GL[ch][0].length + 1, -1);
  function pixelText(g, text, x, y, color, center = true, upto = Infinity) {
    let cx = center ? Math.round(x - textWidth(text) / 2) : x;
    g.fillStyle = color;
    let i = 0;
    for (const ch of text) {
      if (i++ >= upto) break;
      const gl = GL[ch];
      gl.forEach((row, ry) => [...row].forEach((b, rx) => { if (b === "1") g.fillRect(cx + rx, y + ry, 1, 1); }));
      if (ch === "É") { g.fillRect(cx + 3, y - 3, 1, 1); g.fillRect(cx + 2, y - 2, 1, 1); }
      if (ch === "Ã") { g.fillRect(cx + 1, y - 2, 1, 1); g.fillRect(cx + 2, y - 3, 1, 1); g.fillRect(cx + 3, y - 2, 1, 1); g.fillRect(cx + 4, y - 3, 1, 1); }
      cx += gl[0].length + 1;
    }
    return cx;
  }

  // fonte pequena (3x5) para cartazes, etiquetas e avisos que dá para ler
  const TG = {
    A: ["010","101","111","101","101"], B: ["110","101","110","101","110"], C: ["011","100","100","100","011"],
    D: ["110","101","101","101","110"], E: ["111","100","110","100","111"], F: ["111","100","110","100","100"],
    G: ["011","100","101","101","011"], H: ["101","101","111","101","101"], I: ["111","010","010","010","111"],
    J: ["001","001","001","101","010"], K: ["101","101","110","101","101"], L: ["100","100","100","100","111"],
    M: ["10001","11011","10101","10001","10001"], N: ["1001","1101","1011","1001","1001"], O: ["010","101","101","101","010"],
    P: ["110","101","110","100","100"], Q: ["010","101","101","110","011"], R: ["110","101","110","101","101"],
    S: ["011","100","010","001","110"], T: ["111","010","010","010","010"], U: ["101","101","101","101","111"],
    V: ["101","101","101","101","010"], W: ["10001","10001","10101","11011","10001"], X: ["101","101","010","101","101"],
    Y: ["101","101","010","010","010"], Z: ["111","001","010","100","111"],
    "0": ["111","101","101","101","111"], "1": ["010","110","010","010","111"], "2": ["110","001","010","100","111"],
    "3": ["110","001","010","001","110"], "4": ["101","101","111","001","001"], "5": ["111","100","110","001","110"],
    "6": ["011","100","110","101","010"], "7": ["111","001","010","010","010"], "8": ["010","101","010","101","010"],
    "9": ["010","101","011","001","110"], "$": ["011","110","010","011","110"], ".": ["0","0","0","0","1"],
    ",": ["0","0","0","1","1"], "!": ["1","1","1","0","1"], "-": ["000","000","111","000","000"], ":": ["0","1","0","1","0"],
    "#": ["01010","11111","01010","11111","01010"], "/": ["001","001","010","100","100"], "?": ["110","001","010","000","010"],
    " ": ["00","00","00","00","00"],
  };
  const TMARK = { "Ã": ["A", "tilde"], "Á": ["A", "acute"], "É": ["E", "acute"], "Ê": ["E", "circ"], "Ó": ["O", "acute"], "Í": ["I", "acute"], "Ç": ["C", "ced"], "Ú": ["U", "acute"] };
  const tinyWidth = (text) => [...text].reduce((w, ch) => w + (TG[TMARK[ch] ? TMARK[ch][0] : ch] || TG[" "])[0].length + 1, -1);
  function tinyText(g, text, x, y, color, center = false) {
    let cx = Math.round(center ? x - tinyWidth(text) / 2 : x);
    g.fillStyle = color;
    for (const ch of text) {
      const base = TMARK[ch] ? TMARK[ch][0] : ch;
      const gl = TG[base] || TG[" "];
      gl.forEach((row, ry) => [...row].forEach((b, rx) => { if (b === "1") g.fillRect(cx + rx, y + ry, 1, 1); }));
      const mk = TMARK[ch] && TMARK[ch][1];
      if (mk === "tilde") { g.fillRect(cx, y - 2, 2, 1); g.fillRect(cx + 2, y - 3, 1, 1); }
      if (mk === "acute") g.fillRect(cx + 2, y - 2, 1, 1);
      if (mk === "circ") { g.fillRect(cx + 1, y - 2, 1, 1); }
      if (mk === "ced") g.fillRect(cx + 1, y + 5, 1, 1);
      cx += gl[0].length + 1;
    }
  }
  function charX(text, x, n) { let cx = x; let i = 0; for (const ch of text) { if (i++ >= n) break; cx += GL[ch][0].length + 1; } return cx; }

  // pessoa de frente: cabeça (topo em y) e tronco; os braços cada cena desenha
  function head(g, cx, y, P, t) {
    const blink = !reduceMotion && ((t + (P.blinkOff || 0)) % 4.1) < 0.13;
    O(g, cx - 5, y, 10, 10, P.skin); R(g, cx - 5, y, 2, 10, P.skinD);
    R(g, cx - 6, y + 4, 1, 3, P.skinD); R(g, cx + 5, y + 4, 1, 3, P.skinD);
    if (P.hair) { R(g, cx - 5, y, 10, P.hairH || 3, P.hair); if (P.side) { R(g, cx - 6, y + 2, 2, 4, P.hair); R(g, cx + 4, y + 2, 2, 4, P.hair); } }
    if (P.curls) { R(g, cx - 6, y + 1, 2, 5, P.hair); R(g, cx + 4, y + 1, 2, 5, P.hair); }
    const ey = y + 4 + (P.look || 0);
    if (blink) { R(g, cx - 3, ey + 1, 2, 1, P.skinD); R(g, cx + 1, ey + 1, 2, 1, P.skinD); }
    else { R(g, cx - 3, ey, 1, 2, K); R(g, cx + 2, ey, 1, 2, K); }
    if (P.brow) { R(g, cx - 4, y + 3, 3, 1, P.brow); R(g, cx + 1, y + 3, 3, 1, P.brow); }
    if (P.glasses) { g.fillStyle = "#c8c0a8"; g.fillRect(cx - 4, ey - 1, 3, 1); g.fillRect(cx + 1, ey - 1, 3, 1); g.fillRect(cx - 4, ey + 2, 3, 1); g.fillRect(cx + 1, ey + 2, 3, 1); g.fillRect(cx - 1, ey, 2, 1); }
    if (P.beard) R(g, cx - 5, y + 6, 10, 4, P.beard);
    if (P.stache) { R(g, cx - 4, y + 7, 8, 1, P.stache); R(g, cx - 4, y + 8, 1, 1, P.stache); R(g, cx + 3, y + 8, 1, 1, P.stache); }
    if (P.goatee) R(g, cx - 1, y + 8, 2, 2, P.goatee);
    if (P.hat) {
      O(g, cx - 4, y - 5, 8, 5, P.hat); R(g, cx - 4, y - 1, 8, 1, P.band || shade(P.hat, 0.6)); R(g, cx - 4, y - 5, 2, 3, shade(P.hat, 1.25));
      O(g, cx - 8, y, 16, 1, P.hat);
    }
    if (P.visor) { R(g, cx - 7, y - 1, 14, 1, K); R(g, cx - 7, y, 14, 2, "#4a9a5a"); R(g, cx - 7, y + 2, 14, 1, "rgba(80,170,90,0.45)"); }
    if (P.bowler) { O(g, cx - 4, y - 4, 8, 4, P.bowler); O(g, cx - 6, y, 12, 1, P.bowler); }
  }
  function torso(g, cx, y, P, h = 18) {
    // ombros: os braços saem daqui, fora do tronco
    O(g, cx - 10, y + 1, 4, 5, P.sleeve || P.shirt); O(g, cx + 6, y + 1, 4, 5, P.sleeve || P.shirt);
    O(g, cx - 7, y, 14, h, P.shirt);
    if (P.vest) { R(g, cx - 7, y, 4, h, P.vest); R(g, cx + 3, y, 4, h, P.vest); R(g, cx - 3, y + 2, 1, 1, "#c0b090"); }
    if (P.apron) { R(g, cx - 6, y + 5, 12, h - 5, P.apron); R(g, cx - 6, y + 5, 12, 1, shade(P.apron, 0.7)); R(g, cx - 5, y, 1, 5, P.apron); R(g, cx + 4, y, 1, 5, P.apron); }
    if (P.tie) { R(g, cx - 2, y, 4, 2, P.tie); R(g, cx - 1, y + 2, 2, 1, P.tie); }
    if (P.scarf) { R(g, cx - 4, y, 8, 3, P.scarf); R(g, cx + 1, y + 3, 2, 2, P.scarf); }
    if (P.badge) { g.fillStyle = "#f2c230"; [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [3, 3]].forEach(([dx, dy]) => g.fillRect(cx - 6 + dx, y + 4 + dy, 1, 1)); }
    if (P.garter) { R(g, cx - 9, y + 4, 2, 2, P.garter); R(g, cx + 7, y + 4, 2, 2, P.garter); }
  }
  function sparkle(g, x, y, s, c = "#fff8e0") { R(g, x, y - s, 1, s * 2 + 1, c); R(g, x - s, y, s * 2 + 1, 1, c); }
  // braço com cotovelo calculado (dois segmentos de tamanho fixo até a mão)
  function ik(sx, sy, hx, hy, L1, L2, bend) {
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
  function armIK(sx, sy, hx, hy, L1, L2, side) {
    const a = ik(sx, sy, hx, hy, L1, L2, 1), b = ik(sx, sy, hx, hy, L1, L2, -1);
    const score = (pts) => side * (pts[1][0] - sx) + 2 * (pts[1][1] - sy);
    return score(a) >= score(b) ? a : b;
  }
  // mesma ideia, mas lembrando o cotovelo do quadro anterior: o braço nunca "vira" de lado no meio do movimento
  function armIKkeep(mem, sx, sy, hx, hy, L1, L2, side) {
    const a = ik(sx, sy, hx, hy, L1, L2, 1), b = ik(sx, sy, hx, hy, L1, L2, -1);
    let pick;
    if (!mem.e) pick = armIK(sx, sy, hx, hy, L1, L2, side);
    else {
      const da = Math.hypot(a[1][0] - mem.e[0], a[1][1] - mem.e[1]), db = Math.hypot(b[1][0] - mem.e[0], b[1][1] - mem.e[1]);
      pick = da <= db ? a : b;
    }
    mem.e = pick[1];
    return pick;
  }
  function mixColor(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(((pa >> sh) & 255) + ((((pb >> sh) & 255) - ((pa >> sh) & 255)) * clamp(k)));
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  }
  function planksV(g, x, y, w, h, base, seam, step) {
    R(g, x, y, w, h, base);
    g.fillStyle = seam;
    for (let px = x + step - 1; px < x + w; px += step) g.fillRect(px, y, 1, h);
    seed = 17;
    for (let i = 0; i < w * h / 500; i++) { g.fillStyle = shade(base, 0.85 + rnd() * 0.3); g.fillRect(Math.floor(x + rnd() * w), Math.floor(y + rnd() * h), 1, 2 + Math.floor(rnd() * 3)); }
  }
  function floorBoards(g, y, base, seam) {
    R(g, 0, y, SW, SH - y, base);
    g.fillStyle = seam;
    for (let yy = y + 5, r = 0; yy < SH; yy += 6, r++) { g.fillRect(0, yy, SW, 1); for (let x = (r % 2) * 23; x < SW; x += 46) g.fillRect(x, yy - 5, 1, 5); }
    R(g, 0, y, SW, 1, shade(base, 0.6));
  }
  function windowSky(g, x, y, w, h, colors) {
    O(g, x - 3, y - 3, w + 6, h + 6, "#4a3020");
    colors.forEach((c, i) => R(g, x, y + Math.floor(i * h / colors.length), w, Math.ceil(h / colors.length), c));
  }
  function sign(g, cx, y, text) {
    const w = textWidth(text) + 10;
    O(g, cx - w / 2, y, w, 12, "#ecd6a6");
    R(g, cx - w / 2, y + 11, w, 1, "#c8a870");
    pixelText(g, text, cx, y + 3, "#2b1a10");
  }


  // revólver detalhado, apontando para a direita (x, y = canto de cima do corpo da arma)
  function revolver(g, x, y, c = "#6a6662", wood = "#7a4a2a") {
    O(g, x - 1, y + 3, 3, 6, wood); R(g, x, y + 4, 1, 4, shade(wood, 1.3)); R(g, x - 2, y + 7, 1, 2, wood);
    R(g, x + 1, y + 6, 1, 1, "#c0902a");
    O(g, x + 2, y, 6, 4, c);
    O(g, x + 4, y - 1, 5, 5, shade(c, 1.15)); R(g, x + 5, y, 1, 3, shade(c, 0.7)); R(g, x + 7, y, 1, 3, shade(c, 0.7));
    O(g, x + 9, y, 11, 2, c); R(g, x + 9, y, 11, 1, "#c8c4bc"); R(g, x + 19, y - 1, 1, 1, K);
    R(g, x + 9, y + 2, 7, 1, shade(c, 0.6));
    R(g, x + 1, y - 2, 2, 2, K);
    R(g, x + 4, y + 4, 1, 2, K); R(g, x + 5, y + 6, 3, 1, K); R(g, x + 8, y + 4, 1, 2, K); R(g, x + 6, y + 4, 1, 2, "#3a3634");
  }
  // rifle em pé na estante (x = cano, top = ponta)
  function rifle(g, x, top, kind) {
    const steel = "#4a4644", brass = "#c0902a", wood = kind === 2 ? "#5a3820" : "#7a4a2a";
    if (kind === 1) { O(g, x - 1, top, 2, 26, steel); O(g, x + 1, top, 2, 26, steel); R(g, x - 1, top, 1, 26, "#8a8682"); }
    else { O(g, x, top, 2, 26, steel); R(g, x, top, 1, 26, "#8a8682"); O(g, x + 2, top + 4, 1, 18, "#3a3634"); }
    O(g, x - 2, top + 12, 6, 9, wood); R(g, x - 2, top + 12, 1, 9, shade(wood, 1.3));
    for (let i = 0; i < 3; i++) R(g, x - 1, top + 14 + i * 2, 4, 1, shade(wood, 0.75));
    O(g, x - 1, top + 26, 5, 6, kind === 0 ? brass : steel); R(g, x, top + 27, 1, 4, kind === 0 ? "#e8c060" : "#8a8682");
    if (kind !== 1) { R(g, x + 4, top + 30, 1, 5, K); R(g, x + 1, top + 34, 4, 1, K); }
    O(g, x - 2, top + 32, 6, 4, wood); O(g, x - 3, top + 36, 7, 7, wood); O(g, x - 3, top + 43, 7, 2, "#3a3634");
    R(g, x - 2, top + 33, 1, 10, shade(wood, 1.3));
    if (kind === 2) { O(g, x - 1, top + 6, 4, 4, "#2a2624"); R(g, x, top + 6, 1, 1, "#8ab0c0"); }
  }
  // estado do duelo, lido pela cena do fim da rua a cada quadro
  const SALOON = { playing: false, invite: null };
  const PIANO = { state: "idle", candle: "lustre", start: 0, pourT: 0, cx: 0, cy: 0, origin: [0, 0], retFrom: [0, 0], retAt: 0, word: null, slot: { x: 170, y: 11 }, bc: null, TL: null, onDone: null };
  // o xerife fala por aqui; o guia preenche quando monta
  const GUIDE = { say() {} };
  const DUEL = { on: false, phase: "idle", shotBy: null, shotAt: 0, bellAt: 0, twitchAt: -9999, hat: { you: true, joao: true }, flying: [], anim: { weapon: "revolver", mode: "idle", at: 0, shots: [], charge: 0 } };

  // ================= As cenas =================
  // cada cena: focus (x do centro de interesse), back (estático atrás), front (estático na frente), draw (animado)
  const SCENES = {};

  // ---------- I · Armeiro ----------
  SCENES.armeiro = (() => {
    const FY = 112;
    const armeiro = { skin: "#d8a47a", skinD: "#b07a58", hair: "#b8b0a8", hairH: 0, side: true, stache: "#d8d0c8", brow: "#d8d0c8", glasses: true, shirt: "#ece4d4", apron: "#7a4a2a", blinkOff: 1.3 };
    const motes = Array.from({ length: 22 }, (_, i) => ({ x: 30 + (i * 37) % 120, y: 40 + (i * 23) % 70, s: 0.2 + (i % 5) * 0.06, ph: i }));
    function back(g) {
      planksV(g, 0, 0, SW, FY, "#7a5236", "#5e3e28", 10);
      R(g, 0, 0, SW, 6, "#4a3020"); R(g, 0, FY - 4, SW, 4, "#4a3020");
      floorBoards(g, FY, "#8a6040", "#6e4a30");
      windowSky(g, 18, 24, 48, 40, ["#f6c47a", "#f2a65a", "#e8884a", "#d87040"]);
      R(g, 18, 52, 48, 12, "#b0704a"); R(g, 18, 56, 48, 8, "#9a5a3a");
      R(g, 41, 24, 2, 40, "#4a3020"); R(g, 18, 43, 48, 2, "#4a3020");
      // estante de rifles: winchesters de latão, espingarda de dois canos, rifle com luneta
      O(g, 210, 22, 96, 4, "#4a3020"); O(g, 210, 70, 96, 5, "#4a3020");
      for (let i = 0; i < 5; i++) { const x = 220 + i * 18; R(g, x - 3, 22, 1, 4, K); R(g, x + 4, 22, 1, 4, K); rifle(g, x, 26, [0, 1, 2, 0, 1][i]); }
      [["$25", 220], ["$40", 238], ["$60", 256]].forEach(([p, x]) => { seg(g, x + 1, 26, x + 6, 30, 1, "#c8a870"); O(g, x + 3, 30, 13, 7, "#f3e3c3"); tinyText(g, p, x + 4, 31, "#8a2a20"); });
      // prateleiras com munição etiquetada
      O(g, 82, 42, 64, 3, "#4a3020"); O(g, 82, 66, 64, 3, "#4a3020");
      [["C#", "#a83a2a", 84, 14], [".NET", "#3a5a9a", 100, 18], ["SQL", "#5a7a3a", 120, 15]].forEach(([lbl, c, x, w]) => {
        O(g, x, 31, w, 10, c); R(g, x, 31, w, 2, shade(c, 1.3)); R(g, x + 1, 34, w - 2, 7, "#f3e3c3");
        tinyText(g, lbl, x + w / 2, 35, shade(c, 0.6), true);
      });
      O(g, 137, 29, 5, 12, "#5a8a4a"); R(g, 138, 31, 3, 3, "#f3e3c3");
      for (let i = 0; i < 6; i++) { O(g, 86 + i * 4, 58, 2, 7, "#c0902a"); R(g, 86 + i * 4, 58, 2, 2, "#8a6a3a"); }
      O(g, 112, 56, 13, 9, "#6a6662"); tinyText(g, "API", 114, 58, "#f3e3c3");
      O(g, 128, 58, 14, 7, "#7a4a2a"); R(g, 128, 61, 14, 1, "#5a3820");
      sign(g, 168, 9, "SKILLS");
      // revólveres na parede, com as etiquetas de preço
      [[148, 32, "$12"], [172, 30, "$18"]].forEach(([x, y, p]) => {
        R(g, x + 4, y - 4, 1, 3, K); R(g, x + 14, y - 4, 1, 3, K);
        revolver(g, x, y);
        seg(g, x + 15, y + 2, x + 17, y + 8, 1, "#c8a870"); O(g, x + 13, y + 8, 12, 7, "#f3e3c3"); tinyText(g, p, x + 14, y + 9, "#8a2a20");
      });
      // aviso na parede
      O(g, 16, 70, 44, 16, "#f0dcb0"); R(g, 37, 68, 2, 2, "#8a8682");
      tinyText(g, "CONSERTOS", 38, 72, "#5a3820", true); tinyText(g, "E AJUSTES", 38, 79, "#8a2a20", true);
    }
    function front(g) {
      // balcão com vitrine de vidro: revólveres sobre veludo
      O(g, 96, 88, 140, 24, "#5e3e28");
      for (let x = 102; x < 230; x += 32) {
        R(g, x, 92, 26, 16, "#5a2626"); R(g, x, 92, 26, 1, "#3a1414");
        revolver(g, x + 4, 99, x % 64 === 38 ? "#8a8682" : "#6a6662", x % 64 === 38 ? "#c8b898" : "#7a4a2a");
        g.fillStyle = "rgba(210,235,245,0.22)"; g.fillRect(x, 92, 26, 16);
        R(g, x + 3, 93, 1, 6, "rgba(255,255,255,0.5)"); R(g, x + 5, 93, 1, 3, "rgba(255,255,255,0.35)");
        R(g, x - 1, 92, 1, 16, "#4a3020");
      }
      O(g, 92, 84, 148, 4, "#8a5a34"); R(g, 92, 84, 148, 1, "#b07a48");
      // caixotes e barril
      O(g, 16, 94, 24, 18, "#9a6a40"); seg(g, 17, 95, 38, 110, 1, "#6e4a30"); seg(g, 38, 95, 17, 110, 1, "#6e4a30");
      O(g, 46, 90, 14, 22, "#7a4a2a"); R(g, 46, 95, 14, 1, "#3a3634"); R(g, 46, 106, 14, 1, "#3a3634");
      O(g, 270, 100, 20, 12, "#9a6a40"); R(g, 270, 105, 20, 1, "#6e4a30");
    }
    function draw(g, t) {
      // luz da janela e poeira no ar
      g.fillStyle = "rgba(255,214,150,0.12)";
      for (let y = 64; y < 150; y++) { const k = (y - 64) / 86; g.fillRect(Math.round(18 + k * 40), y, Math.round(48 + k * 50), 1); }
      for (const m of motes) {
        const x = m.x + Math.sin(t * m.s + m.ph) * 6 + ((t * 2 * m.s) % 20);
        const y = m.y + Math.cos(t * m.s * 1.3 + m.ph) * 5;
        R(g, x, y, 1, 1, "rgba(255,240,200,0.75)");
      }
      // armeiro
      const cx = 160;
      const breathe = Math.sin(t * 1.6) > 0.6 ? 1 : 0;
      torso(g, cx, 61 + breathe, armeiro, 26);
      head(g, cx, 50 + breathe, { ...armeiro, look: Math.sin(t * 0.37) > 0.92 ? -1 : 1 }, t);
      // revólver e pano: lustra devagar e, de tempos em tempos, ergue a arma para conferir o brilho
      const c = t % 26;
      const insp = c < 17 ? 0 : c < 18 ? (c - 17) : c < 22 ? 1 : c < 23 ? 1 - (c - 22) : 0;
      const e = insp * insp * (3 - 2 * insp);
      const gx = Math.round(lerp(146, 148, e)), gy = Math.round(lerp(79, 71, e));
      revolver(g, gx + 1, gy - 2, "#7a766e", "#6e4426");
      limb(g, armIK(cx - 9, 65 + breathe, gx + 2, gy + 2, 11, 11, -1), 3, armeiro.shirt, armeiro.skin);
      const k = 0.5 + 0.5 * Math.sin(t * 2.4);
      const hx = lerp(158 + k * 12, gx + 16, e), hy = lerp(gy - 1, gy + 1, e);
      limb(g, armIK(cx + 8, 65 + breathe, hx, hy, 11, 11, 1), 3, armeiro.shirt, armeiro.skin);
      if (e < 0.5) { O(g, hx - 3, hy - 1, 6, 3, "#e8e0d0"); R(g, hx - 3, hy + 1, 6, 1, "#c8c0b0"); }
      if ((t % 5.3) < 0.3 || (c > 19.5 && c < 20.2)) sparkle(g, gx + 22, gy - 3, 2);
      // lampião balançando
      const lx = 112 + Math.round(Math.sin(t * 1.1) * 1.5);
      seg(g, 112, 0, lx, 22, 1, "#3a3634");
      disc(g, lx, 28, 18, "rgba(255,200,120,0.07)"); disc(g, lx, 28, 10, "rgba(255,200,120,0.08)");
      O(g, lx - 3, 22, 6, 2, "#5a4a3a"); O(g, lx - 3, 25, 6, 7, "#d8c8a0"); R(g, lx - 2, 26, 4, 5, "rgba(255,240,200,0.6)");
      R(g, lx - 1, 27 + (Math.sin(t * 17) > 0 ? 0 : 1), 2, 3, Math.sin(t * 11) > 0 ? "#ffd84a" : "#ffb030");
      O(g, lx - 4, 32, 8, 2, "#5a4a3a");
    }
    function after(g, t) {
      // gato dormindo no balcão
      const cx = 212;
      O(g, cx - 8, 78, 16, 6, "#8a8a90"); R(g, cx - 6, 78, 2, 6, "#6a6a70"); R(g, cx - 1, 78, 2, 6, "#6a6a70");
      O(g, cx + 7, 76, 7, 7, "#8a8a90"); R(g, cx + 7, 75, 2, 1, "#8a8a90"); R(g, cx + 12, 75, 2, 1, "#8a8a90");
      R(g, cx + 9, 79, 2, 1, K); R(g, cx + 12, 79, 1, 1, K);
      const flick = Math.sin(t * 1.3) > 0.6 ? Math.round(Math.sin(t * 6) * 1.5) : 0;
      limb(g, [[cx - 7, 83], [cx - 9, 90], [cx - 9 + flick, 96]], 2, "#8a8a90");
      const zt = (t % 3) / 3;
      if (!reduceMotion) { g.globalAlpha = 1 - zt; pixelZ(g, cx + 16 + zt * 6, 72 - zt * 14); g.globalAlpha = 1; }
    }
    function pixelZ(g, x, y) { R(g, x, y, 3, 1, "#f3e3c3"); R(g, x + 1, y + 1, 1, 1, "#f3e3c3"); R(g, x, y + 2, 3, 1, "#f3e3c3"); }
    return { focus: 165, back, front, draw, after };
  })();

  // ---------- II · Ferreiro ----------
  SCENES.ferraria = (() => {
    const FY = 116, FX = 264; // FX: centro da fornalha
    const smith = { skin: "#c08a64", skinD: "#9a6a4a", hair: null, beard: "#3a2418", brow: "#3a2418", shirt: "#8a5a40", apron: "#4a2e1e", blinkOff: 0.7 };
    let sparks = [], lastPhase = 0, heat = 0.6, steam = [];
    const hamMem = {}, tongMem = {};
    function back(g) {
      R(g, 0, 0, SW, FY, "#4e3e36");
      seed = 5;
      for (let y = 0, r = 0; y < FY; y += 7, r++) for (let x = -(r % 2) * 8; x < SW; x += 16) {
        R(g, x, y, 15, 6, ["#564640", "#4a3a32", "#5a4a40", "#52423a"][Math.floor(rnd() * 4)]);
      }
      R(g, 0, FY - 4, SW, 4, "#3a2e28");
      R(g, 0, FY, SW, SH - FY, "#5a4636");
      for (let i = 0; i < 120; i++) R(g, Math.floor(rnd() * SW), FY + 2 + Math.floor(rnd() * 32), 1, 1, rnd() < 0.5 ? "#4a3828" : "#6a5444");
      // janela alta
      windowSky(g, 112, 14, 30, 18, ["#e8884a", "#c8603a", "#8a4a3a"]); R(g, 126, 14, 2, 18, "#4a3020");
      // ferramentas na parede
      O(g, 24, 30, 70, 3, "#6e4426");
      [[30, "tongs"], [44, "hammer"], [58, "tongs"], [72, "hammer"], [84, "file"]].forEach(([x, k]) => {
        if (k === "tongs") { seg(g, x, 33, x - 2, 56, 1, "#2a2624"); seg(g, x + 2, 33, x + 4, 56, 1, "#2a2624"); }
        if (k === "hammer") { seg(g, x, 33, x, 52, 2, "#7a4a2a"); O(g, x - 4, 50, 9, 5, "#3a3634"); }
        if (k === "file") { O(g, x, 33, 2, 20, "#5a5652"); }
      });
      [[34, 66], [48, 66], [62, 66]].forEach(([x, y]) => { R(g, x, y, 2, 7, "#5a5652"); R(g, x + 6, y, 2, 7, "#5a5652"); R(g, x, y + 7, 8, 2, "#5a5652"); });
      // lista de pedidos pregada na parede
      O(g, 150, 18, 44, 40, "#e8d4a8"); R(g, 150, 18, 44, 1, "#f6e6c0"); R(g, 171, 17, 2, 2, "#8a8682");
      tinyText(g, "PEDIDOS", 172, 22, "#2b1a10", true); R(g, 155, 28, 34, 1, "#8a6a4a");
      tinyText(g, "1 UKRA", 155, 31, "#3a2418"); tinyText(g, "2 SHOGUN", 155, 38, "#3a2418"); tinyText(g, "3 JOSE", 155, 45, "#8a2a20");
      R(g, 155, 34, 22, 1, "#5a3820"); R(g, 155, 41, 32, 1, "#5a3820");
      R(g, 183, 46, 6, 6, "#c0392b"); tinyText(g, "!", 185, 46, "#f3e3c3");
      // ferradura da sorte
      R(g, 128, 40, 2, 7, "#8a8682"); R(g, 134, 40, 2, 7, "#8a8682"); R(g, 128, 47, 8, 2, "#8a8682");
      // coifa reta e simétrica, centrada na fornalha
      for (let i = 0; i < 60; i++) {
        const w = Math.round(36 + i * 0.9);
        R(g, FX - Math.floor(w / 2) - 1, i, w + 2, 1, K);
        R(g, FX - Math.floor(w / 2), i, w, 1, i % 8 === 7 ? "#2e2420" : "#3e302a");
      }
      O(g, FX - 46, 60, 92, 4, "#2e2420");
      // fornalha de tijolo, com a boca centrada
      O(g, FX - 40, 66, 80, 50, "#5a4a42");
      g.save(); g.beginPath(); g.rect(FX - 40, 66, 80, 50); g.clip();
      for (let y = 66, r = 0; y < 116; y += 6, r++) for (let x = FX - 40 - (r % 2) * 5; x < FX + 40; x += 10) R(g, x, y, 9, 5, "#6a5850");
      g.restore();
      O(g, FX - 44, 64, 88, 3, "#3a302a");
      O(g, FX - 22, 76, 44, 22, K);
      R(g, FX - 21, 94, 42, 4, "#3a1a10");
      // fole apoiado num cavalete, com o cano entrando na fornalha
      O(g, 194, 98, 2, 18, "#5a3820"); O(g, 214, 98, 2, 18, "#5a3820"); O(g, 192, 96, 26, 3, "#6e4426");
      R(g, 196, 108, 18, 1, "#5a3820");
      O(g, 216, 89, FX - 40 - 216, 3, "#3a3634");
      // balde de água
      O(g, 38, 98, 18, 18, "#6e4426"); R(g, 38, 103, 18, 1, "#3a3634"); R(g, 38, 110, 18, 1, "#3a3634"); R(g, 39, 98, 16, 2, "#3a5a6a");
    }
    function draw(g, t, dt) {
      const pump = 0.5 + 0.5 * Math.sin(t * 3.9);
      // brilho e fogo dentro da boca da fornalha
      const glow = 0.18 + pump * 0.08 + Math.sin(t * 13) * 0.03;
      disc(g, FX, 86, 42, `rgba(255,140,50,${glow * 0.45})`);
      disc(g, FX, 86, 26, `rgba(255,160,60,${glow * 0.55})`);
      for (let x = FX - 20; x < FX + 21; x++) {
        const h = 6 + 3 * Math.sin(t * 9 + x * 0.7) + 2 * Math.sin(t * 14 + x * 1.9) + pump * 4;
        for (let y = 0; y < h; y++) {
          const k = y / h;
          R(g, x, 93 - y, 1, 1, k < 0.3 ? "#ffe066" : k < 0.6 ? "#f2a65a" : k < 0.85 ? "#e0602a" : "#8a2a1a");
        }
      }
      for (let x = FX - 20; x < FX + 21; x += 3) R(g, x, 94, 2, 2, Math.sin(t * 5 + x) > 0 ? "#ff8030" : "#c04020");
      // fole: a tampa sobe e desce, a base fica no cavalete
      const bh = 3 + Math.round(pump * 6);
      O(g, 192, 93, 22, 2, "#8a5a34");
      O(g, 194, 93 - bh, 18, bh, "#6e4426");
      for (let y = 93 - bh + 2; y < 93; y += 3) R(g, 194, y, 18, 1, "#4a2e1e");
      O(g, 192, 91 - bh, 22, 2, "#8a5a34"); O(g, 186, 91 - bh, 6, 1, "#8a5a34");
      O(g, 214, 89, 3, 3, "#3a3634");
      // ferreiro atrás da bigorna, de frente: tenazes na mão esquerda, martelo na direita
      const cx = 158;
      // série de quatro golpes, depois ergue a peça com as tenazes para conferir e volta a bater
      const STRIKE = 1.5, SERIES = 4 * STRIKE + 4;
      const ls = t % SERIES;
      const hitting = ls < 4 * STRIKE;
      const ph = hitting ? (ls % STRIKE) / STRIKE : 0;
      const struck = hitting && lastPhase < 0.62 && ph >= 0.62;
      lastPhase = hitting ? ph : 0;
      let up = 0;
      if (hitting) { if (ph < 0.55) up = ph / 0.55; else if (ph < 0.62) up = 1 - (ph - 0.55) / 0.07; }
      up = up * up * (3 - 2 * up);
      const ins = hitting ? 0 : Math.sin(clamp((ls - 4 * STRIKE) / 4) * Math.PI);
      O(g, cx - 7, 90, 6, 26, "#3a3230"); O(g, cx + 1, 90, 6, 26, "#3a3230");
      torso(g, cx, 66, smith, 25); R(g, cx - 7, 66, 14, 2, smith.skin);
      head(g, cx - (ins > 0.4 ? 1 : 0), 55, { ...smith, look: ins > 0.4 ? -1 : 1 }, t);
      // bigorna na frente dele
      O(g, cx - 6, 104, 12, 12, "#3a3634"); O(g, cx - 12, 100, 24, 4, "#3a3634");
      O(g, cx - 16, 93, 32, 7, "#4a4644"); R(g, cx - 16, 93, 32, 1, "#8a8682");
      O(g, cx - 23, 94, 7, 3, "#4a4644"); O(g, cx - 27, 95, 4, 1, "#4a4644");
      heat = Math.max(0.35, heat - dt * 0.35);
      const hot = heat > 0.8 ? "#fff0b0" : heat > 0.55 ? "#ffb040" : "#e0602a";
      // braço esquerdo com as tenazes: segura a peça na bigorna ou a ergue na frente do rosto
      // ao conferir, ergue a peça ao lado do corpo, na altura dos olhos, sem tapar o rosto
      const thx = lerp(cx - 13, cx - 18, ins), thy = lerp(88, 72, ins);
      limb(g, armIKkeep(tongMem, cx - 9, 69, thx, thy, 11, 11, -1), 3, smith.shirt, smith.skin);
      const tipX = lerp(cx - 3, cx - 24, ins), tipY = lerp(91, 58, ins);
      seg(g, thx, thy, tipX, tipY, 1, "#2a2624"); seg(g, thx + 1, thy, tipX + 1, tipY + 1, 1, "#2a2624");
      if (ins > 0.05) { R(g, tipX - 12, tipY, 13, 2, hot); disc(g, tipX - 6, tipY + 1, 6, "rgba(255,150,60,0.16)"); }
      else R(g, cx - 3, 91, 14, 2, hot);
      // braço direito com o martelo: ombro e cotovelo giram por ângulos fixos (sem cálculo de alcance),
      // então o arco do golpe é sempre o mesmo e o braço não vira de lado
      const D = Math.PI / 180;
      let a1, a2, ang;
      if (hitting) { a1 = lerp(60, -50, up); a2 = lerp(99, -100, up); ang = lerp(180, 250, up) + 40 * Math.sin(up * Math.PI); }
      else { a1 = lerp(60, 84, ins); a2 = lerp(99, 94, ins); ang = lerp(180, 90, ins); }
      const sx0 = cx + 8, sy0 = 69;
      const ex = sx0 + Math.cos(a1 * D) * 11, ey = sy0 + Math.sin(a1 * D) * 11;
      const hx = ex + Math.cos(a2 * D) * 11, hy = ey + Math.sin(a2 * D) * 11;
      limb(g, [[sx0, sy0], [ex, ey], [hx, hy]], 4, smith.shirt, smith.skin);
      const px = hx + Math.cos(ang * D) * 8, py = hy + Math.sin(ang * D) * 8;
      seg(g, hx, hy, px, py, 2, "#7a4a2a");
      O(g, px - 3, py - 3, 7, 6, "#3a3634"); R(g, px - 3, py - 3, 7, 1, "#8a8682");
      if (struck) {
        heat = 1;
        for (let i = 0; i < 16; i++) sparks.push({ x: cx + 5, y: 90, vx: (Math.random() - 0.5) * 2.6, vy: -0.8 - Math.random() * 2.2, life: 0, max: 0.4 + Math.random() * 0.5 });
      }
      if (hitting && ph > 0.62 && ph < 0.66) sparkle(g, cx + 5, 89, 3, "#fff8e0");
      sparks = sparks.filter((s) => (s.life += dt) < s.max);
      for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.16; R(g, s.x, s.y, 1, 1, s.life < s.max * 0.5 ? "#ffe066" : "#f2a65a"); }
      if (!reduceMotion && Math.random() < 0.02) steam.push({ x: 44 + Math.random() * 8, y: 96, life: 0 });
      steam = steam.filter((s) => (s.life += dt * 0.5) < 1);
      for (const s of steam) disc(g, s.x + Math.sin(s.life * 6) * 2, s.y - s.life * 26, 1.5 + s.life * 3, `rgba(230,225,215,${0.4 * (1 - s.life)})`);
    }
    return { focus: 205, back, draw };
  })();

  // ---------- III · Delegacia ----------
  // Um dia inteiro (uns 9 minutos): o xerife carimba folha por folha e joga cada uma numa pilha,
  // os papéis tomam a sala, anoitece, ele dorme na papelada, o lampião apaga e o dia amanhece com a sala arrumada.
  SCENES.delegacia = (() => {
    const FY = 116;
    const sheriff = { skin: "#d6a07a", skinD: "#a8735a", hair: "#5a4a3a", hairH: 2, stache: "#8a7a6a", brow: "#5a4a3a", hat: "#9a6a3c", band: "#5a3820", shirt: "#e8dcc4", vest: "#6e4426", badge: true, blinkOff: 2.2 };
    // [x, base, largura, altura máxima, começa em (fração do dia), camada]
    const PILES = [
      [75, 83, 14, 30, 0.00, "mid"], [149, 83, 12, 33, 0.03, "mid"],
      [24, 116, 16, 46, 0.18, "mid"], [44, 116, 12, 36, 0.32, "mid"], [176, 116, 16, 52, 0.12, "mid"], [196, 116, 12, 40, 0.26, "mid"],
      [16, 146, 20, 58, 0.22, "fg"], [40, 138, 14, 42, 0.48, "fg"], [70, 148, 22, 34, 0.36, "fg"], [104, 142, 16, 24, 0.62, "fg"],
      [136, 147, 18, 36, 0.44, "fg"], [168, 140, 16, 50, 0.28, "fg"], [196, 148, 20, 62, 0.16, "fg"], [228, 136, 14, 44, 0.54, "fg"],
      [252, 147, 20, 60, 0.34, "fg"], [280, 140, 16, 52, 0.58, "fg"], [306, 148, 20, 66, 0.42, "fg"],
    ];
    function back(g) {
      planksV(g, 0, 0, SW, FY, "#c9a272", "#a8804e", 9);
      R(g, 0, 84, SW, 32, "#a8804e"); for (let y = 88; y < 116; y += 6) R(g, 0, y, SW, 1, "#8a6038"); R(g, 0, 84, SW, 2, "#6e4426");
      R(g, 0, 0, SW, 5, "#6e4426");
      floorBoards(g, FY, "#8a6040", "#6e4a30");
      O(g, 13, 19, 42, 40, "#4a3020");
      // cartazes de procurado (dá para ler)
      [[60, 10, "NULLREF", "$500"], [104, 13, "DEADLOCK", "$900"]].forEach(([x, y, nome, valor], i) => {
        O(g, x, y, 40, 42, "#f0dcb0");
        R(g, x, y, 40, 1, "#d8c090"); R(g, x + 39, y, 1, 42, "#c8ac78"); R(g, x, y + 41, 40, 1, "#c8ac78");
        R(g, x + 19, y - 1, 2, 2, "#6a6662");
        tinyText(g, "PROCURADO", x + 20, y + 3, "#2b1a10", true);
        R(g, x + 3, y + 9, 34, 1, "#8a6a4a");
        // retrato do bug
        R(g, x + 12, y + 11, 16, 12, "#e4cc9c");
        O(g, x + 15, y + 14, 10, 7, "#2a3a2a"); R(g, x + 16, y + 15, 3, 1, "#5a7a4a"); R(g, x + 20, y + 14, 1, 7, K);
        R(g, x + 15, y + 12, 1, 2, K); R(g, x + 24, y + 12, 1, 2, K); R(g, x + 14, y + 17, 1, 1, "#c0392b"); R(g, x + 25, y + 17, 1, 1, "#c0392b");
        tinyText(g, nome, x + 20, y + 26, "#8a2a20", true);
        tinyText(g, valor, x + 20, y + 33, "#2b1a10", true);
        if (i) { disc(g, x + 34, y + 21, 1.5, "#3a2418"); R(g, x + 33, y + 20, 1, 1, "#b08a58"); }
      });
      O(g, 168, 12, 18, 40, "#6e4426"); disc(g, 177, 20, 5, K); disc(g, 177, 20, 4, "#f3e3c3"); O(g, 171, 30, 12, 18, "#3a2418");
      R(g, 214, 6, 106, 110, "#4e443c");
      for (let y = 12, r = 0; y < 116; y += 9, r++) for (let x = 214 + (r % 2) * 9; x < SW; x += 18) R(g, x, y, 1, 8, "#443a33");
      for (let y = 12; y < 116; y += 9) R(g, 214, y, 106, 1, "#443a33");
      R(g, 214, 108, 106, 8, "#5a5048");
      O(g, 280, 98, 36, 6, "#6e4426"); R(g, 282, 96, 32, 3, "#7a3a2a");
      O(g, 226, 106, 8, 10, "#6a6662");
      O(g, 92, 56, 26, 34, "#5a3820"); R(g, 94, 58, 22, 3, "#6e4426");
    }
    function front(g) {
      O(g, 60, 88, 96, 28, "#6e4426");
      R(g, 66, 92, 40, 20, "#5a3820"); R(g, 110, 92, 40, 20, "#5a3820"); R(g, 84, 100, 4, 2, "#c0a060"); R(g, 128, 100, 4, 2, "#c0a060");
      O(g, 56, 84, 104, 4, "#8a5a34"); R(g, 56, 84, 104, 1, "#b07a48");
      O(g, 95, 95, 26, 8, "#c0902a"); R(g, 95, 95, 26, 1, "#e8c060"); tinyText(g, "XERIFE", 108, 97, "#3a2418", true);
      for (let x = 216; x < SW; x += 11) { R(g, x, 6, 2, 110, K); R(g, x, 6, 1, 110, "#6a6662"); }
      O(g, 214, 12, 106, 3, "#4a4644"); O(g, 214, 60, 106, 3, "#4a4644"); O(g, 214, 110, 106, 3, "#4a4644");
      sign(g, 266, 0, "BUGS");
    }
    // ---- o expediente: uma folha por vez ----
    // cada folha: pega, carimba, joga numa pilha. A cada 24 folhas, uma pausa para o café.
    const LT = 3, STAMP = 1.9, BLOCK = 24, BREAK = 7;
    const SEQ = [];
    PILES.forEach((P, i) => { const n = Math.floor(P[3] / LT); for (let j = 0; j < n; j++) SEQ.push([P[4] + (j / n) * (1 - P[4]) + i * 1e-4, i]); });
    SEQ.sort((a, b) => a[0] - b[0]);
    const ORDER = SEQ.map((s) => s[1]);
    const N = ORDER.length;
    const BLOCKT = BLOCK * STAMP + BREAK;
    const DAY = N * STAMP + (Math.ceil(N / BLOCK) - 1) * BREAK + 4;
    const DUSK = 26, NIGHT = 32, OUT = 3, DAWN = 10;
    const CYCLE = DAY + DUSK + NIGHT + OUT + DAWN;
    function phaseOf(t) {
      const c = t % CYCLE;
      if (c < DAY) return { name: "day", k: c / DAY, c };
      if (c < DAY + DUSK) return { name: "dusk", k: (c - DAY) / DUSK, c };
      if (c < DAY + DUSK + NIGHT) return { name: "night", k: (c - DAY - DUSK) / NIGHT, c };
      if (c < DAY + DUSK + NIGHT + OUT) return { name: "out", k: (c - DAY - DUSK - NIGHT) / OUT, c };
      return { name: "dawn", k: (c - DAY - DUSK - NIGHT - OUT) / DAWN, c };
    }
    function work(ph) {
      if (ph.name === "dawn") return { n: 0, p: -1, brk: -1 };
      if (ph.name !== "day") return { n: N, p: -1, brk: -1 };
      const c = ph.c, b = Math.floor(c / BLOCKT), r = c - b * BLOCKT;
      if (r < BLOCK * STAMP) {
        const i = b * BLOCK + Math.floor(r / STAMP);
        if (i >= N) return { n: N, p: -1, brk: -1 };
        return { n: i, p: (r % STAMP) / STAMP, brk: -1 };
      }
      return { n: Math.min(N, (b + 1) * BLOCK), p: -1, brk: (r - BLOCK * STAMP) / BREAK };
    }
    const SKY = {
      day: ["#9ac8e8", "#bcdcf0", "#e0ecf0"], dusk: ["#e8884a", "#f2a65a", "#f6c47a"],
      night: ["#141c34", "#1e2a4a", "#2a3658"], dawn: ["#e8a0a0", "#f2b890", "#f6d4a0"],
    };
    function counts(n) { const c = new Array(PILES.length).fill(0); for (let i = 0; i < n; i++) c[ORDER[i]]++; return c; }
    function pileTop(P, layers) { return P[1] - layers * LT; }
    function drawPile(g, P, i, layers) {
      if (layers <= 0) return;
      const [x, base, w] = P;
      R(g, Math.round(x - w / 2) - 2, base, w + 4, 1, "rgba(40,24,12,0.35)");
      for (let j = 0; j < layers; j++) {
        const jit = ((j * 7 + i * 3) % 5) - 2;
        const y = base - j * LT - 1;
        const lx = Math.round(x - w / 2 + jit / 2);
        R(g, lx - 1, y - 2, 1, 3, K); R(g, lx + w, y - 2, 1, 3, K);
        R(g, lx, y - 1, w, 2, j % 3 ? "#f3e3c3" : "#ece0c8");
        R(g, lx, y - 2, w, 1, "#c8b48c");
        if (j === layers - 1) { R(g, lx - 1, y - 3, w + 2, 1, K); R(g, lx, y - 2, w, 1, "#fff6e0"); R(g, lx + 2, y - 1, 4, 1, "#c0392b"); }
      }
    }
    function draw(g, t) {
      const ph = phaseOf(t), wk = work(ph);
      const dayK = ph.name === "day" ? ph.k : 1;
      let sky;
      if (ph.name === "day") sky = SKY.day.map((c, i) => dayK < 0.8 ? c : mixColor(c, SKY.dusk[i], (dayK - 0.8) / 0.2));
      else if (ph.name === "dusk") sky = SKY.dusk.map((c, i) => mixColor(c, SKY.night[i], ph.k));
      else if (ph.name === "dawn") sky = SKY.dawn.map((c, i) => mixColor(c, SKY.day[i], ph.k));
      else sky = SKY.night;
      sky.forEach((c, i) => R(g, 16, 22 + i * 12, 36, 12, c));
      if (ph.name === "night" || ph.name === "out") [[22, 26], [34, 30], [46, 24], [28, 40]].forEach(([x, y], i) => R(g, x, y, 1, 1, Math.sin(t * 2 + i) > -0.2 ? "#fff3d6" : "#5a6a8a"));
      for (let x = 20; x < 52; x += 6) R(g, x, 22, 2, 36, "#3a3634");
      const a = Math.sin(t * Math.PI * 0.5) * 0.35;
      seg(g, 177, 31, 177 + Math.sin(a) * 10, 31 + Math.cos(a) * 10, 1, "#c0902a");
      disc(g, 177 + Math.sin(a) * 11, 31 + Math.cos(a) * 11, 2, "#c0902a");
      // o bug na cela, cada vez mais curioso com a papelada; à noite ele dorme
      const asleep = ph.name === "night" || ph.name === "out";
      const bx = asleep ? 286 : 262 + Math.sin(t * 0.3) * 30, dir = asleep ? -1 : Math.cos(t * 0.3) >= 0 ? 1 : -1;
      const step = asleep ? 0 : Math.floor(t * 5) % 2;
      for (let i = 0; i < 3; i++) R(g, bx - 5 + i * 5, 113 + (step ^ (i % 2)), 1, 3, K);
      O(g, bx - 7, 104, 14, 9, "#3a6a3a"); R(g, bx - 5, 105, 4, 2, "#8ac06a"); R(g, bx, 104, 1, 9, K);
      O(g, bx + dir * 8 - 2, 105, 5, 5, "#1e2a1e"); if (!asleep) R(g, bx + dir * 9, 106, 1, 1, "#e04a3a");
      const wig = asleep ? 0 : Math.round(Math.sin(t * 4));
      seg(g, bx + dir * 9, 104, bx + dir * 13, 99 + wig, 1, K); seg(g, bx + dir * 8, 104, bx + dir * 10, 98 - wig, 1, K);
      // xícara de café e lampião sobre a mesa
      O(g, 62, 76, 6, 7, "#d8c8a0"); O(g, 61, 83, 8, 1, "#5a4a3a");
      // xerife
      const cx = 106;
      const sleeping = ph.name === "night" || ph.name === "out" || (ph.name === "dusk" && ph.k > 0.6);
      const stretching = ph.name === "dawn" && ph.k < 0.6;
      let mugAt = [88, 79];
      if (sleeping) {
        torso(g, cx, 66, sheriff, 22);
        limb(g, [[cx - 9, 70], [cx - 12, 80], [cx + 2, 81]], 3, sheriff.shirt, sheriff.skin);
        limb(g, [[cx + 8, 70], [cx + 12, 80], [cx - 2, 82]], 3, sheriff.shirt, sheriff.skin);
        head(g, cx, 64, { ...sheriff, blinkOff: 0 }, 0.05);
      } else if (stretching) {
        const s = Math.sin(ph.k / 0.6 * Math.PI);
        torso(g, cx, 62 - Math.round(s), sheriff, 26);
        head(g, cx, 51 - Math.round(s), { ...sheriff, look: -1 }, t);
        limb(g, [[cx - 9, 64], [cx - 11, lerp(72, 54, s)], [cx - 9, lerp(80, 42, s)]], 3, sheriff.shirt, sheriff.skin);
        limb(g, [[cx + 8, 64], [cx + 11, lerp(72, 54, s)], [cx + 9, lerp(80, 42, s)]], 3, sheriff.shirt, sheriff.skin);
        if (s > 0.6) R(g, cx - 1, 59 - Math.round(s), 2, 2, K);
      } else if (wk.brk >= 0 || ph.name === "dusk") {
        // pausa: café (de dia) ou olhando a papelada (no fim da tarde)
        torso(g, cx, 62, sheriff, 26);
        const sip = ph.name === "dusk" ? 0 : Math.sin(clamp(wk.brk / 0.9) * Math.PI);
        const look = ph.name === "dusk" ? Math.round(Math.sin(t * 0.9)) : 1;
        head(g, cx, 51, { ...sheriff, look: sip > 0.6 ? -1 : look }, sip > 0.6 ? 0.05 : t);
        const mx = lerp(88, 101, sip), my = lerp(79, 62, sip);
        mugAt = [mx, my];
        limb(g, armIK(cx - 9, 66, mx + 2, my + 2, 11, 11, -1), 3, sheriff.shirt, sheriff.skin);
        limb(g, [[cx + 8, 64], [cx + 14, 74], [cx + 10, 83]], 3, sheriff.shirt, sheriff.skin);
      } else {
        // carimbando a folha da vez
        const p = wk.p;
        torso(g, cx, 62, sheriff, 26);
        head(g, cx, 51, { ...sheriff, look: 1 }, t);
        // mão esquerda puxa a folha nova
        const pull = p < 0.14 ? p / 0.14 : 1;
        const lx = lerp(84, 118, pull);
        limb(g, armIK(cx - 9, 66, p < 0.18 ? lx : 96, p < 0.18 ? 82 : 83, 11, 11, -1), 3, sheriff.shirt, sheriff.skin);
        let up;
        if (p < 0.42) up = p / 0.42; else if (p < 0.5) up = 1 - (p - 0.42) / 0.08; else if (p < 0.64) up = 0; else if (p < 0.76) up = (p - 0.64) / 0.12 * 0.5; else up = 0.5;
        if (p < 0.8) {
          O(g, Math.round(p < 0.14 ? lx - 2 : 120), 82, 16, 2, "#f3e3c3");
          if (p >= 0.5) { R(g, 124, 82, 8, 1, "#c0392b"); R(g, 125, 83, 6, 1, "#c0392b"); }
        }
        const flick = p > 0.78 && p < 0.9;
        const sx = flick ? 131 : 127, sy = flick ? 75 : lerp(80, 67, up);
        limb(g, armIK(cx + 8, 66, sx, sy, 12, 12, 1), 3, sheriff.shirt, sheriff.skin);
        if (!flick) { O(g, sx - 1, sy - 5, 3, 4, "#5a3820"); O(g, sx - 3, sy - 1, 7, 2, "#a8322a"); }
        else { O(g, 136, 80, 3, 3, "#5a3820"); O(g, 134, 82, 7, 1, "#a8322a"); }
        if (p > 0.5 && p < 0.56) sparkle(g, 127, 80, 2, "#f3e3c3");
      }
      O(g, Math.round(mugAt[0]), Math.round(mugAt[1]), 5, 5, "#f3e3c3"); R(g, Math.round(mugAt[0]) + 5, Math.round(mugAt[1]) + 1, 1, 3, K);
      const c = counts(wk.n);
      PILES.forEach((P, i) => { if (P[5] === "mid") drawPile(g, P, i, c[i]); });
    }
    function after(g, t) {
      const ph = phaseOf(t), wk = work(ph);
      const c = counts(wk.n);
      PILES.forEach((P, i) => { if (P[5] === "fg") drawPile(g, P, i, c[i]); });
      // a folha voando até a pilha
      if (wk.p >= 0.8 && wk.n < N) {
        const dest = PILES[ORDER[wk.n]];
        const k = (wk.p - 0.8) / 0.2;
        const tx = dest[0], ty = pileTop(dest, c[ORDER[wk.n]]) - 2;
        const x = lerp(128, tx, k), y = lerp(80, ty, k) - Math.sin(k * Math.PI) * 26;
        const tilt = Math.round(Math.sin(k * 9) * 1.5);
        R(g, x - 5, y - 1 + tilt, 10, 3, K); R(g, x - 4, y + tilt, 8, 1, "#f3e3c3"); R(g, x - 1, y + tilt, 3, 1, "#c0392b");
      }
      let dark = 0;
      if (ph.name === "day") dark = ph.k < 0.8 ? 0 : (ph.k - 0.8) / 0.2 * 0.22;
      else if (ph.name === "dusk") dark = 0.22 + ph.k * 0.36;
      else if (ph.name === "night") dark = 0.58;
      else if (ph.name === "out") dark = 0.58 + ph.k * 0.36;
      else dark = 0.94 * (1 - ph.k) * (1 - ph.k);
      if (dark > 0) { g.fillStyle = `rgba(16,18,40,${dark})`; g.fillRect(0, 0, SW, SH); }
      let lamp = 0;
      if (ph.name === "day" && ph.k > 0.9) lamp = (ph.k - 0.9) / 0.1;
      else if (ph.name === "dusk" || ph.name === "night") lamp = 1;
      else if (ph.name === "out") lamp = ph.k < 0.6 ? (Math.sin(t * 40) > 0 ? 1 : 0.3) : 0;
      if (lamp > 0) {
        const f = lamp * (0.9 + Math.sin(t * 11) * 0.1);
        disc(g, 65, 79, 34, `rgba(255,190,100,${0.10 * f})`);
        disc(g, 65, 79, 18, `rgba(255,200,110,${0.14 * f})`);
        R(g, 64, 78, 2, 3, "#ffd84a");
      }
      if (ph.name === "night" || (ph.name === "dusk" && ph.k > 0.65)) {
        for (let i = 0; i < 3; i++) {
          const z = ((t * 0.35 + i / 3) % 1);
          g.globalAlpha = 1 - z;
          const zx = 112 + z * 14, zy = 60 - z * 22;
          R(g, zx, zy, 3, 1, "#f3e3c3"); R(g, zx + 1, zy + 1, 1, 1, "#f3e3c3"); R(g, zx, zy + 2, 3, 1, "#f3e3c3");
          g.globalAlpha = 1;
        }
      }
    }
    return { focus: 160, back, front, draw, after };
  })();

  // ---------- IV · Telégrafo ----------
  // A fita sai do aparelho e vai se amontoando até cobrir a cena; quando cobre tudo,
  // o monte inteiro desce de uma vez e revela a sala limpa, e tudo recomeça.
  SCENES.telegrafo = (() => {
    const FY = 116;
    const op = { skin: "#d8a47a", skinD: "#b07a58", hair: "#4a3020", hairH: 3, stache: "#4a3020", visor: true, shirt: "#ece4d4", vest: "#2a2a2e", garter: "#a8322a", blinkOff: 0.4 };
    const MORSE = "-.-. --- -- -- .. -";
    const U = 0.16, TIMELINE = [];
    for (const ch of MORSE) {
      if (ch === " ") { TIMELINE.push([0, 2 * U]); continue; }
      TIMELINE.push([1, ch === "." ? U : 3 * U]); TIMELINE.push([0, U]);
    }
    TIMELINE.push([0, 7 * U]);
    const TOTAL = TIMELINE.reduce((s, [, d]) => s + d, 0);
    function keyDown(t) { let x = t % TOTAL; for (const [on, d] of TIMELINE) { if (x < d) return !!on; x -= d; } return false; }
    // a sala enche de fita em uns 6 minutos; a cada 40 s o telegrafista faz uma pausa
    const GROW = 360, HOLD = 0.8, SLIDE = 2.2, CYC = GROW + HOLD + SLIDE;
    const PAUSE_EVERY = 40, PAUSE = 7;
    const SRC = 230;
    let tape = 0;
    // textura do papel acumulado: fita em camadas, com os traços do Morse
    const TH = 440;
    const [paper, pg] = makeCanvas(SW, TH);
    (function () {
      R(pg, 0, 0, SW, TH, "#ece0c4");
      seed = 31;
      for (let y = 2; y < TH; y += 5) {
        R(pg, 0, y, SW, 1, "#d6c6a2");
        for (let x = Math.floor(rnd() * 8); x < SW; x += 6 + Math.floor(rnd() * 10)) R(pg, x, y - 2, rnd() < 0.4 ? 1 : 3, 1, "#4a3020");
      }
      for (let i = 0; i < 140; i++) {
        const x = Math.floor(rnd() * SW), y = Math.floor(rnd() * TH);
        R(pg, x, y, 6, 1, "#b8a888"); R(pg, x - 1, y + 1, 1, 2, "#b8a888"); R(pg, x + 6, y + 1, 1, 2, "#b8a888");
      }
    })();
    function heapState(t) {
      const c = reduceMotion ? 6 : t % CYC;
      const k = clamp(c / GROW);
      const H = 236 * Math.pow(k, 1.6);
      const s = 16 + 280 * k * k;
      let off = 0;
      if (c > GROW + HOLD) { const e = (c - GROW - HOLD) / SLIDE; off = (SH + 70) * e * e * (3 - 2 * e); }
      return { H, s, off };
    }
    const topAt = (st, x) => SH - st.H * Math.exp(-((x - SRC) ** 2) / (2 * st.s * st.s)) + st.off;
    function back(g) {
      R(g, 0, 0, SW, 84, "#7a8a72"); for (let x = 0; x < SW; x += 12) R(g, x, 0, 6, 84, "#76866e");
      planksV(g, 0, 84, SW, 32, "#6e4a30", "#5a3a24", 8); R(g, 0, 84, SW, 3, "#4a3020");
      R(g, 0, 0, SW, 5, "#4a3020");
      floorBoards(g, FY, "#8a6040", "#6e4a30");
      windowSky(g, 248, 18, 54, 46, ["#f6c47a", "#f2a65a", "#e8884a", "#d87040"]);
      R(g, 248, 52, 54, 12, "#b0704a");
      R(g, 272, 22, 2, 30, "#4a3020"); R(g, 266, 26, 14, 2, "#4a3020");
      g.fillStyle = "#3a2418"; for (let x = 248; x < 302; x++) g.fillRect(x, Math.round(27 + Math.sin((x - 248) / 54 * Math.PI) * 3), 1, 1);
      R(g, 274, 18, 2, 46, "#4a3020"); R(g, 248, 40, 54, 2, "#4a3020");
      O(g, 18, 18, 74, 54, "#6e4426");
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const x = 20 + c * 12, y = 20 + r * 13;
        R(g, x, y, 10, 11, "#3a2418");
        if ((r * 7 + c * 3) % 4 !== 0) { R(g, x + 1, y + 4, 8, 6, "#f3e3c3"); R(g, x + 1, y + 4, 8, 1, "#d8c8a8"); }
      }
      sign(g, 168, 7, "COMMITS");
      // telegrama pregado na parede
      O(g, 96, 15, 48, 33, "#f0e2c0"); R(g, 96, 15, 48, 1, "#fff2d6"); R(g, 119, 14, 2, 2, "#a8322a");
      tinyText(g, "TELEGRAMA", 120, 18, "#2b1a10", true); R(g, 100, 24, 40, 1, "#a8322a");
      tinyText(g, "24 COMMITS", 120, 27, "#3a2418", true); tinyText(g, "NO ÚLTIMO", 120, 35, "#3a2418", true); tinyText(g, "ANO.", 120, 41, "#3a2418", true);
      disc(g, 210, 34, 10, K); disc(g, 210, 34, 9, "#f3e3c3");
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; R(g, 210 + Math.cos(a) * 7, 34 + Math.sin(a) * 7, 1, 1, "#6a4a2a"); }
    }
    function front(g) {
      O(g, 104, 90, 124, 26, "#5a3820"); R(g, 110, 94, 52, 18, "#4a2e1e"); R(g, 170, 94, 52, 18, "#4a2e1e");
      O(g, 100, 86, 132, 4, "#8a5a34"); R(g, 100, 86, 132, 1, "#b07a48");
      O(g, 176, 78, 28, 7, "#6e4426"); O(g, 180, 70, 6, 8, "#c0902a"); O(g, 192, 70, 6, 8, "#c0902a"); R(g, 180, 70, 1, 8, "#e8c060"); R(g, 192, 70, 1, 8, "#e8c060");
      O(g, 182, 66, 16, 3, "#3a3634");
      O(g, 150, 81, 22, 4, "#6e4426");
      O(g, 116, 82, 16, 3, "#f3e3c3");
      disc(g, 214, 79, 6, K); disc(g, 214, 79, 5, "#e8dcc4"); disc(g, 214, 79, 2, "#6e4426");
    }
    function draw(g, t, dt) {
      const pc = t % PAUSE_EVERY, pausing = pc > PAUSE_EVERY - PAUSE;
      const pk = pausing ? Math.sin(clamp((pc - (PAUSE_EVERY - PAUSE)) / PAUSE) * Math.PI) : 0;
      const coffee = Math.floor(t / PAUSE_EVERY) % 2 === 1;
      const down = !reduceMotion && !pausing && keyDown(t);
      const sa = (t / 60) * Math.PI * 2 - Math.PI / 2;
      seg(g, 210, 34, 210 + Math.cos(sa) * 7, 34 + Math.sin(sa) * 7, 1, "#a8322a");
      seg(g, 210, 34, 210, 29, 1, K); seg(g, 210, 34, 214, 34, 1, K);
      const st = heapState(t);
      const buried = clamp((86 - topAt(st, 140)) / 40);
      const cx = 140;
      torso(g, cx, 62, op, 26);
      head(g, cx, 51, { ...op, look: buried > 0.2 || pk > 0.5 ? -1 : 1 }, coffee && pk > 0.6 ? 0.05 : t);
      let mug = [108, 80];
      if (buried > 0.5) {
        limb(g, [[cx - 9, 64], [cx - 12, 54], [cx - 10, 44]], 3, op.shirt, op.skin);
        limb(g, [[cx + 8, 64], [cx + 12, 54], [cx + 10, 44]], 3, op.shirt, op.skin);
      } else if (pk > 0) {
        if (coffee) {
          mug = [lerp(108, 134, pk), lerp(80, 60, pk)];
          limb(g, armIK(cx - 9, 64, mug[0] + 2, mug[1] + 2, 11, 11, -1), 3, op.shirt, op.skin);
          limb(g, armIK(cx + 8, 64, 156, 82, 11, 11, 1), 3, op.shirt, op.skin);
        } else {
          // lê um pedaço da fita, segurando com as duas mãos
          const ry = lerp(80, 58, pk);
          limb(g, armIK(cx - 9, 64, 130, ry, 11, 11, -1), 3, op.shirt, op.skin);
          limb(g, armIK(cx + 8, 64, 150, ry, 11, 11, 1), 3, op.shirt, op.skin);
          if (pk > 0.3) { R(g, 131, ry - 1, 18, 3, K); R(g, 132, ry, 16, 1, "#ece0c4"); for (let x = 133; x < 147; x += 3) R(g, x, ry, 1 + (x % 2), 1, "#4a3020"); }
        }
        O(g, 154, 79, 14, 1, "#3a3634"); disc(g, 162, 78, 2, "#1e1a1a");
      } else {
        const wx = 120 + (down ? 0 : Math.round(Math.sin(t * 5) * 2));
        limb(g, armIK(cx - 9, 64, wx, 81, 11, 11, -1), 3, op.shirt, op.skin);
        R(g, wx + 2, 77, 1, 4, "#c0902a");
        const ky = down ? 81 : 79;
        limb(g, armIK(cx + 8, 64, 162, ky - 1, 12, 12, 1), 3, op.shirt, op.skin);
        O(g, 154, ky, 14, 1, "#3a3634"); disc(g, 162, ky - 1, 2, "#1e1a1a");
      }
      O(g, Math.round(mug[0]), Math.round(mug[1]), 5, 5, "#f3e3c3"); R(g, Math.round(mug[0]) - 1, Math.round(mug[1]) + 1, 1, 3, K);
      if (down) { sparkle(g, 190, 64, 2, "#ffe066"); R(g, 182, 67, 14, 1, "#5a5652"); }
      const bt = t % 22;
      if (bt < 15) {
        const bx = 286 + (bt < 1 ? (1 - bt) * 16 : 0), by = 26 + Math.round(Math.sin(((bx - 248) / 54) * Math.PI) * 3) - 3;
        R(g, bx, by, 4, 3, "#3a2a24"); R(g, bx + 3, by - 1, 2, 2, "#3a2a24"); R(g, bx + 5, by, 1, 1, "#c0902a");
      } else if (bt < 16) { const k = bt - 15; R(g, 286 + k * 30, 23 - k * 18, 4, 2, "#3a2a24"); }
      tape += dt * (down ? 10 : pausing ? 0 : 3);
    }
    function after(g, t) {
      const st = heapState(t);
      // a fita saindo do carretel até o topo do monte
      const yTop = Math.min(150, topAt(st, SRC + 1));
      R(g, 219, 79, 12, 3, "#e8dcc4");
      if (yTop > 82) {
        R(g, SRC - 1, 82, 3, yTop - 82, "#e8dcc4");
        for (let y = 82 + (tape % 6); y < yTop; y += 6) R(g, SRC, y, 1, 2, "#3a2418");
      }
      if (st.H < 1 && st.off === 0) return;
      // o monte de papel
      g.save();
      g.beginPath(); g.moveTo(0, SH + 2);
      for (let x = 0; x <= SW; x += 2) g.lineTo(x, Math.round(topAt(st, x)));
      g.lineTo(SW, SH + 2); g.closePath(); g.clip();
      g.drawImage(paper, 0, Math.round(st.off) - (TH - SH));
      g.restore();
      // contorno e voltinhas da fita na borda de cima
      for (let x = 0; x < SW; x += 1) {
        const y = Math.round(topAt(st, x));
        if (y >= -1 && y < SH) { R(g, x, y - 1, 1, 1, K); R(g, x, y, 1, 1, "#fff6e0"); }
      }
      for (let x = 4; x < SW; x += 11) {
        const y = Math.round(topAt(st, x + 2));
        if (y < 2 || y > SH - 2) continue;
        R(g, x, y - 4, 5, 1, K); R(g, x - 1, y - 3, 1, 3, K); R(g, x + 5, y - 3, 1, 3, K); R(g, x, y - 3, 5, 3, "#ece0c4"); R(g, x + 1, y - 2, 3, 1, "#d6c6a2");
      }
    }
    return { focus: 165, back, front, draw, after };
  })();

  // ---------- V · Escola ----------
  // A professora escreve na lousa, caminha (sem pressa) até a próxima linha, apaga e recomeça.
  // O aluno do fundo se distrai olhando a janela e, de vez em quando, joga uma bolinha de papel nela.
  SCENES.escola = (() => {
    const FY = 118;
    const LINES = ["ENGENHARIA DE", "SOFTWARE", "C# .NET SQL"];
    const X0 = 96, ROWS = [46, 57, 68];
    const CPS = 2.2, WALK_V = 22, REST = 214;
    const teacher = { hair: "#5a3420", top: "#3a4a6a", skirt: "#5a3a5a", skin: "#d8a47a" };
    const kid = { hair: "#3a2a1e", shirt: "#4a6a8a", skin: "#d8a47a", pants: "#3a3a4a" };
    const lineW = LINES.map((ln) => charX(ln, X0, ln.length) - X0);
    const posAt = (i, xFrac) => clamp(X0 + xFrac + 1 - 27, 68, 236);
    // linha do tempo da professora: anda, escreve, anda, escreve... segura, apaga, volta à mesa
    const SEGS = [];
    let cur = REST;
    LINES.forEach((ln, i) => {
      const start = posAt(i, 0);
      SEGS.push({ k: "walk", from: cur, to: start, d: Math.max(0.6, Math.abs(start - cur) / WALK_V) });
      SEGS.push({ k: "write", i, d: ln.length / CPS });
      cur = posAt(i, lineW[i]);
    });
    SEGS.push({ k: "hold", at: cur, d: 7 });
    const eFrom = clamp(X0 - 6 - 27, 68, 236), eTo = clamp(X0 + 150 - 27, 68, 236);
    SEGS.push({ k: "walk", from: cur, to: eFrom, d: Math.max(0.6, Math.abs(eFrom - cur) / WALK_V), keep: true });
    SEGS.push({ k: "erase", d: 4 });
    SEGS.push({ k: "walk", from: eTo, to: REST, d: Math.max(0.6, Math.abs(REST - eTo) / WALK_V), erased: true });
    SEGS.push({ k: "pause", at: REST, d: 2.5, erased: true });
    const CYCLE = SEGS.reduce((s, x) => s + x.d, 0);
    function stateAt(c) {
      let acc = 0;
      const shown = [0, 0, 0];
      let afterWrite = false;
      for (const s of SEGS) {
        if (c < acc + s.d || s === SEGS[SEGS.length - 1]) {
          const k = clamp((c - acc) / s.d);
          return { s, k, shown, afterWrite };
        }
        acc += s.d;
        if (s.k === "write") shown[s.i] = LINES[s.i].length;
        if (s.k === "hold") afterWrite = true;
      }
    }
    const KT = 34;
    let dust = [], ballFloor = null;
    function back(g) {
      R(g, 0, 0, SW, 90, "#e8dcc4"); for (let y = 6; y < 90; y += 8) R(g, 0, y, SW, 1, "#ddd0b6");
      planksV(g, 0, 90, SW, 28, "#8a4a2a", "#6e3a20", 9); R(g, 0, 90, SW, 2, "#5a2e18");
      floorBoards(g, FY, "#9a6a40", "#7a5030");
      // faixa do alfabeto acima da lousa
      O(g, 80, 24, 166, 9, "#f6eedc");
      const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      [...ABC].forEach((ch, i) => tinyText(g, ch, 84.5 + i * 6.3, 26, i % 2 ? "#3a4a6a" : "#8a3a2a", true));
      // lousa
      O(g, 80, 36, 166, 50, "#8a5a34"); R(g, 83, 39, 160, 44, "#2e4a3a");
      seed = 9; for (let i = 0; i < 40; i++) R(g, 84 + Math.floor(rnd() * 158), 40 + Math.floor(rnd() * 42), 2 + Math.floor(rnd() * 5), 1, "#3a5a48");
      O(g, 82, 86, 162, 2, "#6e4426"); R(g, 120, 84, 4, 1, "#f3efe2"); R(g, 190, 84, 3, 1, "#e8c878");
      // sino
      seg(g, 300, 0, 300, 74, 1, "#c8a870"); O(g, 298, 74, 4, 6, "#a8322a");
      // mapa do Brasil enrolado
      O(g, 254, 34, 30, 3, "#6e4426"); R(g, 255, 37, 28, 30, "#e8d8a8"); R(g, 256, 37, 26, 1, "#c8b888");
      const BR = ["0000111110000", "0011111111100", "0111111111110", "0111111111111", "0011111111111", "0001111111110", "0000111111100", "0000011111000", "0000011110000", "0000001110000", "0000001100000"];
      BR.forEach((row, y) => [...row].forEach((b, x) => { if (b === "1") R(g, 263 + x, 40 + y, 1, 1, (x + y) % 5 === 0 ? "#6e8a38" : "#8aa448"); }));
      R(g, 271, 45, 1, 1, "#a8322a");
      tinyText(g, "BRASIL", 269, 59, "#5a3820", true);
    }
    function front(g) {
      // carteira do aluno e a da frente
      [[24, 104], [150, 106]].forEach(([x, y]) => { O(g, x, y, 46, 4, "#8a5a34"); R(g, x + 2, y + 4, 2, FY - y - 4, "#5a3820"); R(g, x + 42, y + 4, 2, FY - y - 4, "#5a3820"); });
      O(g, 182, 100, 5, 5, "#c0392b"); R(g, 184, 98, 1, 2, "#5a3820"); R(g, 185, 98, 2, 1, "#5e7d4a");
      O(g, 164, 102, 12, 3, "#3a6a8a");
      // mesa da professora
      O(g, 256, 92, 54, 4, "#8a5a34"); O(g, 258, 96, 50, 22, "#6e4426");
      R(g, 264, 102, 38, 1, "#5a3820"); R(g, 281, 106, 4, 2, "#c0a060");
      O(g, 296, 88, 8, 4, "#a8322a"); R(g, 296, 88, 8, 1, "#c8502a");
    }
    // globo com o eixo inclinado (23°), girando
    const LAND = [[0.6, 0.2, 0.55], [-0.3, 0.9, 0.5], [0.3, 2.3, 0.6], [-0.5, 3.7, 0.45], [0.75, 4.7, 0.4], [0.05, 5.5, 0.3]];
    function globe(g, cx, cy, r, t) {
      const T = 0.41, cs = Math.cos(T), sn = Math.sin(T), rot = t * 0.6;
      // suporte e meridiano de latão
      O(g, cx - 6, cy + r + 4, 12, 2, "#6e4426"); R(g, cx, cy + r + 1, 1, 3, "#8a6a3a");
      for (let a = 0.2; a < Math.PI * 1.1; a += 0.04) {
        const x = (r + 2) * Math.cos(a + Math.PI / 2 + 0.2), y = (r + 2) * Math.sin(a + Math.PI / 2 + 0.2);
        R(g, cx + x * cs - y * sn, cy + x * sn + y * cs, 1, 1, "#c0902a");
      }
      disc(g, cx, cy, r + 1, K);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const u = dx * cs + dy * sn, v = -dx * sn + dy * cs;
        const lat = Math.asin(clamp(-v / r, -1, 1));
        const z = Math.sqrt(Math.max(0, r * r - u * u - v * v));
        const lon = Math.atan2(u, z) + rot;
        let land = false;
        for (const [la, lo, sz] of LAND) {
          const cd = Math.sin(lat) * Math.sin(la) + Math.cos(lat) * Math.cos(la) * Math.cos(lon - lo);
          if (cd > Math.cos(sz)) { land = true; break; }
        }
        const dark = dx + dy * 0.4 > r * 0.45;
        R(g, cx + dx, cy + dy, 1, 1, land ? (dark ? "#6e8a38" : "#8aa448") : (dark ? "#2e5470" : "#3a6a8a"));
      }
      R(g, cx - 2, cy - 3, 1, 1, "rgba(255,255,255,0.7)");
      // eixo
      R(g, Math.round(cx + (r + 3) * sn), Math.round(cy - (r + 3) * cs), 1, 2, "#c0902a");
      R(g, Math.round(cx - (r + 2) * sn), Math.round(cy + (r + 2) * cs), 1, 1, "#c0902a");
    }
    function kidState(t) {
      const k = t % KT;
      if (k < 14) return { m: "write", k };
      if (k < 19.5) return { m: "dream", k: (k - 14) / 5.5 };
      if (k < 22) return { m: "write", k };
      if (k < 23.2) return { m: "crumple", k: (k - 22) / 1.2 };
      if (k < 24) return { m: "windup", k: (k - 23.2) / 0.8 };
      if (k < 25.2) return { m: "throw", k: (k - 24) / 1.2 };
      return { m: "innocent", k: (k - 25.2) / (KT - 25.2) };
    }
    let teacherX = REST;
    function draw(g, t, dt) {
      // janela com o ipê balançando
      R(g, 16, 22, 44, 46, "#4a3020");
      ["#f6c47a", "#f2a65a", "#e8884a"].forEach((c, i) => R(g, 19, 25 + i * 14, 38, 14, c));
      const sway = Math.sin(t * 0.5) * 1.5;
      g.save(); g.beginPath(); g.rect(19, 25, 38, 40); g.clip();
      R(g, 44, 46, 3, 20, "#5a4232");
      [[46, 38, 10], [36, 42, 8], [54, 44, 7], [42, 32, 7]].forEach(([x, y, r]) => disc(g, x + sway, y, r + 1, "#8a5a1a"));
      [[46, 38, 10], [36, 42, 8], [54, 44, 7], [42, 32, 7]].forEach(([x, y, r]) => disc(g, x + sway, y, r, "#e8b020"));
      [[44, 35, 5], [35, 40, 4]].forEach(([x, y, r]) => disc(g, x + sway, y, r, "#ffd84a"));
      for (let i = 0; i < 4; i++) { const k = ((t * 0.25 + i * 0.27) % 1); R(g, 26 + i * 8 + Math.sin(t + i) * 3, 30 + k * 34, 1, 1, "#ffd23a"); }
      g.restore();
      R(g, 37, 25, 2, 40, "#4a3020"); R(g, 19, 44, 38, 2, "#4a3020");
      // giz na lousa
      const st = stateAt(reduceMotion ? SEGS.slice(0, 6).reduce((s, x) => s + x.d, 0) + 1 : t % CYCLE);
      const s = st.s, shown = st.shown.slice();
      let handX = null, handY = null, eraseX = -1, cx;
      if (s.k === "write") {
        const len = LINES[s.i].length;
        const nf = st.k * len, n = Math.floor(nf);
        shown[s.i] = n;
        const x0 = charX(LINES[s.i], X0, n), x1 = charX(LINES[s.i], X0, Math.min(len, n + 1));
        handX = lerp(x0, x1, nf - n) + 1; handY = ROWS[s.i] + 4;
        cx = clamp(handX - 27, 68, 236);
      } else if (s.k === "walk") {
        cx = lerp(s.from, s.to, st.k * st.k * (3 - 2 * st.k));
      } else if (s.k === "hold") {
        cx = s.at;
      } else if (s.k === "erase") {
        eraseX = X0 - 6 + st.k * 156;
        cx = clamp(eraseX - 27, 68, 236);
        handX = eraseX; handY = 60;
      } else cx = s.at;
      const erasedAll = s.erased || (s.k === "walk" && !s.keep && !st.afterWrite && shown.every((v) => v === 0));
      if (!s.erased) {
        LINES.forEach((ln, i) => {
          if (!shown[i]) return;
          g.save();
          if (eraseX > 0) { g.beginPath(); g.rect(eraseX, 0, SW, SH); g.clip(); }
          pixelText(g, ln, X0, ROWS[i], "#f3efe2", false, shown[i]);
          g.restore();
        });
        if (s.k === "hold" || (s.k === "walk" && s.keep)) R(g, X0, ROWS[2] + 10, s.k === "hold" ? Math.min(62, st.k * s.d * 30) : 62, 1, "#e8c878");
        if (s.k === "erase") { g.save(); g.beginPath(); g.rect(eraseX, 0, SW, SH); g.clip(); R(g, X0, ROWS[2] + 10, 62, 1, "#e8c878"); g.restore(); }
      }
      void erasedAll;
      cx = Math.round(cx); teacherX = cx;
      // professora de costas
      const walking = s.k === "walk";
      const step = walking ? (Math.sin(t * 7) > 0 ? 1 : 0) : 0;
      const ks = kidState(t);
      const angry = ks.m === "innocent" && ks.k < 0.32;
      for (let y = 0; y < 38; y++) {
        const w = 14 + Math.round(y * 0.32), sh = y > 30 ? step : 0;
        R(g, cx - Math.floor(w / 2) - 1 + sh, 80 + y, w + 2, 1, K); R(g, cx - Math.floor(w / 2) + sh, 80 + y, w, 1, teacher.skirt);
      }
      R(g, cx - 1, 82, 1, 34, shade(teacher.skirt, 0.8));
      if (walking) { R(g, cx - 5 + step * 3, 117, 4, 1, "#2a1e18"); }
      const bob = walking ? step : 0;
      O(g, cx - 10, 64 - bob, 4, 5, teacher.top); O(g, cx + 6, 64 - bob, 4, 5, teacher.top);
      O(g, cx - 7, 63 - bob, 14, 18, teacher.top); R(g, cx - 7, 78 - bob, 14, 2, "#2a3450");
      R(g, cx - 2, 61 - bob, 4, 3, teacher.skin);
      O(g, cx - 5, 51 - bob, 10, 11, teacher.hair); R(g, cx - 4, 52 - bob, 3, 8, shade(teacher.hair, 1.2));
      O(g, cx - 3, 47 - bob, 6, 5, teacher.hair); R(g, cx - 1, 46 - bob, 2, 1, "#c0902a");
      if (angry) {
        // vira o rosto para o fundo da sala, brava
        R(g, cx - 6, 55, 3, 6, teacher.skin); R(g, cx - 6, 57, 1, 1, K); R(g, cx - 6, 56, 2, 1, K);
        const vx = cx + 6, vy = 47;
        R(g, vx, vy, 1, 3, "#c0392b"); R(g, vx + 2, vy, 1, 3, "#c0392b"); R(g, vx - 1, vy + 1, 5, 1, "#c0392b");
      }
      limb(g, [[cx - 9, 66 - bob], [cx - 10, 73], [cx - 7, 80]], 3, teacher.top, teacher.skin);
      O(g, cx - 11, 74, 5, 8, "#8a3a2a"); R(g, cx - 11, 74, 1, 8, "#f3e3c3");
      let fin;
      if (handX !== null && !angry) {
        const hy = s.k === "write" ? handY + Math.round(Math.sin(t * 9) * 0.6) : handY;
        const reachX = clamp(handX, cx + 14, cx + 33), reachY = clamp(hy, 46, 80);
        const arm = armIK(cx + 8, 66, reachX, reachY, 12, 12, 1);
        limb(g, arm, 3, teacher.top, teacher.skin);
        fin = arm[2];
      } else {
        // braço descansando ao lado do corpo (caminhando ou olhando a lousa)
        const sw = walking ? Math.sin(t * 7) * 2 : 0;
        limb(g, [[cx + 8, 66 - bob], [cx + 10, 73], [cx + 9 + sw, 80]], 3, teacher.top, teacher.skin);
        fin = [cx + 9 + sw, 80];
      }
      if (s.k === "erase" && !angry) {
        O(g, fin[0] - 4, fin[1] - 2, 8, 4, "#8a5a34"); R(g, fin[0] - 4, fin[1] + 1, 8, 1, "#e8e0d0");
        if (Math.random() < 0.4) dust.push({ x: fin[0] + Math.random() * 6 - 3, y: fin[1] + 2, life: 0 });
      } else if (s.k === "write" && !angry) R(g, fin[0] - 1, fin[1] - 1, 2, 2, "#f3efe2");
      dust = dust.filter((d) => (d.life += dt) < 1);
      for (const d of dust) R(g, d.x, d.y + d.life * 22, 1, 1, `rgba(243,239,226,${0.7 * (1 - d.life)})`);
      globe(g, 284, 80, 7, t);
    }
    function after(g, t) {
      // aluno sentado de costas: pés debaixo da carteira, mãos sobre ela
      const kx = 48, ks = kidState(t);
      O(g, kx - 12, 108, 24, 3, "#7a4a2a"); R(g, kx - 10, 111, 2, 7, "#5a3820"); R(g, kx + 8, 111, 2, 7, "#5a3820");
      const swing = ks.m === "dream" ? Math.round(Math.sin(t * 5)) : 0;
      O(g, kx - 6, 110, 4, 6, kid.pants); O(g, kx + 2, 110, 4, 6 + swing, kid.pants);
      O(g, kx - 7, 115, 6, 2, "#2a1e18"); O(g, kx + 2, 115 + swing, 6, 2, "#2a1e18");
      O(g, kx - 9, 93, 3, 4, kid.shirt); O(g, kx + 6, 93, 3, 4, kid.shirt);
      O(g, kx - 7, 92, 14, 15, kid.shirt); R(g, kx - 7, 104, 14, 2, kid.pants);
      const look = ks.m === "dream" ? -1 : 0;
      O(g, kx - 5 + look, 82, 10, 10, kid.hair); R(g, kx - 6 + look, 84, 1, 5, kid.hair); R(g, kx - 2 + look, 81, 2, 1, kid.hair); R(g, kx - 4 + look, 83, 2, 2, shade(kid.hair, 1.3));
      if (look) { R(g, kx - 6, 87, 1, 3, kid.skin); }
      // mãos
      let L = [kx - 11, 103], Rh = [kx + 11, 102];
      if (ks.m === "write" || ks.m === "innocent") Rh = [kx + 10 + Math.round(Math.sin(t * 8)), 102];
      if (ks.m === "dream") Rh = [kx + 3, 90];
      if (ks.m === "crumple") { L = [kx - 3, 99 + Math.round(Math.sin(t * 20))]; Rh = [kx + 3, 99 - Math.round(Math.sin(t * 20))]; }
      if (ks.m === "windup") Rh = [kx + 10, lerp(98, 80, ks.k)];
      if (ks.m === "throw") Rh = [kx + 12, lerp(80, 90, Math.min(1, ks.k * 3))];
      limb(g, armIK(kx - 9, 95, L[0], L[1], 8, 8, -1), 3, kid.shirt, kid.skin);
      limb(g, armIK(kx + 8, 95, Rh[0], Rh[1], 8, 8, 1), 3, kid.shirt, kid.skin);
      if (ks.m === "crumple") disc(g, kx, 98, 2, "#f3efe2");
      if (ks.m === "windup") { disc(g, Rh[0], Rh[1] - 1, 2, K); disc(g, Rh[0], Rh[1] - 1, 1.5, "#f3efe2"); }
      // bolinha voando até a cabeça da professora
      if (ks.m === "throw") {
        const tx = teacherX, ty = 56;
        const bx = lerp(kx + 10, tx, ks.k), by = lerp(78, ty, ks.k) - Math.sin(ks.k * Math.PI) * 24;
        disc(g, bx, by, 2, K); disc(g, bx, by, 1.5, "#f3efe2");
        ballFloor = null;
      }
      if (ks.m === "innocent") {
        if (!ballFloor) ballFloor = { x: teacherX + 6, t0: t };
        const fall = clamp((t - ballFloor.t0) / 0.5);
        const by = lerp(58, 115, fall * fall);
        disc(g, ballFloor.x + fall * 6, by, 2, K); disc(g, ballFloor.x + fall * 6, by, 1.5, "#f3efe2");
        // assobiando, fingindo que nada aconteceu
        if (ks.k < 0.4) { const n = (t * 1.5) % 1; R(g, kx + 8 + n * 6, 78 - n * 10, 1, 3, "#3a2a1e"); R(g, kx + 6 + n * 6, 80 - n * 10, 2, 2, "#3a2a1e"); }
      }
      // pensando longe, olhando a janela
      if (ks.m === "dream") {
        const a = Math.min(1, ks.k * 4) * Math.min(1, (1 - ks.k) * 4);
        g.globalAlpha = a;
        disc(g, kx - 10, 76, 1, "#f6eedc"); disc(g, kx - 14, 70, 1.5, "#f6eedc");
        O(g, kx - 30, 52, 20, 13, "#f6eedc");
        disc(g, kx - 20, 58, 4, "#e8b020"); disc(g, kx - 21, 57, 2, "#ffd84a"); R(g, kx - 20, 61, 1, 3, "#5a4232");
        g.globalAlpha = 1;
      }
    }
    return { focus: 165, back, front, draw, after };
  })();

  // ---------- VI · Saloon ----------
  SCENES.saloon = (() => {
    const FY = 118;
    const barman = { skin: "#d6a07a", skinD: "#a8735a", hair: "#2a1e18", hairH: 3, stache: "#2a1e18", shirt: "#ece4d4", vest: "#2a2a2e", tie: "#a8322a", blinkOff: 1.8 };
    let notes = [], steam = [];
    function back(g) {
      R(g, 0, 0, SW, 88, "#6e2620");
      for (let y = 4; y < 88; y += 8) for (let x = (y / 8 % 2) * 6; x < SW; x += 12) { R(g, x, y, 1, 1, "#8a3a2a"); R(g, x - 1, y + 1, 3, 1, "#7e3024"); R(g, x, y + 2, 1, 1, "#8a3a2a"); }
      planksV(g, 0, 88, SW, 30, "#4a2a1c", "#3a1e14", 10); R(g, 0, 88, SW, 2, "#2a160e");
      floorBoards(g, FY, "#7a5034", "#5e3a24");
      // espelho e prateleiras do bar
      O(g, 204, 16, 100, 32, "#9ab0b0"); R(g, 210, 20, 2, 24, "#c8d8d8"); R(g, 216, 20, 1, 24, "#c8d8d8");
      O(g, 200, 14, 108, 3, "#8a5a34");
      O(g, 202, 58, 104, 3, "#6e4426");
      [[208, "#c0a070"], [220, "#c0a070"], [232, "#c0a070"]].forEach(([x, c]) => { O(g, x, 49, 9, 9, c); R(g, x, 49, 9, 2, "#6e4426"); R(g, x + 2, 53, 5, 2, "#f3e3c3"); });
      [[250, "#5a8a4a"], [258, "#8a3a2a"], [266, "#5a8a4a"], [278, "#c0902a"], [290, "#3a6a8a"]].forEach(([x, c]) => { O(g, x, 46, 5, 12, c); O(g, x + 1, 43, 3, 3, c); });
      sign(g, 254, 2, "CAFÉ");
      // quadro do céu (astronomia)
      O(g, 160, 20, 38, 28, "#6e4426"); R(g, 162, 22, 34, 24, "#1e2a4a");
      disc(g, 186, 30, 4, "#f3efe2"); disc(g, 188, 29, 3, "#1e2a4a");
      // aviso clássico, na fonte maior
      O(g, 90, 18, 66, 34, "#f0dcb0"); R(g, 90, 18, 66, 1, "#fff0cc"); R(g, 122, 17, 2, 2, "#6a6662");
      tinyText(g, "POR FAVOR", 123, 21, "#8a2a20", true);
      pixelText(g, "NÃO ATIRE", 123, 30, "#2b1a10");
      pixelText(g, "NO PIANISTA", 123, 41, "#2b1a10");
      // cardápio do café

      // piano
      O(g, 16, 54, 70, 50, "#3a221a"); R(g, 20, 58, 62, 18, "#4a2e22"); R(g, 22, 60, 58, 1, "#5a3a2a");
      O(g, 18, 82, 66, 5, "#f3e3c3"); for (let x = 20; x < 84; x += 4) R(g, x, 82, 1, 3, K);
      R(g, 22, 104, 4, 14, "#3a221a"); R(g, 76, 104, 4, 14, "#3a221a");
      O(g, 42, 48, 3, 6, "#f3e3c3");
    }
    function front(g) {
      O(g, 190, 86, 130, 32, "#6e3e22");
      for (let x = 196; x < 320; x += 30) { R(g, x, 90, 24, 24, "#5a3018"); R(g, x, 90, 24, 1, "#3a1e10"); }
      O(g, 186, 82, 134, 4, "#a86a3a"); R(g, 186, 82, 134, 1, "#c88a5a");
      R(g, 186, 112, 134, 2, "#c0902a");
      // mesinha com xícara e livro
      O(g, 128, 98, 34, 3, "#6e4426"); R(g, 143, 101, 4, 17, "#5a3820"); R(g, 137, 116, 16, 2, "#5a3820");
      O(g, 132, 94, 12, 3, "#3a6a8a"); R(g, 132, 94, 12, 1, "#f3e3c3");
      O(g, 150, 93, 5, 4, "#f3e3c3");
      // banquinho do piano
      O(g, 40, 98, 18, 3, "#5a3820"); R(g, 42, 101, 2, 17, "#3a221a"); R(g, 54, 101, 2, 17, "#3a221a");
    }
    // ---- segredo da vela: o estado mora em PIANO e a linha do tempo anda no relógio da cena ----
    // (se o visitante sai do Saloon, o relógio para e a sequência continua de onde estava na volta)
    const NAO_X0 = Math.round(123 - textWidth("NÃO ATIRE") / 2), NAO_X1 = NAO_X0 + textWidth("NÃO") - 1;
    const NAO = { x0: NAO_X0, x1: NAO_X1, y0: 27, y1: 30 + GL["N"].length - 1, cx: (NAO_X0 + NAO_X1) / 2, cy: 32.5 };
    PIANO.word = NAO;
    // queima · pianista percebe · foge · Tião sai · chega no cartaz · joga fora · pendura · pianista volta · senta · toca · Tião no balcão · fim
    const TL = { burn: 1.6, notice: 1.8, run: 2.4, gone: 4.8, tiaoOut: 5.2, atSign: 8.5, toss: 9.3, hang: 9.8, hung: 11.0, back: 11.3, sit: 14.4, play: 14.7, tiaoBack: 14.3, end: 14.9 };
    PIANO.TL = TL;
    const noise = (x, y) => (((x * 73 + y * 151) % 17) + 17) % 17 / 17;
    // pinta a parede de volta onde o cartaz estava (mesma estampa do fundo)
    function wallPatch(g, x0, y0, w, h) {
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
      R(g, x0, y0, w, h, "#6e2620");
      for (let y = 4; y < 88; y += 8) for (let x = (y / 8 % 2) * 6; x < SW; x += 12) {
        if (x < x0 - 2 || x > x0 + w + 2 || y < y0 - 3 || y > y0 + h) continue;
        R(g, x, y, 1, 1, "#8a3a2a"); R(g, x - 1, y + 1, 3, 1, "#7e3024"); R(g, x, y + 2, 1, 1, "#8a3a2a");
      }
      g.restore();
    }
    // o fogo come só o "NÃO": parte da chama da vela, com brasa na frente e borda carbonizada atrás
    function burnWord(g, k, t) {
      const [ox, oy] = PIANO.origin;
      const rw = (NAO.x1 - NAO.x0) / 2 + 3, rh = 5.6, r = k * 26;
      for (let y = NAO.y0 - 4; y <= NAO.y1 + 4; y++) for (let x = NAO.x0 - 5; x <= NAO.x1 + 3; x++) {
        const n = noise(x, y);
        const q = ((x - NAO.cx) / rw) ** 2 + ((y - NAO.cy) / rh) ** 2 + n * 0.18;
        const d = Math.hypot(x - ox, y - oy) + n * 3;
        if (q < 1) {
          if (d < r - 2.2) R(g, x, y, 1, 1, "#3a1610");
          else if (d < r - 0.8) R(g, x, y, 1, 1, "#1e0e08");
          else if (d < r + 0.6 && k < 1) R(g, x, y, 1, 1, Math.sin(t * 30 + x * 3 + y) > 0 ? "#ffb030" : "#ff6a20");
          else if (d < r + 2 && k < 1) R(g, x, y, 1, 1, "#a8743a");
        } else if (q < 1.32 && d < r) R(g, x, y, 1, 1, q < 1.15 ? "#7a4a22" : "#c09058");
      }
      // fumacinha subindo enquanto queima
      if (k < 1 && !reduceMotion) for (let i = 0; i < 4; i++) {
        const s = (t * 0.9 + i / 4) % 1;
        R(g, Math.round(ox + Math.sin(t * 3 + i * 2) * 3 + i - 2), Math.round(oy - 4 - s * 16), 1, 1, `rgba(200,190,180,${0.55 * (1 - s)})`);
      }
    }
    // pianista em pé: foge em pânico ou volta envergonhado
    function runner(g, x, t, panic, dir = 1) {
      x = Math.round(x);
      const b = -dir;
      const a = Math.round(Math.sin(t * (panic ? 26 : 9)) * 3);
      O(g, x - 5 + a, 98, 4, 15, "#1e1e2a"); O(g, x + 1 - a, 98, 4, 15, "#1e1e2a");
      O(g, x - 7 + a, 112, 6, 3, "#1a120e"); O(g, x - 1 - a, 112, 6, 3, "#1a120e");
      O(g, x - 7, 78, 14, 21, "#2a2a3a"); R(g, x - 1, 80, 2, 6, "#ece4d4");
      O(g, x - 5, 67, 10, 11, "#c08a64"); R(g, x - 5, 67, 10, 3, "#3a2418");
      if (panic) {
        R(g, x - 3, 71, 2, 2, K); R(g, x + 1, 71, 2, 2, K); R(g, x - 1, 75, 3, 2, "#5a2a1a");
        const w = Math.round(Math.sin(t * 22) * 3);
        limb(g, [[x - 8, 80], [x - 12, 72], [x - 14 + w, 63]], 3, "#2a2a3a", "#c08a64");
        limb(g, [[x + 7, 80], [x + 11, 72], [x + 13 - w, 63]], 3, "#2a2a3a", "#c08a64");
        if (Math.sin(t * 9) > 0) { R(g, x + b * 8, 66, 1, 2, "#a8d8f0"); R(g, x + b * 11, 63, 1, 2, "#a8d8f0"); R(g, x - b * 9, 65, 1, 2, "#a8d8f0"); }
        R(g, x + b * 10, 111, 3, 2, "rgba(200,170,130,0.6)"); R(g, x + b * 16, 109, 2, 2, "rgba(200,170,130,0.4)"); R(g, x + b * 21, 112, 2, 1, "rgba(200,170,130,0.3)");
      } else {
        R(g, x - 3, 72, 2, 1, K); R(g, x + 1, 72, 2, 1, K); R(g, x - 2, 75, 4, 1, "#7a4a3a");
        R(g, x - 4, 70, 2, 1, "#e8907a"); R(g, x + 2, 70, 2, 1, "#e8907a");
        limb(g, [[x - 8, 80], [x - 9, 88], [x - 8, 95 + a]], 3, "#2a2a3a", "#c08a64");
        limb(g, [[x + 7, 80], [x + 8, 88], [x + 7, 95 - a]], 3, "#2a2a3a", "#c08a64");
      }
    }
    // Tião sai de trás do balcão, troca o cartaz e volta
    function tiao(g, e, t) {
      let x, phase = "walk", dir = -1;
      if (e < TL.atSign) x = lerp(252, 122, (e - TL.tiaoOut) / (TL.atSign - TL.tiaoOut));
      else if (e < TL.hung) { x = 122; phase = e < TL.toss ? "pull" : e < TL.hang ? "toss" : "hang"; }
      else { x = lerp(122, 252, clamp((e - TL.hung) / (TL.tiaoBack - TL.hung))); dir = 1; }
      x = Math.round(x);
      const a = phase === "walk" ? Math.round(Math.sin(t * 10) * 3) : 0;
      O(g, x - 5 + a, 86, 4, 27, "#2a2a2e"); O(g, x + 1 - a, 86, 4, 27, "#2a2a2e");
      O(g, x - 6 + a, 112, 6, 3, "#1a120e"); O(g, x - a, 112, 6, 3, "#1a120e");
      torso(g, x, 61, barman, 25);
      head(g, x, 50, { ...barman, look: 1 }, t);
      const arm = (pts) => limb(g, pts, 3, barman.shirt, barman.skin);
      if (phase === "walk") {
        arm([[x - 9, 63], [x - 10, 72], [x - 9 - a, 80]]); arm([[x + 8, 63], [x + 9, 72], [x + 8 + a, 80]]);
        if (dir < 0) { O(g, x + 7, 66, 4, 15, "#f0dcb0"); R(g, x + 7, 66, 4, 1, "#c8b080"); R(g, x + 7, 80, 4, 1, "#c8b080"); }
      } else if (phase === "pull") {
        const k = (e - TL.atSign) / (TL.toss - TL.atSign);
        const hy = Math.round(lerp(42, 58, clamp((k - 0.35) / 0.65)));
        arm([[x - 9, 63], [x - 14, 52], [x - 11, hy]]); arm([[x + 8, 63], [x + 13, 52], [x + 10, hy]]);
        O(g, x + 16, 96, 4, 17, "#f0dcb0");
        if (k > 0.35) { O(g, x - 15, hy - 4, 30, 15, "#f0dcb0"); R(g, x - 11, hy - 1, 8, 6, "#3a1610"); R(g, x - 12, hy - 2, 10, 1, "#7a4a22"); }
      } else if (phase === "toss") {
        const k = (e - TL.toss) / (TL.hang - TL.toss);
        arm([[x - 9, 63], [x - 16, 66], [x - 22, 70]]); arm([[x + 8, 63], [x + 10, 72], [x + 9, 80]]);
        O(g, x + 16, 96, 4, 17, "#f0dcb0");
        g.save(); g.globalAlpha = 1 - k * 0.7; g.translate(x - 30, Math.round(lerp(64, 106, k * k))); g.rotate(-k * 0.9);
        O(g, -11, -6, 22, 11, "#f0dcb0"); R(g, -8, -4, 6, 5, "#3a1610"); g.restore();
      } else {
        const k = (e - TL.hang) / (TL.hung - TL.hang);
        const hy = Math.round(clamp(14 + k * 41, 42, 54));
        arm([[x - 9, 63], [x - 15, 54], [x - 18, hy]]); arm([[x + 8, 63], [x + 14, 54], [x + 17, hy]]);
      }
      if (dir > 0 && e > TL.hung + 0.2) R(g, x - 1, 44, 2, 2, "#e8c878");
    }
    function drawCandle(g, t) {
      let pos = null;
      if (PIANO.candle === "held") pos = [PIANO.cx, PIANO.cy];
      else if (PIANO.candle === "burning") pos = [PIANO.origin[0], PIANO.origin[1] + 3];
      else if (PIANO.candle === "returning") {
        const k = clamp((performance.now() - PIANO.retAt) / 450), ek = 1 - (1 - k) * (1 - k);
        pos = [lerp(PIANO.retFrom[0], PIANO.slot.x, ek), lerp(PIANO.retFrom[1], PIANO.slot.y - 1, ek)];
        if (k >= 1) PIANO.candle = "lustre";
      }
      if (!pos) return;
      const x = Math.round(pos[0]), y = Math.round(pos[1]);
      disc(g, x, y - 3, 9, "rgba(255,200,120,0.16)");
      O(g, x - 1, y, 2, 6, "#f3e3c3"); R(g, x - 1, y + 5, 2, 1, "#c8b898");
      R(g, x - 1, y - 3 - (Math.sin(t * 14) > 0 ? 1 : 0), 2, 2, "#ffd84a"); R(g, x - 1, y - 1, 2, 1, "#ffb030");
    }
    function draw(g, t, dt) {
      const e = PIANO.state === "seq" ? t - PIANO.start : -1;
      // estrelas do quadro piscando
      [[166, 26], [172, 38], [178, 24], [192, 40], [168, 43], [184, 42]].forEach(([x, y], i) => R(g, x, y, 1, 1, Math.sin(t * 3 + i * 1.7) > 0.2 ? "#fff8d8" : "#5a6a8a"));
      // o cartaz: queimando, arrancado ou sendo pendurado de novo
      if (e >= 0) {
        if (e < TL.atSign) burnWord(g, Math.min(1, e / TL.burn), t);
        else if (e < TL.hung) {
          wallPatch(g, 86, 14, 72, 41);
          if (e >= TL.hang && PIANO.bc) { const h = Math.round(clamp((e - TL.hang) / (TL.hung - TL.hang)) * 41); if (h > 0) g.drawImage(PIANO.bc, 86, 14, 72, h, 86, 14, 72, h); }
        }
      }
      // lustre (a vela da direita pode ser pega)
      seg(g, 160, 0, 160, 12, 1, "#3a3634");
      const fl = Math.sin(t * 13) * 0.03;
      disc(g, 160, 16, 24, `rgba(255,200,120,${0.07 + fl})`);
      O(g, 148, 13, 24, 2, "#8a6a3a");
      [150, 156, 164, 170].forEach((x, i) => {
        if (i === 3 && PIANO.candle !== "lustre") { R(g, x - 1, 12, 2, 1, "#5a4a2a"); return; }
        O(g, x - 1, 10, 2, 3, "#f3e3c3"); R(g, x - 1, 8 - (Math.sin(t * 9 + i) > 0 ? 1 : 0), 2, 2, i % 2 ? "#ffd84a" : "#ffb030");
      });
      // pianista
      const px = 50;
      const seated = e < TL.run || e >= TL.sit;
      const playing = e < TL.burn || e >= TL.play;
      if (seated) {
        const startled = e >= TL.notice && e < TL.run;
        const bob = playing && Math.sin(t * 2.2) > 0 ? 1 : 0, jump = startled ? -2 : 0, by = bob + jump;
        const pedal = playing && Math.sin(t * 1.1) > 0.4 ? 1 : 0;
        O(g, px - 6, 100, 4, 14, "#1e1e2a"); O(g, px + 2, 100, 4, 13 + pedal, "#1e1e2a");
        O(g, px - 7, 113, 6, 3, "#1a120e"); O(g, px + 1, 113 + pedal, 6, 3, "#1a120e");
        O(g, px - 3, 109, 8, 1, "#c0902a");
        O(g, px - 10, 79 + by, 4, 5, "#2a2a3a"); O(g, px + 6, 79 + by, 4, 5, "#2a2a3a");
        O(g, px - 7, 78 + by, 14, 20, "#2a2a3a");
        O(g, px - 5, 68 + by, 10, 10, "#3a2418"); R(g, px - 4, 76 + by, 8, 2, "#c08a64");
        O(g, px - 4, 63 + by, 8, 5, "#1e1a1a"); O(g, px - 6, 67 + by, 12, 1, "#1e1a1a");
        const lh = playing ? (Math.sin(t * 5.5) > 0 ? 0 : 2) : 0, rh = playing ? (Math.sin(t * 5.5 + 1.6) > 0 ? 0 : 2) : 0;
        if (startled) {
          limb(g, [[px - 9, 81 + by], [px - 13, 76], [px - 15, 70]], 3, "#2a2a3a", "#c08a64");
          limb(g, [[px + 8, 81 + by], [px + 12, 76], [px + 14, 70]], 3, "#2a2a3a", "#c08a64");
          R(g, px - 1, 50, 2, 7, "#ffd84a"); R(g, px - 1, 58, 2, 2, "#ffd84a");
        } else {
          limb(g, [[px - 9, 81 + by], [px - 12, 84], [px - 16, 81 + lh]], 3, "#2a2a3a", "#c08a64");
          limb(g, [[px + 8, 81 + by], [px + 10, 84], [px + 14, 81 + rh]], 3, "#2a2a3a", "#c08a64");
        }
      } else if (e < TL.gone) runner(g, px + (e - TL.run) * 125, t, true, 1);
      else if (e >= TL.back) runner(g, 345 - (e - TL.back) / (TL.sit - TL.back) * 295, t, false, -1);
      // o chapéu voa na fuga e fica em cima do piano até ele voltar
      if (e >= TL.run && e < TL.sit) {
        const hk = clamp((e - TL.run) / 0.7);
        const hx = Math.round(lerp(50, 66, hk)), hy = Math.round(lerp(63, 49, hk) - Math.sin(hk * Math.PI) * 16);
        O(g, hx - 4, hy, 8, 4, "#1e1a1a"); O(g, hx - 6, hy + 4, 12, 1, "#1e1a1a");
      }
      if (playing && !reduceMotion && Math.random() < dt * 1.1) notes.push({ x: 40 + Math.random() * 30, y: 50, life: 0, ph: Math.random() * 6 });
      notes = notes.filter((n) => (n.life += dt * 0.22) < 1);
      for (const n of notes) {
        const x = Math.round(n.x + n.life * 30 + Math.sin(n.life * 8 + n.ph) * 3), y = Math.round(n.y - n.life * 40);
        g.globalAlpha = 1 - n.life;
        R(g, x + 2, y, 1, 4, "#f3e3c3"); R(g, x, y + 3, 3, 2, "#f3e3c3"); R(g, x + 3, y, 2, 1, "#f3e3c3"); R(g, x + 4, y + 1, 1, 1, "#f3e3c3");
        g.globalAlpha = 1;
      }
      // garçom: passa café, ou sai para trocar o cartaz
      const away = e >= TL.tiaoOut && e < TL.tiaoBack;
      if (away) {
        PIANO.pourT = PIANO.start + TL.tiaoBack;
        O(g, 228, 76, 8, 6, "#f3e3c3"); R(g, 236, 77, 2, 3, K);
        tiao(g, e, t);
      } else {
      const cx = 252, T = 11, ph = ((((t - PIANO.pourT) % T) + T) % T) / T;
      let lift = 0, tilt = 0;
      if (ph < 0.15) lift = ph / 0.15; else if (ph < 0.5) { lift = 1; tilt = Math.min(1, (ph - 0.15) / 0.08); } else if (ph < 0.6) { lift = 1 - (ph - 0.5) / 0.1; } else lift = 0;
      if (ph > 0.43 && ph < 0.5) tilt = 1 - (ph - 0.43) / 0.07;
      const pouring = tilt > 0.6;
      torso(g, cx, 61, barman, 25);
      head(g, cx, 50, { ...barman, look: 1 }, t);
      // xícara no balcão
      O(g, 228, 76, 8, 6, "#f3e3c3"); R(g, 236, 77, 2, 3, K);
      const fill = clamp((ph - 0.2) / 0.28);
      if (ph < 0.6 || ph < 0.98) R(g, 229, 82 - Math.round(fill * 5), 6, Math.round(fill * 5), "#5a3420");
      // braço com o bule
      const hx = lerp(256, 246, lift), hy = lerp(80, 68, lift);
      // entre um café e outro, ele chama o visitante com a mão ("vem cá") e aponta a lousa
      const idle = lift === 0 && ph > 0.62 && !SALOON.playing;
      if (idle) {
        const call = Math.sin(t * 6) > 0 ? 0 : 1;
        limb(g, [[cx - 9, 63], [cx - 15, 60], [cx - 16 + call * 3, 52 + call]], 3, barman.shirt, barman.skin);
      } else if (SALOON.playing) limb(g, [[cx - 9, 63], [cx - 18, 70], [cx - 30, 74]], 3, barman.shirt, barman.skin);
      else limb(g, [[cx - 9, 63], [cx - 12, 72], [cx - 10, 80]], 3, barman.shirt, barman.skin);
      limb(g, [[cx + 8, 63], [cx + 10, 72], [hx, hy]], 3, barman.shirt, barman.skin);
      g.save(); g.translate(hx - 4, hy); g.rotate(-tilt * 0.7);
      O(g, -8, -6, 9, 9, "#8a8682"); R(g, -8, -6, 9, 2, "#b0aca4"); O(g, -12, -3, 4, 2, "#8a8682"); O(g, -6, -8, 5, 2, "#5a5652");
      g.restore();
      if (pouring && lift > 0.9) R(g, 232, 70, 1, 8, "#5a3420");
      // vapor do café
      if (!reduceMotion && ph > 0.5 && Math.random() < 0.3) steam.push({ x: 231 + Math.random() * 3, y: 74, life: 0 });
      steam = steam.filter((s) => (s.life += dt * 0.45) < 1);
      for (const s of steam) R(g, s.x + Math.sin(s.life * 9) * 1.5, s.y - s.life * 16, 1, 1, `rgba(243,239,226,${0.6 * (1 - s.life)})`);
      }
      // a vela volta para o lustre logo depois de acender o papel
      if (PIANO.candle === "burning" && e >= TL.burn + 0.25) { PIANO.retFrom = [PIANO.origin[0], PIANO.origin[1] + 3]; PIANO.retAt = performance.now(); PIANO.candle = "returning"; }
      // o convite do jogo da velha some enquanto o Tião está fora
      const hideInvite = PIANO.state === "seq" || SALOON.playing;
      if (SALOON.invite && SALOON.invite.hidden !== hideInvite) SALOON.invite.hidden = hideInvite;
      if (e >= TL.end) { PIANO.state = "idle"; if (PIANO.onDone) PIANO.onDone(); }
    }
    // lousinha de jogo da velha no balcão, ao lado do bartender
    function after(g, t) {
      O(g, 200, 72, 14, 10, "#2e3a30"); R(g, 200, 72, 14, 1, "#6a4024");
      R(g, 205, 74, 1, 7, "#dcd8c8"); R(g, 209, 74, 1, 7, "#dcd8c8"); R(g, 202, 76, 10, 1, "#dcd8c8"); R(g, 202, 79, 10, 1, "#dcd8c8");
      R(g, 203, 74, 1, 1, "#e8c878"); R(g, 211, 77, 1, 1, "#e8c878"); R(g, 207, 80, 1, 1, "#dcd8c8");
      drawCandle(g, t);
    }
    return { focus: 179, back, front, draw, after };
  })();

  // ---------- VII · Fim da linha (Duelo) ----------
  SCENES.fimdarua = (() => {
    const GY = 112;
    const joao = { skin: "#d6a07a", skinD: "#a8735a", hair: "#2a1a12", curls: true, hat: "#9a6a3c", band: "#5a3820", goatee: "#5a3a2a", shirt: "#1e1a1a", vest: "#7a4a28", scarf: "#a6322a", blinkOff: 0.9 };
    let weedX = -40;
    const forasteiro = { skin: "#c48c64", skinD: "#8a5c40", hair: "#2a1e18", hairH: 2, beard: "#3a2a22", brow: "#1b120d", hat: "#2c2421", band: "#3e2e28", shirt: "#3c3230", scarf: "#8a2a22", blinkOff: 1.7 };
    // pistoleiro de frente; side = para que lado ele atira (+1 direita, -1 esquerda)
    function gunslinger(g, cx, P, side, hasHat, shooting, tense, t, coat) {
      const pants = P.pants || "#2e2826", boot = P.boot || "#1e1612";
      O(g, cx - 6, 92, 5, 20, pants); O(g, cx + 1, 92, 5, 20, pants);
      R(g, cx - 6, 108, 5, 4, boot); R(g, cx + 1, 108, 5, 4, boot);
      if (P.skirt) { for (let y = 89; y < 109; y++) { const w = 7 + Math.floor((y - 89) / 5); R(g, cx - w - 1, y, w * 2 + 2, 1, K); R(g, cx - w, y, w * 2, 1, y > 105 ? shade(P.skirt, 0.8) : P.skirt); } }
      if (coat) { O(g, cx - 8, 88, 3, 12, P.coatD || "#26201e"); O(g, cx + 5, 88, 3, 12, P.coatD || "#26201e"); }
      // cabeleira volumosa e rabo de cavalo ficam atrás da cabeça
      if (P.bigHair) { disc(g, cx, 66, 10, K); disc(g, cx, 66, 9, P.hair); disc(g, cx - 6, 70, 6, K); disc(g, cx - 6, 70, 5, P.hair); disc(g, cx + 6, 70, 6, K); disc(g, cx + 6, 70, 5, P.hair); R(g, cx - 5, 59, 3, 1, shade(P.hair, 1.15)); }
      if (P.ponytail) { O(g, cx + 4, 64, 3, 15, P.hair); R(g, cx + 4, 66, 3, 1, P.tie || "#e8c050"); }
      torso(g, cx, 74, P, 19);
      if (P.shawl) { R(g, cx - 8, 74, 16, 4, P.shawl); for (let i = 0; i < 5; i++) R(g, cx - 6 + i, 78 + i, 12 - i * 2, 1, P.shawl); }
      if (P.bandoleer) { for (let i = 0; i < 14; i++) { R(g, cx - 6 + i, 75 + i, 2, 2, P.bandoleer); if (i % 3 === 0) R(g, cx - 6 + i, 75 + i, 1, 1, "#e8c878"); } }
      if (!P.skirt) { R(g, cx - 7, 90, 14, 2, "#1e1612"); R(g, cx - 1, 90, 2, 2, "#c0b090"); }
      const hx = cx + side * 7;
      if (!P.weaponDraw) O(g, hx - 1, 91, 3, 6, "#5a3820");
      const customHat = P.hatStyle === "halfmoon";
      head(g, cx, 63, { ...P, hat: hasHat && !customHat ? P.hat : null, look: 1 }, t);
      if (customHat && hasHat) {
        // chapéu de couro em meia-lua, com a estrela na frente
        [[0, 5], [1, 8], [2, 10], [3, 11], [4, 12]].forEach(([dy, w]) => { R(g, cx - w - 1, 57 + dy, w * 2 + 2, 1, K); R(g, cx - w, 57 + dy, w * 2, 1, dy === 4 ? shade(P.hat, 0.75) : P.hat); });
        R(g, cx - 1, 58, 2, 2, P.star || "#e8c050");
      }
      if (!hasHat && !P.bigHair) { R(g, cx - 5, 62, 10, 3, P.hair); if (P.curls) { R(g, cx - 6, 61, 3, 3, P.hair); R(g, cx - 1, 60, 3, 3, P.hair); R(g, cx + 3, 61, 3, 3, P.hair); } }
      if (P.weaponDraw) { P.weaponDraw(g, cx); return; }
      const off = side < 0 ? 8 : -9, gunSh = side < 0 ? -9 : 8;
      // braço livre, solto ao lado do corpo
      limb(g, [[cx + off, 77], [cx + off * 1.25, 84], [cx + off * 1.15, 91]], 3, P.shirt, P.skin);
      if (shooting) {
        limb(g, [[cx + gunSh, 77], [cx + side * 16, 78], [cx + side * 24, 78]], 3, P.shirt, P.skin);
        O(g, side > 0 ? cx + 24 : cx - 31, 76, 7, 2, P.gun || "#6a6662"); R(g, side > 0 ? cx + 24 : cx - 30, 78, 2, 3, "#5a3820");
      } else {
        const tw = (tense ? Math.round(Math.sin(t * 9)) : 0) - (side < 0 && performance.now() - DUEL.twitchAt < 280 ? 3 : 0);
        limb(g, [[cx + gunSh, 77], [cx + gunSh * 1.3, 84], [hx + side * 2, 89 + tw]], 3, P.shirt, P.skin);
        R(g, hx, 89, 2, 2, P.gun || "#6a6662");
      }
    }
    // o duelista do visitante é o personagem escolhido na tela inicial
    function duelHero() {
      const H = (window.VILA_HEROES || {})[window.VILA_HERO];
      if (!H || H.id === "pistoleiro") return { ...forasteiro, flyHat: forasteiro.hat, weapon: "revolver" };
      return {
        skin: H.skin, skinD: H.skinD, hair: H.hair, hairH: 2, brow: H.brow || "#1b120d",
        beard: H.facial === "beard" ? H.facialColor : null, stache: H.facial === "stache" ? H.facialColor : null,
        goatee: H.facial === "stubble" ? H.facialColor : null,
        hat: H.hat, hatStyle: H.hatStyle, band: H.band, star: H.star,
        shirt: H.coat || H.shirt, vest: H.vest, scarf: H.scarf, coatD: H.coat ? shade(H.coat, 0.75) : null,
        pants: H.pants, boot: H.boot, skirt: H.skirt, shawl: H.shawl, bandoleer: H.bandoleer,
        bigHair: H.hairStyle === "big", ponytail: H.hairStyle === "ponytail", tie: H.tie,
        glasses: H.glasses, blinkOff: 1.7, coat: !!H.coat, flyHat: H.hat || null, weapon: H.weapon || "revolver",
      };
    }
    // ---- armas do visitante: cada personagem luta do seu jeito ----
    const ROPE = "#c8a060", ROPE_D = "#8a6a3a";
    function ellipsePts(g, cx, cy, rx, ry, col, phase, step = 0.3) {
      for (let a = 0; a < Math.PI * 2; a += step) R(g, Math.round(cx + Math.cos(a + phase) * rx), Math.round(cy + Math.sin(a + phase) * ry), 1, 1, col);
    }
    function ropeLine(g, x0, y0, x1, y1, sag = 3) {
      const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag), 1, 1, i % 4 === 0 ? ROPE_D : ROPE); }
    }
    function pistol(g, x, y, col) { O(g, x, y, 7, 2, col); R(g, x, y + 2, 2, 3, "#5a3820"); }
    function muzzle(g, x, y, big) { disc(g, x, y, big ? 6 : 4, "#fff6c0"); disc(g, x, y, big ? 3 : 2, "#ffffff"); }
    function smoke(g, x, y, k) { for (let i = 0; i < 5; i++) { const s = clamp(k * 1.2 - i * 0.12); if (s <= 0 || s >= 1) continue; R(g, Math.round(x + s * 12 + i), Math.round(y - s * 10 - i), 2, 2, `rgba(220,214,200,${0.55 * (1 - s)})`); } }
    function rollingPin(g, x, y, ang) {
      g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang);
      O(g, -6, -1, 12, 3, "#c89a5a"); R(g, -5, -1, 10, 1, "#e0b878"); R(g, -9, 0, 3, 1, "#8a5a2a"); R(g, 6, 0, 3, 1, "#8a5a2a");
      g.restore();
    }
    function rifleLine(g, x0, y0, x1, y1, metal) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k)), 1, 2, k < 0.36 ? "#7a4a28" : k < 0.48 ? "#3a3634" : metal); }
    }
    function playerWeapon(g, cx, P, A, t) {
      const now = performance.now(), since = now - A.at;
      const arm = (pts) => limb(g, pts, 3, P.shirt, P.skin);
      const metal = P.gun || "#6a6662";
      const tw = A.mode === "wait" || A.mode === "draw" ? Math.round(Math.sin(t * 9)) : 0;
      const idleLeft = () => arm([[cx - 9, 77], [cx - 11, 84], [cx - 10, 91]]);
      if (A.weapon === "twin") {
        // dois coldres; no saque as duas pistolas sobem juntas, cada uma com o seu disparo
        O(g, cx - 9, 91, 3, 6, "#5a3820"); O(g, cx + 6, 91, 3, 6, "#5a3820");
        if (!A.shots.length) {
          arm([[cx - 9, 77], [cx - 11, 84], [cx - 9, 89 + tw]]); arm([[cx + 8, 77], [cx + 10, 84], [cx + 8, 89 - tw]]);
          R(g, cx - 9, 89, 2, 2, metal); R(g, cx + 7, 89, 2, 2, metal);
          return;
        }
        arm([[cx - 9, 78], [cx + 4, 84], [cx + 20, 82]]); pistol(g, cx + 20, 80, metal);
        arm([[cx + 8, 77], [cx + 16, 77], [cx + 24, 76]]); pistol(g, cx + 24, 74, metal);
        A.shots.forEach((s) => { const d = now - s.at; if (d < 150) muzzle(g, s.side === "R" ? cx + 33 : cx + 29, s.side === "R" ? 75 : 81); else if (d < 900) smoke(g, s.side === "R" ? cx + 32 : cx + 28, s.side === "R" ? 73 : 79, d / 900); });
        return;
      }
      if (A.weapon === "lasso") {
        idleLeft();
        if (A.mode === "spin") {
          // girando o laço por cima da cabeça: quanto mais tempo, mais rápido
          arm([[cx + 8, 77], [cx + 11, 67], [cx + 12, 58]]);
          const ph = (now / 1000) * (7 + A.charge * 12);
          ellipsePts(g, cx + 12, 51, 11, 3, ROPE, ph, 0.26);
          ropeLine(g, cx + 12, 58, Math.round(cx + 12 + Math.cos(ph) * 11), Math.round(51 + Math.sin(ph) * 3), 0);
          if (Math.sin(now / 70) > 0.3) R(g, Math.round(cx + 12 + Math.cos(ph + 1) * 13), 50, 2, 1, "rgba(255,255,255,0.6)");
          return;
        }
        if (A.mode === "throw" || A.mode === "caught" || A.mode === "fall") {
          arm([[cx + 8, 77], [cx + 16, 72], [cx + 22, 70]]);
          const k = clamp(since / 420), ek = 1 - (1 - k) * (1 - k);
          const tx = A.mode === "fall" ? 168 : 214, ty = A.mode === "fall" ? 110 : 82;
          const lx = lerp(cx + 22, tx, ek), ly = lerp(58, ty, ek) - Math.sin(k * Math.PI) * 18;
          ropeLine(g, cx + 22, 70, Math.round(lx), Math.round(ly), A.mode === "fall" ? 6 : 3);
          if (A.mode === "caught" && k >= 1) {
            // laçado: duas voltas de corda prendem os braços do João, e ele balança
            const wob = Math.round(Math.sin(now / 90) * 1);
            ellipsePts(g, 214 + wob, 80, 10, 2, ROPE, 0, 0.18); ellipsePts(g, 214 + wob, 86, 10, 2, ROPE, 1.1, 0.18);
            if (since < 700) for (let i = 0; i < 6; i++) R(g, 214 + Math.round(Math.cos(i) * (6 + since / 60)), 82 + Math.round(Math.sin(i) * (2 + since / 200)), 1, 1, "#fff6c0");
          } else ellipsePts(g, Math.round(lx), Math.round(ly), lerp(11, 7, k), lerp(3, 4, k), ROPE, k * 7, 0.28);
          return;
        }
        // laço enrolado na cintura
        arm([[cx + 8, 77], [cx + 10, 84], [cx + 10, 90 - tw]]);
        ellipsePts(g, cx + 11, 93, 4, 3, ROPE, 0, 0.35); ellipsePts(g, cx + 11, 93, 3, 2, ROPE_D, 0.5, 0.45);
        return;
      }
      if (A.weapon === "pin") {
        if (A.mode === "wind") {
          // tomando impulso: o rolo sobe, treme mais a cada toque e sai fumaça da cabeça
          const sh = Math.round(Math.sin(now / 35) * (1 + A.charge * 2.5));
          arm([[cx - 9, 77], [cx - 13, 67], [cx - 7 + sh, 56]]); arm([[cx + 8, 77], [cx + 12, 67], [cx + 6 + sh, 56]]);
          rollingPin(g, cx + sh, 55, 0);
          if (A.charge > 0.35) for (let i = 0; i < 3; i++) { const s = ((now / 500) + i / 3) % 1; R(g, cx - 7 + i * 6, Math.round(52 - s * 12), 2, 2, `rgba(255,255,255,${0.75 * (1 - s)})`); }
          if (A.charge > 0.65) { R(g, cx - 4, 66, 2, 1, "#c0392b"); R(g, cx + 2, 66, 2, 1, "#c0392b"); }
          return;
        }
        if (A.mode === "throw") {
          idleLeft(); arm([[cx + 8, 77], [cx + 16, 70], [cx + 22, 66]]);
          const k = clamp(since / 360);
          if (k < 1) rollingPin(g, lerp(cx + 22, 211, k), lerp(62, 60, k) - Math.sin(k * Math.PI) * 14, k * 14);
          else {
            // PLAFT: o rolo quica de volta e cai; estrelinhas girando na cabeça do João
            const k2 = clamp((since - 360) / 650);
            rollingPin(g, lerp(207, 186, k2), lerp(58, 110, k2 * k2), 14 + k2 * 7);
            if (since - 360 < 240) { disc(g, 214, 60, 7, "#fff6c0"); [[-11, 0], [11, 0], [0, -11], [0, 11], [-8, -8], [8, 8], [-8, 8], [8, -8]].forEach(([dx, dy]) => R(g, 214 + dx, 60 + dy, 2, 2, "#f6d870")); }
            for (let i = 0; i < 3; i++) { const a = now / 240 + i * 2.1; R(g, Math.round(214 + Math.cos(a) * 9), Math.round(55 + Math.sin(a) * 2), 2, 2, i % 2 ? "#f6d870" : "#ffffff"); }
          }
          return;
        }
        if (A.mode === "drop") {
          idleLeft(); arm([[cx + 8, 77], [cx + 10, 84], [cx + 10, 91]]);
          const k = clamp(since / 500); rollingPin(g, cx + 14, lerp(88, 110, k * k), k * 2);
          return;
        }
        // o rolo de amassar pão nas duas mãos, batendo de leve na palma
        const tap = Math.sin(t * 4) > 0.6 ? 1 : 0;
        arm([[cx - 9, 77], [cx - 8, 84], [cx - 4, 88 + tw + tap]]); arm([[cx + 8, 77], [cx + 8, 84], [cx + 4, 88 + tw]]);
        rollingPin(g, cx, 88 + tw + tap, 0);
        return;
      }
      if (A.weapon === "rifle") {
        if (A.mode === "cock" || A.mode === "aim" || A.mode === "fire") {
          // rifle no ombro: engatilha, a mira balança e dispara com coice e fumaça
          const sway = A.mode === "aim" ? Math.round(Math.sin(now / 150)) : 0;
          const recoil = A.mode === "fire" && since < 170 ? -3 : 0;
          arm([[cx - 9, 77], [cx + 2, 81], [cx + 13 + recoil, 77 + sway]]); arm([[cx + 8, 77], [cx + 5, 80], [cx + 2 + recoil, 76 + sway]]);
          rifleLine(g, cx - 3 + recoil, 75 + sway, cx + 31 + recoil, 75 + sway, metal);
          if (A.mode === "cock" && since < 280) { R(g, cx + 9, 77 + sway + (since < 140 ? 2 : 0), 3, 3, "#3a3634"); if (since > 120) R(g, cx + 12, 71, 2, 1, "#fff6c0"); }
          if (A.mode === "fire") {
            if (since < 190) { muzzle(g, cx + 35, 75, true); g.fillStyle = "rgba(255,248,220,0.4)"; g.fillRect(0, 0, SW, SH); }
            smoke(g, cx + 33, 72, since / 1100);
          }
          return;
        }
        arm([[cx - 9, 77], [cx - 6, 86], [cx - 2, 91 + tw]]); arm([[cx + 8, 77], [cx + 10, 82], [cx + 8, 79 + tw]]);
        rifleLine(g, cx - 6, 97, cx + 12, 73, metal);
        return;
      }
    }
    DUEL.hero = duelHero;
    function duelists(g, t, dt) {
      const since = performance.now() - DUEL.shotAt;
      const youShoot = DUEL.phase === "you", joaoShoot = DUEL.phase === "joao";
      const tense = DUEL.phase === "wait" || DUEL.phase === "draw";
      // o João primeiro: assim o laço, o rolo e os tiros do visitante passam por cima dele
      gunslinger(g, 214, joao, -1, DUEL.hat.joao, joaoShoot, tense, t, false);
      const me = duelHero();
      const P = hasGun() ? { ...me, gun: "#e8b030" } : { ...me };
      DUEL.anim.weapon = me.weapon;
      if (me.weapon !== "revolver") P.weaponDraw = (gg, cx) => playerWeapon(gg, cx, P, DUEL.anim, t);
      gunslinger(g, 110, P, 1, DUEL.hat.you, youShoot && me.weapon === "revolver", tense, t, me.coat !== false);
      if (DUEL.phase === "draw") { [110, 214].forEach((x) => { R(g, x - 1, 46, 2, 5, "#c0392b"); R(g, x - 1, 52, 2, 2, "#c0392b"); }); }
      if (since < 160 && ((youShoot && me.weapon === "revolver") || joaoShoot)) {
        const mx = youShoot ? 141 : 183;
        disc(g, mx, 77, 4, "#fff6c0"); disc(g, mx, 77, 2, "#ffffff");
        g.fillStyle = "rgba(255,248,220,0.35)"; g.fillRect(0, 0, SW, SH);
      }
      DUEL.flying.forEach((h) => {
        if (h.y < h.ground) { h.x += h.vx * dt * 60; h.y += h.vy * dt * 60; h.vy += 0.14 * dt * 60; h.r += h.vx * 0.12 * dt * 60; } else h.y = h.ground;
        g.save(); g.translate(Math.round(h.x), Math.round(h.y)); g.rotate(h.r);
        O(g, -8, -1, 16, 1, h.col); O(g, -4, -5, 8, 4, h.col);
        g.restore();
      });
    }
    function back(g) {
      const sky = ["#2e2440", "#4a2e4a", "#7a3a4a", "#a8503e", "#d8703e", "#f2a65a", "#f6c47a"];
      sky.forEach((c, i) => R(g, 0, i * 12, SW, 12, c));
      R(g, 0, 84, SW, 28, "#f6c47a");
      disc(g, 80, 96, 16, "#ffe0a0"); disc(g, 80, 96, 13, "#fff3c8");
      // serra
      g.fillStyle = "#6a3a4a";
      for (let x = 0; x < SW; x++) { const h = 14 + Math.round(Math.sin(x * 0.04) * 6 + Math.sin(x * 0.013 + 2) * 8); g.fillRect(x, 98 - h, 1, h + 14); }
      g.fillStyle = "#8a4a48";
      for (let x = 0; x < SW; x++) { const h = 6 + Math.round(Math.sin(x * 0.07 + 1) * 3 + Math.sin(x * 0.02) * 4); g.fillRect(x, 104 - h, 1, h + 8); }
      R(g, 0, GY - 6, SW, SH - GY + 6, "#c89458");
      R(g, 0, GY + 8, SW, SH - GY, "#b07a48");
      seed = 12; for (let i = 0; i < 160; i++) R(g, Math.floor(rnd() * SW), GY - 6 + Math.floor(rnd() * 44), 2, 1, rnd() < 0.5 ? "#a86e40" : "#d8a468");
      // varanda do saloon à direita
      O(g, 228, 26, 92, 6, "#6e3e22");
      R(g, 232, 32, 88, 76, "#8a3a22"); for (let x = 236; x < SW; x += 6) R(g, x, 32, 1, 76, "#6e2a18");
      O(g, 262, 60, 24, 48, "#3a1e10"); R(g, 264, 70, 9, 12, "#8a5a34"); R(g, 275, 70, 9, 12, "#8a5a34");
      O(g, 240, 46, 14, 12, "#2b2420"); R(g, 241, 47, 12, 11, "rgba(255,200,100,0.5)");
      O(g, 224, 104, 96, 6, "#9a6a40");
      // poste de lampião
      O(g, 56, 52, 3, 60, "#3a3634"); O(g, 52, 50, 11, 2, "#3a3634");
      // mourão onde o João se encosta
      O(g, 186, 72, 5, 40, "#6e4426"); R(g, 186, 72, 2, 40, "#8a5a34");
      O(g, 150, 80, 60, 3, "#8a5a34"); O(g, 152, 83, 3, 29, "#6e4426");
    }
    function draw(g, t, dt) {
      // estrelas aparecendo
      [[20, 8], [52, 20], [96, 6], [140, 16], [180, 4], [214, 14], [300, 8], [262, 20], [120, 28]].forEach(([x, y], i) => {
        if (Math.sin(t * 1.4 + i * 2.1) > -0.3) R(g, x, y, 1, 1, "#fff3d6");
      });
      // lampião com mariposas
      const fl = 0.18 + Math.sin(t * 11) * 0.03;
      disc(g, 57, 56, 16, `rgba(255,210,130,${fl})`);
      O(g, 53, 52, 9, 9, "#3a3634"); R(g, 55, 54, 5, 5, Math.sin(t * 15) > 0 ? "#ffd84a" : "#ffc040");
      for (let i = 0; i < 3; i++) R(g, 57 + Math.cos(t * (2 + i) + i) * 9, 56 + Math.sin(t * (3 + i) + i * 2) * 7, 1, 1, "#f3e3c3");
      // o sino do saloon (balança quando toca no duelo)
      const sinceBell = performance.now() - DUEL.bellAt;
      const bsw = sinceBell < 1600 ? Math.round(Math.sin(sinceBell / 70) * 3 * (1 - sinceBell / 1600)) : 0;
      seg(g, 238, 32, 238 + bsw, 36, 1, "#3a3634"); O(g, 235 + bsw, 36, 6, 5, "#c0902a"); R(g, 237 + bsw, 41, 2, 1, "#8a6a3a");
      if (DUEL.on) { duelists(g, t, dt); }
      else {
        // João encostado, braços cruzados, respirando
        const cx = 196, breathe = Math.sin(t * 1.5) > 0.4 ? 1 : 0;
        O(g, cx - 6, 92, 5, 20, "#3a3230"); O(g, cx + 1, 92, 5, 20, "#3a3230");
        R(g, cx - 6, 108, 5, 4, "#2a1e18"); R(g, cx + 1, 108, 5, 4, "#2a1e18");
        torso(g, cx, 74 + breathe, joao, 19);
        const tip = (t % 9) > 7.6 && (t % 9) < 8.6;
        head(g, cx, tip ? 64 : 63 + breathe, { ...joao, look: 1 }, t);
        limb(g, [[cx - 9, 77 + breathe], [cx - 8, 84], [cx + 5, 84]], 3, joao.shirt, joao.skin);
        if (tip) limb(g, [[cx + 8, 77], [cx + 10, 70], [cx + 6, 60]], 3, joao.shirt, joao.skin);
        else limb(g, [[cx + 8, 77 + breathe], [cx + 8, 85], [cx - 5, 86]], 3, joao.shirt, joao.skin);
        const fl2 = Math.round(Math.sin(t * 5) * 1.5);
        R(g, cx + 3, 78 + breathe, 2, 3, joao.scarf); R(g, cx + 5 + fl2, 80 + breathe, 2, 2, joao.scarf);
      }
      // bola de feno
      weedX += dt * 16;
      if (weedX > SW + 40) weedX = -60 - Math.random() * 120;
      const wy = GY + 10 - Math.abs(Math.sin(weedX * 0.08)) * 4;
      disc(g, weedX, wy, 5.5, "#5a4024"); disc(g, weedX, wy, 4.5, "#9a7a44");
      for (let i = 0; i < 4; i++) { const a = weedX * 0.15 + i * 1.6; R(g, weedX + Math.cos(a) * 3, wy + Math.sin(a) * 3, 1, 1, "#5a4024"); }
    }
    return { focus: 180, back, draw };
  })();

  // ================= Montagem, tamanho e laço das cenas =================
  const live = [], pins = [];
  document.querySelectorAll(".scene[data-scene]").forEach((fig) => {
    const def = SCENES[fig.dataset.scene];
    const canvas = fig.querySelector("canvas");
    const ctx = canvas.getContext("2d");
    const [bc, bg] = makeCanvas(SW, SH); def.back(bg);
    let fc = null;
    if (def.front) { const [c2, g2] = makeCanvas(SW, SH); def.front(g2); fc = c2; }
    const [wc, wg] = makeCanvas(SW, SH);
    live.push({ id: fig.dataset.scene, fig, def, canvas, ctx, bc, fc, wc, wg, visible: false, t: 0, W: SW, camX: 0, drawn: false });
  });
  function sizeScenes() {
    for (const s of live) {
      const cw = Math.max(160, s.fig.clientWidth - 12);
      const scale = clamp(Math.ceil(cw / SW), 1, 6);
      const W = Math.min(SW, Math.floor(cw / scale));
      s.W = W; s.scale = scale;
      s.camX = Math.round(clamp(s.def.focus - W / 2, 0, SW - W));
      s.canvas.width = W; s.canvas.height = SH;
      s.canvas.style.width = W * scale + "px"; s.canvas.style.height = SH * scale + "px";
      s.ctx.imageSmoothingEnabled = false;
      s.drawn = false;
    }
    placeLayers();
  }
  function paint(s, t, dt) {
    const g = s.wg;
    g.clearRect(0, 0, SW, SH);
    g.drawImage(s.bc, 0, 0);
    s.def.draw(g, t, dt);
    if (s.fc) g.drawImage(s.fc, 0, 0);
    if (s.def.after) s.def.after(g, t, dt);
    drawCoin(g, s, t);
    s.ctx.drawImage(s.wc, s.camX, 0, s.W, SH, 0, 0, s.W, SH);
    s.drawn = true;
  }
  // a cena só anda quando boa parte dela está na tela
  const visObs = new IntersectionObserver((entries) => entries.forEach((e) => {
    const s = live.find((x) => x.fig === e.target);
    if (s) s.visible = e.isIntersecting && e.intersectionRatio >= 0.45;
  }), { threshold: [0, 0.45, 0.7, 1] });
  live.forEach((s) => visObs.observe(s.fig));
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!site.hidden) {
      for (const s of live) {
        const acting = s.id === "saloon" && (PIANO.state === "seq" || PIANO.candle !== "lustre");
        if (reduceMotion && !acting) { if (!s.drawn) paint(s, 2.5, 0); continue; }
        if (s.visible) { s.t += dt; paint(s, s.t, dt); }
        else if (!s.drawn) paint(s, s.t, 0);
      }
    }
    requestAnimationFrame(loop);
  }
  window.addEventListener("resize", () => { if (!site.hidden) sizeScenes(); });
  // usado só para conferir as animações em momentos específicos do ciclo
  window.vilaTime = (id) => { const x = live.find((l) => l.id === id); return x ? x.t : -1; };
  window.vilaSeek = (id, s) => { const x = live.find((l) => l.id === id); if (x) { x.t = s; x.drawn = false; } };
  document.addEventListener("vila:hero", () => { saveProgress(); live.forEach((s) => { s.drawn = false; }); });
  window.vilaPiano = () => ({ state: PIANO.state, candle: PIANO.candle, start: PIANO.start, word: PIANO.word && { ...PIANO.word } });
  requestAnimationFrame(loop);

  // ================= Camada sobre as cenas: balões e painéis presos a um ponto do cenário =================
  function sceneOf(id) { return live.find((l) => l.id === id); }
  function layerOf(id) {
    const s = sceneOf(id);
    if (!s.layer) { s.layer = document.createElement("div"); s.layer.className = "scene-layer"; s.fig.appendChild(s.layer); }
    return s.layer;
  }
  // prende um elemento a uma coordenada da cena (em pixels da arte, 320 × 150)
  function pin(id, el, x, y) { layerOf(id).appendChild(el); pins.push({ s: sceneOf(id), el, x, y }); placeLayers(); }
  function placeLayers() {
    for (const s of live) {
      if (!s.layer || !s.scale) continue;
      const c = s.canvas;
      Object.assign(s.layer.style, { left: c.offsetLeft + c.clientLeft + "px", top: c.offsetTop + c.clientTop + "px", width: s.W * s.scale + "px", height: SH * s.scale + "px" });
    }
    for (const p of pins) {
      const s = p.s; if (!s.scale) continue;
      const x = clamp(p.x, s.camX + 34, s.camX + s.W - 34);
      p.el.style.left = (x - s.camX) * s.scale + "px"; p.el.style.top = p.y * s.scale + "px";
    }
  }
  function sayButton(text, label) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "say"; b.textContent = text; if (label) b.setAttribute("aria-label", label);
    return b;
  }

  // ================= Segredos: moedas escondidas e o revólver do Xavier =================
  // escondidas em lugares do cenário: na vitrine, nas brasas, no relógio, entre os potes...
  const COINS = { armeiro: [163, 104], ferraria: [262, 92], delegacia: [176, 12], telegrafo: [178, 78], escola: [190, 105], saloon: [245, 53], fimdarua: [247, 53] };
  const COIN_IDS = Object.keys(COINS);
  const GUN_PRICE = COIN_IDS.length;
  const SECRETS_TOTAL = COIN_IDS.length + 2;
  // o progresso fica no navegador e, para quem está logado, também na conta (sobrevive a recarregar e reabrir)
  const progress = { coins: [], gun: false, piano: false };
  function readLocal() {
    try { const p = JSON.parse(safeGet("vila-progresso") || "null"); if (p) return p; } catch { /* segue */ }
    let coins = [];
    try { coins = JSON.parse(safeGet("vila-moedas") || "[]"); } catch { coins = []; }
    return { coins, gun: safeGet("vila-revolver") === "1" };
  }
  function absorb(p) {
    if (!p) return;
    const coins = new Set(progress.coins);
    (Array.isArray(p.coins) ? p.coins : []).forEach((id) => { if (COINS[id]) coins.add(id); });
    progress.coins = [...coins];
    progress.gun = progress.gun || p.gun === true;
    progress.piano = progress.piano || p.piano === true;
    if (p.hero && !progress.hero) progress.hero = p.hero;
  }
  absorb(readLocal());
  let remote = null;
  function saveProgress() {
    if (window.VILA_HERO) progress.hero = window.VILA_HERO;
    const body = { coins: progress.coins.slice(), gun: progress.gun, piano: progress.piano, hero: progress.hero || null };
    safeSet("vila-progresso", JSON.stringify(body));
    if (remote) remote.set({ ...body, at: Date.now() }).catch(() => { /* só leitura ou sem rede: fica no navegador */ });
  }
  (async () => {
    try {
      if (!window.claude || typeof window.claude.use !== "function") return;
      const [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      const ref = db.doc("data/users/" + id + "/vila");
      const snap = await ref.get();
      const r = snap.exists ? snap.data() : null;
      if (r) absorb(r);
      remote = ref;
      // quem trocou de aparelho reencontra o personagem que escolheu
      let localHero = null;
      try { localHero = localStorage.getItem("vila-heroi"); } catch { localHero = null; }
      if (!localHero && r && r.hero && window.VILA_HEROES && window.VILA_HEROES[r.hero]) { window.VILA_HERO = r.hero; try { localStorage.setItem("vila-heroi", r.hero); } catch { /* segue */ } }
      // só grava na conta quando o navegador sabia de algo que a conta ainda não tinha
      const same = r && JSON.stringify([...(r.coins || [])].sort()) === JSON.stringify([...progress.coins].sort()) && !!r.gun === progress.gun && !!r.piano === progress.piano && (r.hero || null) === (window.VILA_HERO || null);
      if (same) safeSet("vila-progresso", JSON.stringify(progress)); else saveProgress();
      live.forEach((s) => { s.drawn = false; });
      hudUpdate();
    } catch { /* sem a conta: segue com o que está no navegador */ }
  })();
  const hasGun = () => progress.gun;
  const coinCount = () => progress.coins.length;
  const allCoins = () => coinCount() === COIN_IDS.length;
  const secretsFound = () => coinCount() + (progress.gun ? 1 : 0) + (progress.piano ? 1 : 0);
  const coinHud = document.getElementById("coin-hud"), secretsBtn = document.getElementById("secrets-btn");
  function hudUpdate() {
    document.getElementById("secrets-count").textContent = `${secretsFound()}/${SECRETS_TOTAL}`;
    coinHud.classList.toggle("done", secretsFound() === SECRETS_TOTAL);
  }
  // o contador não dá dicas: quem fala é o xerife
  secretsBtn.addEventListener("click", () => {
    if (secretsFound() === SECRETS_TOTAL) GUIDE.say("Achou tudo que tinha escondido por aqui? Tá mais esperto que eu, sô!");
    else if (allCoins() && !progress.gun) GUIDE.say("Ora, ora... Parece que seus bolsos tão cheios agora! Acho que já dá pra comprar um revórvi com o Xavier, não?");
    else GUIDE.say("Tá procurando os segredos da região, é? Fique de olho... Às vezes as coisas mais estranhas tão bem debaixo do nosso nariz!");
  });
  function coinOn(s) { return COINS[s.id] && !progress.coins.includes(s.id) && !(s.id === "fimdarua" && DUEL.on); }
  // o revólver aprimorado fica no balcão do armeiro, discreto, com a etiqueta de preço
  const GUN_SPOT = { x0: 96, x1: 134, y0: 70, y1: 88 };
  function drawCoin(g, s, t) {
    if (coinOn(s)) {
      const [x, y] = COINS[s.id];
      disc(g, x, y, 3, K); disc(g, x, y, 2, "#e8b030"); R(g, x - 1, y - 1, 1, 1, "#fff0b0");
      if ((t % 5.2) < 0.16) sparkle(g, x + 2, y - 2, 1);
    }
    if (s.id === "armeiro" && !progress.gun) {
      O(g, 98, 81, 24, 3, "#5a2626");
      revolver(g, 100, 75, "#c89a3a", "#4a2a1a");
      seg(g, 121, 77, 124, 79, 1, "#c8a870"); O(g, 123, 78, 9, 7, "#f3e3c3");
      disc(g, 126, 81, 1, "#c0902a"); tinyText(g, String(GUN_PRICE), 130, 79, "#8a2a20");
      if ((t % 6.4) < 0.14) sparkle(g, 108, 75, 1);
    }
  }
  // converte o clique em coordenadas da arte (320 × 150)
  function toScene(s, e) {
    const r = s.canvas.getBoundingClientRect();
    return [s.camX + (e.clientX - r.left - s.canvas.clientLeft) / s.scale, (e.clientY - r.top - s.canvas.clientTop) / s.scale];
  }
  function coinAt(s, e) {
    if (!coinOn(s) || !s.scale) return false;
    const [lx, ly] = toScene(s, e), [x, y] = COINS[s.id];
    return Math.hypot(lx - x, ly - y) < 7;
  }
  function gunAt(s, e) {
    if (s.id !== "armeiro" || progress.gun || !s.scale) return false;
    const [lx, ly] = toScene(s, e);
    return lx > GUN_SPOT.x0 && lx < GUN_SPOT.x1 && ly > GUN_SPOT.y0 && ly < GUN_SPOT.y1;
  }
  function buyGun(s) {
    if (!allCoins()) {
      const falta = GUN_PRICE - coinCount();
      GUIDE.say(`Esse aí é o revórvi aprimorado do Xavier. Custa ${GUN_PRICE} moedas de ouro, e ainda falta${falta > 1 ? "m" : ""} ${falta}. Procura mais, sô!`);
      return;
    }
    progress.gun = true; saveProgress(); s.drawn = false; hudUpdate();
    coinHud.classList.remove("got"); void coinHud.offsetWidth; coinHud.classList.add("got");
    GUIDE.say("Negócio fechado! Com esse revórvi, as faixas vermelhas do duelo também valem. Agora sim, hein?");
  }
  live.forEach((s) => {
    if (!COINS[s.id]) return;
    s.canvas.addEventListener("pointermove", (e) => { s.canvas.style.cursor = coinAt(s, e) || gunAt(s, e) ? "pointer" : ""; });
    s.canvas.addEventListener("pointerdown", (e) => {
      if (gunAt(s, e)) { e.stopPropagation(); buyGun(s); return; }
      if (!coinAt(s, e)) return;
      e.stopPropagation();
      progress.coins.push(s.id); saveProgress();
      s.canvas.style.cursor = ""; s.drawn = false; hudUpdate();
      coinHud.classList.remove("got"); void coinHud.offsetWidth; coinHud.classList.add("got");
      if (allCoins() && !progress.gun) GUIDE.say("Ora, ora... Parece que seus bolsos tão cheios agora! Acho que já dá pra comprar um revórvi com o Xavier, não?");
    });
  });
  hudUpdate();
  // reset controlado: esconde tudo de novo (moedas, revólver e segredos), no navegador e na conta
  const PROGRESS_KEYS = ["vila-progresso", "vila-moedas", "vila-revolver"];
  function resetSecrets() {
    progress.coins = []; progress.gun = false; progress.piano = false;
    PROGRESS_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } });
    if (remote) remote.set({ coins: [], gun: false, piano: false, at: Date.now() }).catch(() => { /* só leitura */ });
    live.forEach((s) => { s.drawn = false; });
    hudUpdate();
  }
  document.getElementById("reset-secrets").addEventListener("click", () => {
    GUIDE.ask("Quer que eu esconda tudo de novo? As moedas, o revórvi do Xavier e os segredos voltam pro lugar.", "Sim, esconder tudo", () => {
      resetSecrets();
      GUIDE.say("Pronto! Escondi tudo de novo. Boa caçada, forasteiro!");
    });
  });

  // ================= Segredo do Saloon: a vela do lustre e o aviso do pianista =================
  (function candleSecret() {
    const s = sceneOf("saloon");
    if (!s) return;
    PIANO.bc = s.bc;
    let dragging = false, moved = false, sx = 0, sy = 0;
    const near = (lx, ly, x, y, r) => Math.hypot(lx - x, ly - y) <= r;
    // a ponta da chama é que precisa encostar na palavra
    const overWord = (lx, ly) => { const W = PIANO.word, fy = ly - 3; return lx >= W.x0 - 3 && lx <= W.x1 + 3 && fy >= W.y0 - 3 && fy <= W.y1 + 3; };
    const canPick = () => PIANO.state === "idle" && PIANO.candle === "lustre" && !SALOON.playing && s.scale;
    function hold(on) { s.canvas.style.touchAction = on ? "none" : ""; }
    function giveBack() { PIANO.retFrom = [PIANO.cx, PIANO.cy]; PIANO.retAt = performance.now(); PIANO.candle = "returning"; hold(false); s.canvas.style.cursor = ""; }
    function ignite(lx, ly) {
      const W = PIANO.word;
      PIANO.origin = [clamp(Math.round(lx), W.x0, W.x1), clamp(Math.round(ly - 3), W.y0 + 2, W.y1)];
      PIANO.candle = "burning"; PIANO.state = "seq"; PIANO.start = s.t; hold(false); s.canvas.style.cursor = "";
    }
    s.canvas.addEventListener("pointerdown", (e) => {
      if (!s.scale) return;
      const [lx, ly] = toScene(s, e);
      // vela na mão: o próximo toque decide (no "NÃO" queima, fora dele a vela volta para o lustre)
      if (PIANO.candle === "held") {
        e.preventDefault(); e.stopImmediatePropagation();
        if (overWord(lx, ly)) ignite(lx, ly); else giveBack();
        return;
      }
      if (canPick() && near(lx, ly, PIANO.slot.x, PIANO.slot.y, 6)) {
        e.preventDefault(); e.stopImmediatePropagation();
        PIANO.candle = "held"; PIANO.cx = lx; PIANO.cy = ly; hold(true);
        dragging = true; moved = false; sx = lx; sy = ly;
        try { s.canvas.setPointerCapture(e.pointerId); } catch { /* sem captura: o toque seguinte resolve */ }
      }
    });
    s.canvas.addEventListener("pointermove", (e) => {
      if (!s.scale) return;
      const [lx, ly] = toScene(s, e);
      if (PIANO.candle === "held") {
        PIANO.cx = lx; PIANO.cy = ly;
        if (Math.hypot(lx - sx, ly - sy) > 3) moved = true;
        s.canvas.style.cursor = overWord(lx, ly) ? "pointer" : "grabbing";
      } else if (canPick() && near(lx, ly, PIANO.slot.x, PIANO.slot.y, 6)) s.canvas.style.cursor = "grab";
    });
    s.canvas.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      if (PIANO.candle !== "held" || !moved) return;
      const [lx, ly] = toScene(s, e);
      if (overWord(lx, ly)) ignite(lx, ly); else giveBack();
    });
    s.canvas.addEventListener("pointercancel", () => { dragging = false; });
    // fim da sequência: conta o segredo uma vez só
    PIANO.onDone = () => {
      if (progress.piano) return;
      progress.piano = true; saveProgress(); hudUpdate();
      coinHud.classList.remove("got"); void coinHud.offsetWidth; coinHud.classList.add("got");
      GUIDE.say("Eita! O Tião já trocou o cartaz... Mas essa arte eu vi, viu? Tá anotada!");
    };
  })();

  // ================= Projetos: baús de ferreiro =================
  (function chests() {
    const PROJ = [
      { num: "I", name: "Ukra", kick: "Baú I",
        title: "Totem e Gestão de Pedidos",
        desc: "Um projeto para automatizar e aumentar a eficiência do estabelecimento, desenvolvido com C# Forms, integrado ao MySQL e com design próprio. Consiste em um totem fixo para realizar pedidos e outro painel para visualizá-los.",
        chips: ["C#", "Windows Forms", "MySQL"], href: "https://github.com/JoaoSanReboot/UkraBar", link: "GitHub ↗",
        wood: "#7a4a2a", iron: "#4a4644", trim: "#c0902a", img: "data:image/svg+xml;base64,__LOGO_UKRA__", alt: "Logo do Ukra Bar" },
      { num: "II", name: "Shogun Team", kick: "Baú II",
        title: "Link Tree",
        desc: "Uma link tree desenvolvida para uma academia de lutas, facilitando a divulgação de contatos, localização e horários de atendimento. Utiliza apenas HTML, CSS e JavaScript.",
        chips: ["HTML", "CSS", "JavaScript"], href: "https://shogun-team-link-tree.vercel.app", link: "Ver Projeto ↗",
        wood: "#6a3a28", iron: "#3a3634", trim: "#a8322a", img: "data:image/png;base64,__LOGO_SHOGUN__", alt: "Logo da Shogun Team" },
      { num: "III", name: "José, o Jogo", kick: "Baú III", wip: true,
        title: "Adivinhe a Música",
        desc: "Um jogo ainda em desenvolvimento no qual o jogador precisa adivinhar a música a partir do áudio ou da capa do álbum.",
        chips: [".NET 10", "SQL Server", "Angular"], href: "https://jose-o-jogo.vercel.app", link: "Jogar ↗",
        wood: "#5a3a24", iron: "#5a4a42", trim: "#e0602a", img: "data:image/svg+xml;base64,__LOGO_JOSE__", alt: "Mascote do José, o Jogo", hot: true },
    ];
    const stage = document.getElementById("chest-stage");
    const mainBtn = document.getElementById("chest-main");
    const cMain = mainBtn.querySelector("canvas").getContext("2d");
    const cPrev = document.querySelector("#chest-side-prev canvas").getContext("2d");
    const cNext = document.querySelector("#chest-side-next canvas").getContext("2d");
    const panel = document.getElementById("chest-panel");
    [cMain, cPrev, cNext].forEach((g) => { g.imageSmoothingEnabled = false; });
    let idx = 0, openK = 0, opening = 0, t = 0, sparks = [], visible = false, isOpen = false;

    // algarismo romano entalhado: hastes de 2 px com serifas em cima e embaixo
    function numeral(g, n, cx, y, c) {
      const k = n.length, w = k * 2 + (k - 1) * 2, x0 = Math.round(cx - w / 2);
      for (let i = 0; i < k; i++) R(g, x0 + i * 4, y + 1, 2, 5, c);
      R(g, x0 - 1, y, w + 2, 1, c); R(g, x0 - 1, y + 6, w + 2, 1, c);
      g.fillStyle = "rgba(255,240,200,0.35)"; for (let i = 0; i < k; i++) g.fillRect(x0 + i * 4, y + 1, 1, 5);
    }
    function drawChest(g, P, k, tt) {
      g.clearRect(0, 0, 64, 58);
      // sombra
      g.fillStyle = "rgba(40,24,12,0.25)"; g.fillRect(8, 54, 48, 2); g.fillRect(12, 56, 40, 1);
      const lift = Math.round(k * 6);
      // tampa abaulada, presa por dobradiça atrás: a base dela nunca sai do corpo
      const inside = k > 0.5;
      const lw = 52 - Math.round(k * 4), lx = Math.round(32 - lw / 2);
      const ly = Math.round(lerp(8, 1, k)), lb = 24;
      const lh = lb - ly;
      g.fillStyle = K; g.fillRect(lx - 1, ly + 1, lw + 2, lh); g.fillRect(lx + 1, ly - 1, lw - 2, 3);
      g.fillStyle = inside ? shade(P.wood, 0.55) : P.wood; g.fillRect(lx, ly + 2, lw, lh - 2); g.fillRect(lx + 2, ly, lw - 4, 2);
      g.fillStyle = shade(P.wood, inside ? 0.75 : 1.25); g.fillRect(lx + 2, ly, lw - 4, 1);
      for (let y = ly + 4; y < lb - 1; y += 4) R(g, lx, y, lw, 1, shade(P.wood, inside ? 0.45 : 0.8));
      [lx + 4, lx + lw - 8].forEach((bx) => { R(g, bx, ly - 1, 4, lh, P.iron); R(g, bx + 1, ly, 1, lh - 2, shade(P.iron, inside ? 1.1 : 1.5)); R(g, bx + 1, ly + 2, 2, 1, "#b0aca4"); });
      // interior aberto e o brilho do que está guardado
      if (k > 0.3) {
        const a = Math.min(1, (k - 0.3) * 2);
        O(g, 8, 21, 48, 3, "#2a1810");
        g.fillStyle = `rgba(255,214,120,${0.7 * a})`; g.fillRect(9, 21, 46, 2);
        for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(255,224,150,${0.2 * a})`; g.fillRect(14 + i * 9, 21 - 14 * a, 3, 14 * a); }
      }
      // corpo
      O(g, 6, 23, 52, 30, P.wood);
      for (let y = 27; y < 53; y += 5) R(g, 6, y, 52, 1, shade(P.wood, 0.78));
      R(g, 6, 23, 2, 30, shade(P.wood, 1.2)); R(g, 54, 23, 4, 30, shade(P.wood, 0.75));
      // ferragens
      [10, 50].forEach((bx) => { O(g, bx, 23, 4, 30, P.iron); R(g, bx + 1, 23, 1, 30, shade(P.iron, 1.5)); [27, 38, 48].forEach((ry) => R(g, bx + 1, ry, 2, 2, "#b0aca4")); });
      O(g, 6, 50, 52, 3, P.iron); R(g, 6, 50, 52, 1, shade(P.iron, 1.5));
      O(g, 6, 23, 52, 2, P.iron);
      // fechadura com o número
      const hot = P.hot ? 0.5 + 0.5 * Math.sin(tt * 3) : 0;
      O(g, 23, 25, 18, 17, P.iron); R(g, 24, 26, 16, 1, shade(P.iron, 1.5));
      [[24, 26], [39, 26], [24, 40], [39, 40]].forEach(([x, y]) => R(g, x, y, 1, 1, "#b0aca4"));
      O(g, 25, 28, 14, 10, P.trim); R(g, 26, 29, 12, 8, "#1b120d");
      numeral(g, P.num, 32, 30, "#f3e3c3");
      R(g, 31, 39, 2, 2, K); R(g, 31, 40, 2, 1, "#1b120d");
      // argola lateral
      R(g, 2, 33, 1, 5, K); R(g, 3, 32, 3, 1, K); R(g, 3, 38, 3, 1, K); R(g, 3, 33, 1, 5, P.iron);
      if (P.hot) {
        // baú ainda quente da forja: as ferragens brilham e solta fumaça
        g.fillStyle = `rgba(255,120,40,${0.25 + hot * 0.25})`; g.fillRect(10, 23, 4, 30); g.fillRect(50, 23, 4, 30); g.fillRect(6, 50, 52, 3);
        for (let i = 0; i < 3; i++) { const s = (tt * 0.4 + i / 3) % 1; g.fillStyle = `rgba(220,210,200,${0.35 * (1 - s)})`; g.fillRect(Math.round(18 + i * 13 + Math.sin(tt + i) * 2), Math.round(6 - lift - s * 6), 2 + Math.round(s * 2), 2); }
      }
      // brilho de metal de vez em quando
      if ((tt % 3.4) < 0.18) sparkle(g, 47, 25, 2, "#fff8e0");
    }
    function fillPanel() {
      const P = PROJ[idx];
      document.getElementById("cp-kick").textContent = P.kick;
      document.getElementById("cp-wip").hidden = !P.wip;
      document.getElementById("cp-title").textContent = P.title;
      document.getElementById("cp-desc").textContent = P.desc;
      const ul = document.getElementById("cp-chips"); ul.innerHTML = "";
      P.chips.forEach((c) => { const li = document.createElement("li"); li.textContent = c; ul.appendChild(li); });
      const a = document.getElementById("cp-link"); a.href = P.href; a.textContent = P.link;
      const im = document.getElementById("cp-img"); im.src = P.img; im.alt = P.alt;
    }
    function updateCaption() {
      const P = PROJ[idx];
      document.getElementById("chest-num").textContent = "Baú " + P.num;
      document.getElementById("chest-name").textContent = P.name;
      document.getElementById("chest-hint").textContent = isOpen ? "Toque de novo para fechar" : "Toque no baú para abrir";
      mainBtn.setAttribute("aria-label", (isOpen ? "Fechar o baú: " : "Abrir o baú: ") + P.name);
    }
    let closing = Promise.resolve();
    function setOpen(on, keepSpace = false) {
      opening = on ? 1 : -1; isOpen = on;
      mainBtn.setAttribute("aria-expanded", String(on));
      if (on) {
        fillPanel();
        for (let i = 0; i < 18; i++) sparks.push({ x: 32 + (Math.random() - 0.5) * 30, y: 22, vx: (Math.random() - 0.5) * 0.8, vy: -0.6 - Math.random() * 1.2, life: 0 });
        setTimeout(() => { if (opening >= 0) { panel.hidden = false; panel.style.visibility = ""; panel.classList.remove("in"); void panel.offsetWidth; panel.classList.add("in"); } }, reduceMotion ? 0 : 380);
      } else closing = closePanel(keepSpace);
      updateCaption();
    }
    // o painel recolhe junto com a tampa, em vez de sumir de uma vez
    function closePanel(keepSpace) {
      if (panel.hidden) return Promise.resolve();
      panel.classList.remove("in");
      const done = () => { if (isOpen) return; if (keepSpace) panel.style.visibility = "hidden"; else { panel.hidden = true; panel.style.visibility = ""; } };
      if (reduceMotion || !panel.animate) { done(); return Promise.resolve(); }
      const a = panel.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-34px) scale(0.9)" }], { duration: 360, easing: "cubic-bezier(.5, 0, .75, 0)" });
      return a.finished.then(done).catch(done);
    }
    function lidShut() {
      return new Promise((res) => {
        const t0 = performance.now();
        (function check() { if ((openK === 0 && opening <= 0) || performance.now() - t0 > 1000) res(); else requestAnimationFrame(check); })();
      });
    }
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let turning = false;
    // fechar → deslizar para o lado → abrir: cada etapa espera a anterior terminar
    async function go(d) {
      if (turning) return;
      turning = true;
      try {
        const wasOpen = isOpen || opening > 0;
        if (wasOpen) { setOpen(false, true); await Promise.all([closing, lidShut()]); }
        const cv = mainBtn.querySelector("canvas");
        const sides = [document.querySelector("#chest-side-prev canvas"), document.querySelector("#chest-side-next canvas")];
        const dir = d > 0 ? -1 : 1;
        const dur = reduceMotion || !cv.animate ? 0 : 300;
        let outs = [];
        if (dur) {
          outs = sides.map((c) => c.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${dir * 28}px)` }], { duration: dur, easing: "ease-in", fill: "forwards" }));
          const half = cv.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${dir * 90}px)` }], { duration: dur, easing: "ease-in", fill: "forwards" });
          outs.push(half);
          await half.finished;
        }
        // com o baú fora de cena, troca o projeto: nada de dois projetos ao mesmo tempo
        idx = (idx + d + PROJ.length) % PROJ.length;
        updateCaption();
        if (dur) {
          await new Promise((r) => requestAnimationFrame(r));
          const back = cv.animate([{ opacity: 0, transform: `translateX(${-dir * 90}px)` }, { opacity: 1, transform: "none" }], { duration: dur + 80, easing: "ease-out" });
          const sideIn = sides.map((c) => c.animate([{ opacity: 0, transform: `translateX(${-dir * 28}px)` }, { opacity: 1, transform: "none" }], { duration: dur + 80, easing: "ease-out" }));
          outs.forEach((a) => a.cancel());
          await Promise.all([back.finished, ...sideIn.map((a) => a.finished)]);
        }
        if (wasOpen) { await sleep(reduceMotion ? 0 : 140); setOpen(true); }
      } finally { turning = false; }
    }
    mainBtn.addEventListener("click", () => { if (!turning) setOpen(!isOpen); });
    document.getElementById("cp-close").addEventListener("click", () => { if (!turning) { setOpen(false); mainBtn.focus(); } });
    document.getElementById("chest-prev").addEventListener("click", () => go(-1));
    document.getElementById("chest-next").addEventListener("click", () => go(1));
    document.getElementById("chest-side-prev").addEventListener("click", () => go(-1));
    document.getElementById("chest-side-next").addEventListener("click", () => go(1));
    document.getElementById("forge").addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); mainBtn.focus(); }
    });
    let sx = null;
    stage.addEventListener("pointerdown", (e) => { sx = e.clientX; });
    stage.addEventListener("pointerup", (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
    new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.1 }).observe(document.getElementById("forge"));
    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!site.hidden && (visible || t === 0)) {
        t += dt;
        if (opening) { openK = clamp(openK + opening * dt * (reduceMotion ? 99 : 2.6)); if (openK === 0 || openK === 1) opening = 0; }
        const tt = reduceMotion ? 1 : t;
        drawChest(cMain, PROJ[idx], openK, tt);
        sparks = sparks.filter((s) => (s.life += dt) < 1);
        for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.02; R(cMain, s.x, s.y - openK * 6, 1, 1, s.life < 0.5 ? "#fff0b0" : "#e8b040"); }
        drawChest(cPrev, PROJ[(idx + PROJ.length - 1) % PROJ.length], 0, tt);
        drawChest(cNext, PROJ[(idx + 1) % PROJ.length], 0, tt);
      }
      requestAnimationFrame(frame);
    }
    updateCaption();
    requestAnimationFrame(frame);
  })();

  // ================= Commits: a placa acende dia por dia =================
  const HEAT = [
    [1, 1, 3], [6, 2, 2], [6, 3, 2], [9, 2, 1], [11, 0, 1], [16, 2, 3], [16, 3, 3],
    [18, 2, 1], [19, 0, 2], [20, 0, 2], [20, 1, 2], [19, 4, 2], [28, 5, 3], [29, 4, 1], [38, 5, 2],
  ];
  const HEAT_START = new Date(2025, 9, 26), HEAT_END = new Date(2026, 9, 26);
  const fmtDay = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" });
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  // registro guardado (outubro de 2026): só o nível de cada dia, sem a contagem exata
  function snapshotData() {
    const lv = new Map(HEAT.map(([c, r, l]) => [c * 7 + r, l]));
    const days = [];
    for (let i = 0; ; i++) {
      const d = new Date(HEAT_START); d.setDate(d.getDate() + i);
      if (d > HEAT_END) break;
      days.push({ date: isoDay(d), level: lv.get(i) || 0, count: null });
    }
    return { total: 24, days, live: false };
  }
  let heatData = snapshotData();
  const heatCells = [];
  let heatPhase = "idle";
  function buildHeat() {
    const heat = document.getElementById("heat");
    heat.innerHTML = ""; heatCells.length = 0;
    const first = new Date(heatData.days[0].date + "T12:00:00");
    // a grade começa no domingo, como no GitHub
    for (let i = 0; i < first.getDay(); i++) { const b = document.createElement("span"); b.className = "pad"; heat.appendChild(b); }
    heatData.days.forEach((day) => {
      const d = new Date(day.date + "T12:00:00");
      const b = document.createElement("button");
      b.type = "button";
      const l = day.level;
      const what = day.count == null ? (l ? "dia com contribuições" : "nenhuma contribuição") : day.count === 1 ? "1 contribuição" : `${day.count} contribuições`;
      if (l) { b.className = "l" + l; b.style.setProperty("--d", (Math.random() * 3).toFixed(2) + "s"); }
      b.setAttribute("aria-label", `${fmtDay.format(d)}: ${what}`);
      b.addEventListener("click", () => { document.getElementById("heat-tip").textContent = `${fmtDay.format(d)}: ${what}.`; });
      if (!l) b.tabIndex = -1;
      heat.appendChild(b);
      heatCells.push({ b, l });
    });
    const a = new Date(heatData.days[0].date + "T12:00:00"), z = new Date(heatData.days[heatData.days.length - 1].date + "T12:00:00");
    const legend = document.querySelectorAll(".heat-legend span");
    legend[0].innerHTML = `${fmtMonth.format(a).replace(".", "")} <b>${a.getFullYear()}</b>`;
    legend[1].innerHTML = `${fmtMonth.format(z).replace(".", "")} <b>${z.getFullYear()}</b>`;
    document.getElementById("heat-count").textContent = String(heatData.total);
    if (heatPhase === "done" || reduceMotion) heatCells.forEach((c) => c.l && c.b.classList.add("on"));
  }
  buildHeat();
  // integração ao vivo: só existe quando o site publicado tem o endpoint do servidor (o token fica lá, nunca aqui)
  (function liveHeat() {
    const status = document.getElementById("heat-status");
    const endpoint = window.VILA_GH_ENDPOINT || null;
    const label = "registro de outubro de 2026";
    if (!endpoint) { status.textContent = `Integração ao vivo com o GitHub ainda não configurada: mostrando o ${label}.`; return; }
    status.textContent = "Consultando o GitHub pelo telégrafo...";
    fetch(endpoint, { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("http " + r.status))))
      .then((data) => {
        if (!data || !Array.isArray(data.days) || !data.days.length) { status.textContent = `O GitHub não mandou dados agora: mostrando o ${label}.`; return; }
        heatData = { total: data.total, days: data.days, live: true };
        buildHeat();
        const when = data.fetchedAt ? new Date(data.fetchedAt) : new Date();
        status.textContent = `Ao vivo do GitHub · atualizado em ${when.toLocaleDateString("pt-BR")}.`;
      })
      .catch(() => { status.textContent = `Sem sinal do GitHub agora: mostrando o ${label}.`; });
  })();
  // uma varredura percorre o ano devagar; cada dia com commit acende e fica aceso (só na primeira vez)
  (function animateHeat() {
    const heat = document.getElementById("heat"), count = document.getElementById("heat-count");
    if (reduceMotion) { heatPhase = "done"; heatCells.forEach((c) => c.l && c.b.classList.add("on")); return; }
    let visible = false, i = 0, lit = 0, wait = 0, last = performance.now();
    new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.3 }).observe(heat);
    const SPEED = 42; // dias por segundo
    heatCells.forEach((c) => c.b.classList.remove("on", "scan", "pop"));
    count.textContent = "0"; heatPhase = "scan";
    function tick(now) {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (visible && !site.hidden) {
        const totalLv = heatCells.reduce((s, c) => s + c.l, 0) || 1;
        wait += dt * SPEED;
        while (wait >= 1 && i < heatCells.length) {
          wait -= 1;
          const c = heatCells[i];
          const prev = heatCells[i - 3]; if (prev) prev.b.classList.remove("scan");
          c.b.classList.add("scan");
          if (c.l) {
            c.b.classList.add("on", "pop"); lit += c.l;
            count.textContent = String(Math.round(heatData.total * lit / totalLv));
            setTimeout(() => c.b.classList.remove("pop"), 700);
          }
          i++;
        }
        if (i >= heatCells.length) { heatCells.forEach((c) => c.b.classList.remove("scan")); heatPhase = "done"; count.textContent = String(heatData.total); return; }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // ================= Fichas: só uma aberta por vez =================
  const fichas = [...document.querySelectorAll('#trabalhos details')];
  fichas.forEach((d) => d.addEventListener("toggle", () => { if (d.open) fichas.forEach((o) => { if (o !== d) o.open = false; }); }));

  // ================= Duelo ao pôr do sol: espere o sino e acerte o tempo da agulha =================
  (function quickDraw() {
    const $ = (id) => document.getElementById(id);
    const intro = $("duel-intro"), play = $("duel-play"), end = $("duel-end"), fire = $("d-fire"), sceneFig = $("duel-scene");
    const bar = $("reflex"), marker = $("r-marker"), zonesBox = $("r-zones"), fill = $("r-fill"), stamp = $("d-stamp");
    const sfx = (name) => { if (window.VilaAudio && window.VilaAudio.fx) window.VilaAudio.fx(name); };
    // tempo do marcador (ms), faixa vermelha e amarela (% da barra), rodadas para vencer e o fôlego da raiva (rolo)
    const LEVELS = {
      facil: { name: "Fácil", wins: 2, period: 1700, zone: 28, perfect: 12, speedUp: 0.97, mashNeed: 8, mashTime: 2700 },
      normal: { name: "Normal", wins: 3, period: 1250, zone: 20, perfect: 8, speedUp: 0.95, mashNeed: 11, mashTime: 2200 },
      dificil: { name: "Difícil", wins: 4, period: 900, zone: 13, perfect: 5, speedUp: 0.94, mashNeed: 14, mashTime: 1800 },
    };
    // cada personagem tem a sua arma, a sua mecânica e as suas falas
    const KIT = {
      revolver: { arma: "revólver", call: "SAQUE!", btn: "Atirar",
        rules: ["Espere o sino. Atirou antes? Perde a rodada. O João vai tentar te enganar.", "Quando aparecer <b>SAQUE!</b>, um marcador corre pela barra, logo acima do botão <b>Atirar</b>.", "Atire quando ele passar pela <b>faixa amarela</b> (botão, clique na cena ou <b>Espaço</b>).", "Fora da faixa, ou se o marcador chegar ao fim da barra, o João atira primeiro."],
        aim: "Atire quando o marcador passar na faixa amarela.",
        yellow: ["Tiro perfeito!", "Perfeito!", "Bem na faixa amarela. O chapéu do João foi parar longe."], red: ["Na mosca!", "Acertou!", "Na faixa vermelha: o revólver aprimorado garantiu a rodada."],
        miss: ["Errou o tempo!", "Errou!", "O tiro saiu fora da faixa. O João não perdoou."], slow: ["Lento demais!", "Lento!", "O marcador chegou ao fim. O João sacou primeiro."],
        win: "Você venceu o dev mais temido do Oeste.", flawless: "Sem levar um tiro. A vila vai falar disso por anos.", lose: "O João segue invicto. Por enquanto.", unit: "Tiros certeiros" },
      twin: { arma: "duas pistolas", call: "SAQUE DUPLO!", btn: "Atirar",
        rules: ["Espere o sino. Sacou antes? Perde a rodada.", "Quando aparecer <b>SAQUE DUPLO!</b>, a barra ganha <b>duas faixas amarelas</b>: uma para cada pistola.", "Cada clique (ou <b>Espaço</b>) dispara uma pistola. Acerte as duas faixas na mesma passada do marcador.", "Errou uma das duas, ou o marcador chegou ao fim? O João atira primeiro."],
        aim: "Uma pistola em cada faixa amarela.",
        yellow: ["Duas na mosca!", "Duplo!", "Esquerda e direita certeiras: o chapéu do João virou peneira."], red: ["Duas no alvo!", "Duplo!", "As duas pistolas acertaram, com uma ajudinha do revólver aprimorado."],
        miss: ["Uma pistola falhou!", "Errou!", "Um dos tiros saiu fora da faixa. O João aproveitou."], slow: ["Faltou uma pistola!", "Lento!", "O marcador passou antes do segundo tiro."],
        win: "Duas pistolas, nenhuma palavra: o João perdeu.", flawless: "Nem um arranhão. Ninguém sabe quem você é, mas todo mundo vai saber o que fez.", lose: "O João segue invicto. Desta vez as duas pistolas não bastaram.", unit: "Rodadas com as duas pistolas certeiras" },
      lasso: { arma: "laço", call: "LAÇA!", btn: "Segure para girar o laço", hold: true,
        rules: ["Espere o sino. Começou a girar antes? Perde a rodada.", "Quando aparecer <b>LAÇA!</b>, segure o botão (ou <b>Espaço</b>) para girar o laço: o marcador vai e volta na barra.", "Solte quando ele estiver na <b>faixa amarela</b> e o laço voa direto no João.", "Soltou fora da faixa, ou demorou demais girando? O João saca antes."],
        aim: "Segure para girar e solte na faixa amarela.",
        yellow: ["Laçado!", "Laçado!", "O laço fechou certinho em volta do João."], red: ["Pegou de raspão!", "Laçado!", "Laço frouxo, mas o revólver aprimorado no coldre deu confiança."],
        miss: ["Laço curto!", "Errou!", "O laço caiu na poeira antes de chegar."], slow: ["Demorou no laço!", "Lento!", "Enquanto o laço girava, o João sacou."],
        win: "João amarrado feito bezerro em rodeio!", flawless: "Nem um tiro levou: a vaqueira mais rápida da região.", lose: "O João escapou do laço. Por enquanto.", unit: "Laçadas certeiras" },
      pin: { arma: "rolo de amassar pão", call: "AGORA, MENINO!", btn: "Bater!", mash: true,
        rules: ["Espere o sino. Bateu antes? Perde a rodada (e leva bronca).", "Quando aparecer <b>AGORA, MENINO!</b>, toque no botão (ou aperte <b>Espaço</b>) bem rápido para encher a barra de raiva.", "Barra cheia antes de o João sacar: o rolo voa direto na testa dele.", "Se a raiva não encher a tempo, o João saca primeiro."],
        aim: "Toque rápido para encher a barra de raiva!",
        yellow: ["PLAFT!", "PLAFT!", "Rolo na testa: o João viu estrelinhas."], red: ["PLAFT!", "PLAFT!", "Rolo na testa: o João viu estrelinhas."],
        miss: ["Escorregou!", "Errou!", "O rolo escorregou da mão."], slow: ["Faltou raiva!", "Lento!", "A barra não encheu a tempo. O João sacou primeiro."],
        win: "Rolo na testa: o João vai pensar duas vezes antes de bagunçar a cozinha.", flawless: "Nenhum tiro, só rolo: respeitem a senhora!", lose: "O João escapou da bronca. Por enquanto.", unit: "Roladas na testa" },
      rifle: { arma: "rifle", call: "ENGATILHA!", btn: "Engatilhar", btn2: "Disparar",
        rules: ["Espere o sino. Engatilhou antes? Perde a rodada.", "Quando aparecer <b>ENGATILHA!</b>, clique uma vez (ou <b>Espaço</b>) para levantar e engatilhar o rifle.", "Aí a mira balança pela barra: dispare quando ela passar na <b>faixa amarela</b>.", "Errou a faixa, ou demorou para disparar? O João saca primeiro."],
        aim: "Engatilhe o rifle primeiro!", aim2: "Mira balançando: dispare na faixa amarela.",
        yellow: ["Tiro certeiro!", "Certeiro!", "O estampido ecoou no sertão e o chapéu do João sumiu."], red: ["Acertou!", "Acertou!", "A mira tremeu, mas o revólver aprimorado de reserva deu coragem."],
        miss: ["Bala perdida!", "Errou!", "O tiro do rifle passou longe. O João não perdoou."], slow: ["Demorou na mira!", "Lento!", "Enquanto você mirava, o João sacou."],
        win: "Tiro de rifle que ecoou no sertão inteiro.", flawless: "O cangaço mandou lembrança: nenhum tiro de volta.", lose: "O João segue invicto. O sertão espera a revanche.", unit: "Disparos certeiros" },
    };
    const BLUFFS = ["O João mexeu os dedos perto do coldre...", "Um carcará piou lá no alto...", "Uma bola de feno passou rolando...", "O João estalou o pescoço..."];
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const weapon = () => { const H = (window.VILA_HEROES || {})[window.VILA_HERO]; return (H && H.weapon) || "revolver"; };
    let W = KIT.revolver, wType = "revolver";
    let L = LEVELS.normal, level = "normal";
    let round = 0, you = 0, joao = 0, phase = "idle", timers = [], t0 = 0, period = 0, hits = 0, perfects = 0, raf = 0;
    let zones = [], deadline = 0, holding = false, holdAt = 0, charge = 0, cocked = false, cockAt = 0, lastTick = 0, spinSfx = 0;
    let wins = {};
    try { wins = JSON.parse(safeGet("vila-duelo-vitorias") || "{}"); } catch { wins = {}; }
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const clear = () => { timers.forEach(clearTimeout); timers = []; cancelAnimationFrame(raf); clearInterval(spinSfx); };
    function showRecord() {
      const parts = Object.keys(LEVELS).filter((k) => wins[k]).map((k) => `${LEVELS[k].name} ${wins[k]}×`);
      $("d-best").textContent = parts.length ? `Vitórias: ${parts.join(" · ")}` : "";
    }
    // regras, botão e arma mudam com o personagem escolhido
    function applyKit() {
      wType = weapon(); W = KIT[wType];
      const H = (window.VILA_HEROES || {})[window.VILA_HERO];
      $("d-weapon").textContent = `${H ? H.name : "Pistoleiro clássico"} · arma: ${W.arma}`;
      $("d-rules").innerHTML = W.rules.map((r) => `<li>${r}</li>`).join("");
      $("d-bonus").textContent = wType === "pin" ? "Com o revólver aprimorado do Xavier, a raiva enche mais rápido." : "Com o revólver aprimorado do Xavier, as faixas vermelhas ao lado da amarela também valem.";
      fire.textContent = W.btn;
      DUEL.anim.weapon = wType;
    }
    showRecord(); applyKit();
    document.addEventListener("vila:hero", () => { if (phase === "idle") applyKit(); });
    function score() { $("d-round").textContent = round; $("d-you").textContent = you; $("d-joao").textContent = joao; }
    function setCall(text, cls) { const c = $("d-call"); c.textContent = text; c.className = "duel-call" + (cls ? " " + cls : ""); }
    function showStamp(text, ok) { stamp.textContent = text; stamp.className = "stamp" + (ok ? " win" : ""); stamp.hidden = false; }
    function shake() { sceneFig.classList.remove("shake"); void sceneFig.offsetWidth; sceneFig.classList.add("shake"); }
    function anim(mode) { DUEL.anim.mode = mode; DUEL.anim.at = performance.now(); }
    // o João, encostado no mourão, chama para o duelo
    const invite = sayButton("Topa um duelo?", "O João desafia você para um duelo. Ir para as regras do duelo");
    pin("fimdarua", invite, 196, 50);
    invite.addEventListener("click", () => {
      $("duel").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      $("duel-start").focus({ preventScroll: true });
    });

    function start() {
      clear(); applyKit();
      level = (document.querySelector('input[name="nivel"]:checked') || {}).value || "normal";
      L = LEVELS[level];
      round = 0; you = 0; joao = 0; hits = 0; perfects = 0;
      $("d-level").textContent = L.name;
      intro.hidden = true; end.hidden = true; play.hidden = false; stamp.hidden = true; invite.hidden = true;
      DUEL.on = true; sceneFig.classList.add("armed");
      if (window.VilaAudio) window.VilaAudio.cue("duel");
      sceneFig.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      nextRound();
    }
    function nextRound() {
      clear(); round++; score();
      DUEL.hat = { you: true, joao: true }; DUEL.flying = []; DUEL.phase = "wait"; phase = "wait";
      DUEL.anim.shots = []; DUEL.anim.charge = 0; anim("wait");
      holding = false; charge = 0; cocked = false; zones = [];
      bar.className = "reflex off"; zonesBox.innerHTML = ""; fill.style.width = "0%"; stamp.hidden = true;
      $("d-next").hidden = true; fire.hidden = false; fire.disabled = false; fire.textContent = W.btn;
      setCall("Preparar...");
      $("d-why").textContent = "Mão longe da arma. Espere o sino.";
      const wait = 1800 + Math.random() * 2600;
      const n = round === 1 ? (Math.random() < 0.5 ? 1 : 0) : 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) {
        later(() => {
          if (phase !== "wait") return;
          const b = pick(BLUFFS);
          if (b.startsWith("O João mexeu")) DUEL.twitchAt = performance.now();
          $("d-why").textContent = b;
        }, 500 + Math.random() * (wait - 900));
      }
      later(bell, wait);
    }
    function makeZone(lo, hi) {
      const w = L.zone, p = L.perfect, s = lo + Math.random() * (hi - lo - w);
      return { s, w, p, mid: s + w / 2, hit: false, yellow: false };
    }
    function renderZones() {
      zonesBox.innerHTML = "";
      zones.forEach((z) => {
        const red = document.createElement("span"); red.className = "r-zone"; red.style.left = z.s + "%"; red.style.width = z.w + "%"; red.hidden = !hasGun();
        const yel = document.createElement("span"); yel.className = "r-perfect"; yel.style.left = z.mid - z.p / 2 + "%"; yel.style.width = z.p + "%";
        if (z.hit) { yel.classList.add("done"); red.classList.add("done"); }
        zonesBox.append(red, yel);
      });
    }
    function bell() {
      if (phase !== "wait") return;
      phase = "draw"; DUEL.phase = "draw"; DUEL.bellAt = performance.now(); anim("draw");
      sfx("bell");
      setCall(W.call, "draw"); $("d-why").textContent = W.aim;
      // a cada rodada tudo fica um pouco mais rápido
      period = L.period * Math.pow(L.speedUp, round - 1);
      bar.className = "reflex" + (wType === "pin" ? " meter" : "");
      if (wType === "twin") { zones = [makeZone(18, 50), makeZone(58, 94)]; period *= 1.3; deadline = period; }
      else if (wType === "pin") { zones = []; deadline = L.mashTime * Math.pow(L.speedUp, round - 1); }
      else if (wType === "lasso") { zones = [makeZone(28, 94)]; deadline = period * 2.6; }
      else if (wType === "rifle") { zones = [makeZone(28, 94)]; deadline = period * 2.5; }
      else { zones = [makeZone(30, 94)]; deadline = period; }
      renderZones();
      marker.style.left = "0%";
      marker.hidden = wType === "pin" || wType === "lasso" || wType === "rifle";
      t0 = performance.now(); lastTick = t0; raf = requestAnimationFrame(tick);
    }
    // onde o marcador está, conforme a mecânica
    function position(now) {
      if (wType === "lasso") { const k = ((now - holdAt) / period) % 2; return (k < 1 ? k : 2 - k) * 100; }
      if (wType === "rifle") return (1 - Math.cos(Math.PI * (now - cockAt) / period)) * 50;
      return ((now - t0) / period) * 100;
    }
    function tick(now) {
      if (phase !== "draw") return;
      const dt = Math.min(0.05, (now - lastTick) / 1000); lastTick = now;
      if (wType === "pin") {
        charge = Math.max(0, charge - dt * 0.16);
        DUEL.anim.charge = charge; fill.style.width = charge * 100 + "%";
        if (charge > 0 && DUEL.anim.mode !== "wind") anim("wind");
      } else if (wType === "lasso") {
        if (holding) { marker.style.left = position(now) + "%"; DUEL.anim.charge = Math.min(1, (now - holdAt) / period); }
      } else if (wType === "rifle") {
        if (cocked) marker.style.left = position(now) + "%";
      } else {
        const a = position(now);
        marker.style.left = Math.min(a, 100) + "%";
        if (a >= 100) { lose("slow"); return; }
      }
      if (now - t0 >= deadline) { lose("slow"); return; }
      raf = requestAnimationFrame(tick);
    }
    function judge(a, z) {
      const g = 0.8;
      if (Math.abs(a - z.mid) <= z.p / 2 + g) return "yellow";
      if (hasGun() && a >= z.s - g && a <= z.s + z.w + g) return "red";
      return null;
    }
    // apertou (ou tocou): o que acontece depende da arma
    function press() {
      if (phase === "wait") { early(); return; }
      if (phase !== "draw") return;
      const now = performance.now();
      if (wType === "twin") {
        const a = position(now);
        const z = zones.find((q) => !q.hit && judge(a, q));
        if (!z) { lose("miss"); return; }
        z.hit = true; z.yellow = judge(a, z) === "yellow";
        DUEL.anim.shots.push({ side: DUEL.anim.shots.length ? "L" : "R", at: now }); sfx("shot"); renderZones();
        if (zones.every((q) => q.hit)) win(zones.every((q) => q.yellow));
        return;
      }
      if (wType === "lasso") {
        if (holding) return;
        holding = true; holdAt = now; marker.hidden = false; anim("spin"); sfx("whoosh");
        spinSfx = setInterval(() => sfx("whoosh"), 320);
        return;
      }
      if (wType === "pin") {
        const need = L.mashNeed * (hasGun() ? 0.75 : 1);
        charge = Math.min(1, charge + 1 / need); DUEL.anim.charge = charge; fill.style.width = charge * 100 + "%";
        if (DUEL.anim.mode !== "wind") anim("wind");
        sfx("tap");
        if (charge >= 1) win((now - t0) < deadline * 0.6);
        return;
      }
      if (wType === "rifle") {
        if (!cocked) {
          cocked = true; cockAt = now; marker.hidden = false; anim("cock"); sfx("cock");
          fire.textContent = W.btn2; $("d-why").textContent = W.aim2;
          later(() => { if (phase === "draw") anim("aim"); }, 280);
          return;
        }
        const r = judge(position(now), zones[0]);
        if (r) win(r === "yellow"); else lose("miss");
        return;
      }
      const r = judge(position(now), zones[0]);
      if (r) win(r === "yellow"); else lose("miss");
    }
    // soltou: só o laço usa (é aí que ele voa)
    function release() {
      if (wType !== "lasso" || !holding || phase !== "draw") return;
      holding = false; clearInterval(spinSfx);
      const r = judge(position(performance.now()), zones[0]);
      if (r) win(r === "yellow"); else lose("miss");
    }
    // quem leva o tiro (ou o laço, ou o rolo) perde o chapéu, às vezes com um atraso para a arma chegar
    function knock(target, delay) {
      const go = () => {
        DUEL.hat[target] = false;
        const fly = target === "joao" ? "#9a6a3c" : DUEL.hero().flyHat;
        if (fly) DUEL.flying.push(target === "joao" ? { x: 214, y: 58, vx: 1.3, vy: -2.4, r: 0, col: fly, ground: 112 } : { x: 110, y: 58, vx: -1.3, vy: -2.4, r: 0, col: fly, ground: 112 });
      };
      if (delay) later(go, delay); else go();
    }
    function joaoFires() { DUEL.shotBy = "joao"; DUEL.shotAt = performance.now(); DUEL.phase = "joao"; sfx("shot"); knock("you"); }
    function early() {
      clear(); phase = "result"; joao++; score();
      joaoFires();
      setCall("Desclassificado!");
      $("d-why").textContent = "Você se mexeu antes do sino. Rodada para o João.";
      showStamp("Antes do sino!", false);
      after();
    }
    function win(yellow) {
      clear(); phase = "result"; you++; hits++; if (yellow) perfects++; score();
      bar.classList.add("hit");
      DUEL.shotBy = "you"; DUEL.shotAt = performance.now(); DUEL.phase = "you";
      if (wType === "lasso") { anim("caught"); sfx("throw"); later(() => sfx("snap"), 420); knock("joao", 420); later(shake, 420); }
      else if (wType === "pin") { anim("throw"); sfx("throw"); later(() => sfx("bonk"), 360); knock("joao", 360); later(shake, 360); }
      else if (wType === "rifle") { anim("fire"); sfx("rifle"); knock("joao"); shake(); }
      else if (wType === "twin") { knock("joao"); shake(); }
      else { anim("fire"); sfx("shot"); knock("joao"); shake(); }
      const [call, st, why] = yellow ? W.yellow : W.red;
      setCall(call, yellow ? "perfect" : "draw");
      $("d-why").textContent = why;
      showStamp(st, true);
      after();
    }
    function lose(kind) {
      clear(); phase = "result"; joao++; score();
      bar.classList.add("miss");
      if (wType === "lasso") anim(holding || kind === "miss" ? "fall" : "wait");
      else if (wType === "pin") anim(charge > 0 ? "drop" : "wait");
      holding = false;
      joaoFires();
      const [call, st, why] = kind === "slow" ? W.slow : W.miss;
      setCall(call); $("d-why").textContent = why; showStamp(st, false);
      after();
    }
    const over = () => you === L.wins || joao === L.wins;
    function after() {
      fire.disabled = true;
      const n = $("d-next");
      n.textContent = over() ? "Ver o resultado" : "Próxima rodada";
      later(() => { fire.hidden = true; n.hidden = false; n.focus({ preventScroll: true }); }, 900);
    }
    function finish() {
      clear(); phase = "idle"; play.hidden = true; end.hidden = false;
      DUEL.phase = "idle";
      if (window.VilaAudio) window.VilaAudio.cue("village");
      const won = you === L.wins;
      if (won) { wins[level] = (wins[level] || 0) + 1; safeSet("vila-duelo-vitorias", JSON.stringify(wins)); }
      showStamp(won ? "Vitória!" : "Derrota", won);
      later(() => { stamp.hidden = true; DUEL.on = false; DUEL.flying = []; anim("wait"); sceneFig.classList.remove("armed"); invite.hidden = false; applyKit(); }, 3200);
      $("d-end-title").textContent = won && joao === 0 ? W.flawless : won ? W.win : W.lose;
      $("d-end-text").textContent = `${L.name}: você ${you} × ${joao} João. ${W.unit}: ${hits}. Na faixa amarela: ${perfects}.` + (won && level !== "dificil" ? " Que tal subir a dificuldade?" : "");
      showRecord();
      $("d-again").focus({ preventScroll: true });
    }
    $("duel-start").addEventListener("click", start);
    $("d-again").addEventListener("click", () => { end.hidden = true; intro.hidden = false; applyKit(); $("duel-start").focus({ preventScroll: true }); });
    $("d-next").addEventListener("click", () => (over() ? finish() : nextRound()));
    fire.addEventListener("pointerdown", (e) => { e.preventDefault(); press(); });
    fire.addEventListener("click", (e) => { if (e.detail === 0) { press(); release(); } });
    sceneFig.addEventListener("pointerdown", (e) => { if (DUEL.on && !e.target.closest(".say")) press(); });
    ["pointerup", "pointercancel"].forEach((ev) => window.addEventListener(ev, release));
    window.addEventListener("keydown", (e) => {
      if (play.hidden || (phase !== "wait" && phase !== "draw")) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!e.repeat) press(); }
    });
    window.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") release(); });
  })();

  // ================= Jogo da velha: o bartender chama e o tabuleiro abre na própria cena =================
  (function velha() {
    const board = document.getElementById("velha"), msg = document.getElementById("velha-msg"), panel = document.getElementById("velha-panel");
    const HOLE = '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="3" width="4" height="6" fill="#1b120d"/><rect x="3" y="4" width="6" height="4" fill="#1b120d"/><rect x="5" y="4" width="2" height="4" fill="#3a2a22"/><rect x="1" y="1" width="2" height="1" fill="#5a3820"/><rect x="2" y="2" width="1" height="1" fill="#5a3820"/><rect x="9" y="2" width="2" height="1" fill="#5a3820"/><rect x="9" y="9" width="1" height="2" fill="#5a3820"/><rect x="1" y="9" width="2" height="1" fill="#5a3820"/><rect x="10" y="6" width="1" height="1" fill="#5a3820"/></svg>';
    const SHOE = '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true"><rect x="2" y="1" width="3" height="8" fill="#5a5652"/><rect x="7" y="1" width="3" height="8" fill="#5a5652"/><rect x="3" y="8" width="6" height="3" fill="#5a5652"/><rect x="5" y="9" width="2" height="1" fill="#8a8682"/><rect x="3" y="2" width="1" height="1" fill="#c8c4bc"/><rect x="3" y="5" width="1" height="1" fill="#c8c4bc"/><rect x="8" y="2" width="1" height="1" fill="#c8c4bc"/><rect x="8" y="5" width="1" height="1" fill="#c8c4bc"/></svg>';
    const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    let cells, over, youStart = true;
    const tally = { you: 0, draw: 0, bar: 0 }, btns = [];
    for (let i = 0; i < 9; i++) {
      const b = document.createElement("button");
      b.type = "button"; b.addEventListener("click", () => play(i));
      board.appendChild(b); btns.push(b);
    }
    // o painel e o convite ficam presos à cena do saloon
    const narrow = window.matchMedia("(max-width: 560px)");
    function placePanel() {
      const inline = narrow.matches;
      (inline ? sceneOf("saloon").fig : layerOf("saloon")).appendChild(panel);
      panel.classList.toggle("inline", inline);
    }
    placePanel();
    narrow.addEventListener("change", placePanel);
    const invite = sayButton("Jogo da velha?", "O bartender convida você para um jogo da velha. Abrir o jogo");
    pin("saloon", invite, 246, 42);
    SALOON.invite = invite;
    function open() {
      placePanel(); panel.hidden = false; invite.hidden = true; SALOON.playing = true;
      const first = btns.find((b) => !b.disabled); if (first) first.focus({ preventScroll: true });
    }
    function close() { panel.hidden = true; invite.hidden = false; SALOON.playing = false; invite.focus({ preventScroll: true }); }
    invite.addEventListener("click", open);
    document.getElementById("velha-close").addEventListener("click", close);
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); close(); } });
    const winner = (c) => LINES.find((l) => c[l[0]] && c[l[0]] === c[l[1]] && c[l[1]] === c[l[2]]);
    function label(i) { return `Linha ${Math.floor(i / 3) + 1}, coluna ${(i % 3) + 1}: ` + (cells[i] === "x" ? "sua bala" : cells[i] === "o" ? "ferradura" : "vazia"); }
    function render(line) {
      btns.forEach((b, i) => {
        b.innerHTML = cells[i] === "x" ? HOLE : cells[i] === "o" ? SHOE : "";
        b.disabled = over || !!cells[i]; b.classList.toggle("win", !!line && line.includes(i));
        b.setAttribute("aria-label", label(i));
      });
      document.getElementById("velha-score").textContent = `Você ${tally.you} · Empates ${tally.draw} · Bartender ${tally.bar}`;
    }
    // o bartender joga direito, mas não é perfeito: dá para armar um garfo nele
    function barMove() {
      const free = cells.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
      const closes = (mark) => free.find((i) => { const c = cells.slice(); c[i] = mark; return winner(c); });
      let m = closes("o");
      if (m === undefined) m = closes("x");
      if (m === undefined && !cells[4]) m = 4;
      if (m === undefined) { const corners = [0, 2, 6, 8].filter((i) => !cells[i]); const pool = corners.length ? corners : free; m = pool[Math.floor(Math.random() * pool.length)]; }
      cells[m] = "o";
    }
    function check() {
      const line = winner(cells);
      if (line) {
        over = true;
        if (cells[line[0]] === "x") { tally.you++; msg.textContent = "Você venceu! A próxima é por conta da casa."; }
        else { tally.bar++; msg.textContent = "O bartender fechou a linha."; }
        render(line); document.getElementById("velha-reset").focus({ preventScroll: true }); return true;
      }
      if (cells.every(Boolean)) { over = true; tally.draw++; msg.textContent = "Empate. Ninguém sai do balcão."; render(); document.getElementById("velha-reset").focus({ preventScroll: true }); return true; }
      return false;
    }
    function play(i) {
      if (over || cells[i]) return;
      cells[i] = "x";
      if (check()) return;
      barMove();
      if (check()) return;
      msg.textContent = "Sua vez."; render();
    }
    function reset() {
      cells = Array(9).fill(null); over = false;
      if (!youStart) { barMove(); msg.textContent = "O bartender começou. Sua vez."; } else msg.textContent = "Sua vez.";
      youStart = !youStart; render();
    }
    document.getElementById("velha-reset").addEventListener("click", () => { reset(); const f = btns.find((b) => !b.disabled); if (f) f.focus({ preventScroll: true }); });
    reset();
  })();

  // ================= Xerife: o guia da vila =================
  (function guide() {
    const say = document.getElementById("guide-say"), text = document.getElementById("guide-text"), menu = document.getElementById("guide-menu"), acts = document.getElementById("guide-actions"), btn = document.getElementById("guide-btn");
    const TIPS = {
      procurado: "Bom, parece que tem um forasteiro à solta... Fique ligeiro, o sujeito é bom de mira!",
      projetos: "Aqui a gente dá vida às ideia. Tem muita coisa no papel que logo vai pra forja! Clica num baú pra abrir e usa as setas pra trocar de projeto.",
      trabalhos: "É aqui que eu registro por onde o forasteiro passou e os feito dele mundo afora. Um trabalhão danado! Abre as fichas pra ver cargo, empresa e o que ele fez.",
      skills: "Nosso amigo Xavier vende os melhor revórvi da região. Se quiser um, é só dar uma olhada!",
      commits: "Aqui é nossa conexão com a internet. Num é das mais moderna, mas dá pro gasto!",
      formacao: "Shhh... Silêncio! É aqui que se formam os maior engenheiro de software da região!",
      saloon: "Opa, Tião! Bão? Trouxe um convidado. Fique à vontade por aqui!",
      duelo: "Rapaiz! Esqueci meu revórvi... Como é que nós vamo prender esse forasteiro agora?",
    };
    let open = false, here = "procurado";
    function action(label, fn, cls = "s-btn") {
      const b = document.createElement("button"); b.type = "button"; b.className = cls; b.textContent = label;
      b.addEventListener("click", fn); acts.appendChild(b); return b;
    }
    function show(html) {
      text.innerHTML = html; acts.innerHTML = ""; menu.hidden = true;
      say.hidden = false; open = true; btn.setAttribute("aria-expanded", "true");
    }
    function hide() { say.hidden = true; open = false; btn.setAttribute("aria-expanded", "false"); }
    function speak(line) { show(""); text.textContent = line; action("OK", hide); }
    GUIDE.say = speak;
    GUIDE.ask = (line, yes, fn) => { show(""); text.textContent = line; action(yes, () => { hide(); fn(); }); action("Não", hide, "link-btn"); };
    function greet() {
      show("Olá, seja bem-vindo ao vilarejo!<br><br>O que precisar, é só clicar em mim que eu te ajudo!");
      action("OK", hide);
    }
    btn.addEventListener("click", () => { if (open) hide(); else speak(TIPS[here]); });
    say.addEventListener("keydown", (e) => { if (e.key === "Escape") { hide(); btn.focus(); } });
    // só observa em silêncio qual área está na tela, para a fala certa quando o visitante clicar
    const seenH = {};
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { seenH[e.target.id] = e.isIntersecting ? e.intersectionRect.height : 0; });
      const best = Object.keys(seenH).sort((a, b) => seenH[b] - seenH[a])[0];
      if (best && seenH[best] > 0) here = best;
    }, { threshold: [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1] });
    Object.keys(TIPS).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    // a saudação aparece ao fim da chegada e a cada recarga; trocar de seção não repete
    document.addEventListener("vila:enter", () => { if (window.VilaAudio) window.VilaAudio.cue("village"); });
    document.addEventListener("vila:enter", () => { setTimeout(() => { if (!open) greet(); }, 1400); });

    // o desenho do xerife: chapéu, bigode e estrela; acena enquanto fala
    const cv = document.getElementById("guide-canvas"), g = cv.getContext("2d");
    const P = { skin: "#c89070", skinD: "#9a6a50", hair: "#6a6662", stache: "#8a8682", hat: "#4a3a2a", band: "#2a1e18", shirt: "#8a6a3c", vest: "#3e2e24", badge: true, blinkOff: 0.4 };
    let gt = 0;
    function drawGuide() {
      g.clearRect(0, 0, 28, 40);
      const cx = 14, talking = !say.hidden && !reduceMotion;
      O(g, cx - 6, 32, 5, 7, "#3a3230"); O(g, cx + 1, 32, 5, 7, "#3a3230");
      torso(g, cx, 19, P, 13);
      head(g, cx, 9, P, gt);
      limb(g, [[cx - 9, 22], [cx - 11, 27], [cx - 9, 31]], 3, P.shirt, P.skin);
      const w = talking ? Math.round(Math.sin(gt * 7) * 2) : 0;
      if (talking) limb(g, [[cx + 8, 22], [cx + 12, 17], [cx + 11 + w, 9]], 3, P.shirt, P.skin);
      else limb(g, [[cx + 8, 22], [cx + 10, 27], [cx + 8, 31]], 3, P.shirt, P.skin);
    }
    g.imageSmoothingEnabled = false;
    drawGuide();
    setInterval(() => { if (site.hidden || document.hidden) return; gt += 0.12; drawGuide(); }, 120);
  })();

  // ================= Contato =================
  document.getElementById("copy-email").addEventListener("click", async () => {
    const msg = document.getElementById("copy-msg");
    try { await navigator.clipboard.writeText("joaopedrosantanarosa@gmail.com"); msg.textContent = "E-mail copiado."; }
    catch {
      const r = document.createRange(); r.selectNodeContents(document.getElementById("email"));
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      msg.textContent = "Selecionei o e-mail: é só copiar.";
    }
  });
})();
