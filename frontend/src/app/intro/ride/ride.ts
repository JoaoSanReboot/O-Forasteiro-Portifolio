import { VilaAudio } from '../../engine/audio/vila-audio';
import { cancelRaf, raf } from '../../engine/core/browser';
import { clamp, easeIn, lerp, prog, smooth } from '../../engine/core/math';
import { Rng } from '../../engine/core/rng';
import { ditherFill as dither } from '../../engine/draw/dither';
import { drawHero } from '../../engine/heroes/hero-sprite';
import { Hero } from '../../engine/heroes/heroes';
import { Arrival } from './arrival';
import { drawGround, drawMount, drawMountains, drawSky, drawTownAt } from './landscape';
import { createPalette, dressRider } from './palette';
import { DustCloud, FlyingPapers, Tumbleweeds } from './particles';
import { buildPoster, drawPosterLayer } from './poster';
import { Roadside } from './roadside';
import { buildSprites, RideSprites } from './sprites';
import { RideView } from './stage';
import { Tale } from './tale';
import { TIMELINE as P } from './timeline';

// A abertura: cena de tela cheia em canvas de baixa resolução, narração na faixa de cima e
// o cartaz em canvas de alta resolução por cima. Mundo único (sertão ao entardecer).
// Aqui fica só o laço: o relógio da história, o que desenhar em cada fase e os sons nos momentos certos.
// O estado que muda a cada quadro fica em variáveis comuns, fora dos Signals.

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

export function createRide(els: RideElements, hooks: RideHooks): Ride {
  const { stage: canvas, poster: pcan } = els;
  const ctx = canvas.getContext('2d')!;
  const pctx = pcan.getContext('2d')!;
  const Audio = hooks.audio;
  const view: RideView = { ctx, W: 320, H: 180, horizon: 85 };
  // uma única sequência de números para a estrada, os sprites e o cartaz (as sementes fixas deixam tudo igual a cada visita)
  const rng = new Rng(7);
  const pal = createPalette();
  const ditherFill = (color: string, amount: number) => dither(ctx, view.W, view.H, color, amount);

  function resize(): void {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    if (aspect >= 1) { view.H = 180; view.W = Math.round(clamp(view.H * aspect, 180, 400)); }
    else { view.W = 180; view.H = Math.round(clamp(view.W / aspect, 180, 400)); }
    canvas.width = view.W; canvas.height = view.H;
    view.horizon = Math.round(view.H * (aspect < 0.8 ? 0.56 : 0.47));
    ctx.imageSmoothingEnabled = false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    pcan.width = Math.round(window.innerWidth * dpr);
    pcan.height = Math.round(window.innerHeight * dpr);
  }

  // ---------- Sprites: a cavalgada usa o mesmo personagem, de costas, e pinta as pernas com as cores dele ----------
  const riderImg = new Image();
  riderImg.src = 'assets/forasteiro-costas.png';
  let spr: RideSprites | null = null;
  function rebuild(): void {
    const h = hooks.hero();
    const rider = drawHero(h, 'back', riderImg);
    dressRider(pal, h);
    spr = buildSprites(pal, rider, rng);
  }

  // ---------- Cartaz: só é montado quando as fontes e o retrato estão prontos ----------
  const portrait = new Image();
  portrait.src = 'assets/retrato.png';
  let posterCanvas: HTMLCanvasElement | null = null;

  // ---------- Mundo ----------
  const papers = new FlyingPapers(view, pal, rng);
  const roadside = new Roadside(view, pal, rng, papers);
  const weeds = new Tumbleweeds(view, rng);
  const dust = new DustCloud(view, rng);
  const arrival = new Arrival(view, pal, rng);
  const tale = new Tale(els.tale, els.taleSr);
  let p = 0;

  function resetWorld(): void {
    roadside.reset(p);
    weeds.reset(); dust.reset(); papers.reset();
  }

  // ---------- Controle de velocidade ----------
  let boosting = false, rate = 1;
  function setBoost(on: boolean): void { boosting = on; els.hint.classList.toggle('boost', on); }

  // ---------- Laço principal ----------
  let dist = 0, last = 0, wall = 0, running = false, finished = false, rafId = 0;
  let animPhase = 0, lastFrame = -1, swelled = false, flapped = false, ended = false;

  function frame(now: number): void {
    if (!running) return;
    if (hooks.siteOn() && window.scrollY > window.innerHeight * 1.05) { last = now; rafId = raf(frame); return; }
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    wall += dt;
    const target = boosting && p < P.posterArrive ? 2.4 : 1;
    rate += (target - rate) * Math.min(1, dt * 3.5);
    p += dt * rate;
    render(dt);
    rafId = raf(frame);
  }

  function render(dt: number): void {
    const riding = p < P.posterLeave;
    if (riding) {
      const speed = 34 * rate;
      dist += speed * dt;
      const approach = smooth(prog(p, 0, P.townFull));
      drawSky(view, wall);
      drawMountains(view);
      drawTownAt(view, spr!.town, wall, lerp(0.3, 1.7, easeIn(approach)), lerp(1.4, 0.6, approach));
      drawGround(view, pal, dist);
      roadside.drawProps(speed * dt, p, spr!);
      roadside.drawPoles(speed * dt);
      weeds.update(p, dt, rate, spr!);
      // galope: velocidade dos quadros acompanha o cavalo
      animPhase += dt * 8.5 * Math.pow(rate, 0.7);
      const f = Math.floor(animPhase) % 4;
      if (f !== lastFrame) {
        if (f === 0 || f === 2) Audio.clop((f === 0 ? 0.26 : 0.16) * (0.8 + rate * 0.2));
        if (f === 1 && rate > 1.4) Audio.clop(0.1);
        lastFrame = f;
      }
      drawMount(view, spr, f);
      const intensity = easeIn(prog(p, P.dustFrom, P.fogFull));
      dust.emit(dt, intensity, rate);
      dust.draw(dt);
      ditherFill('#d9b88a', smooth(prog(p, P.fogStart, P.fogFull)));
      papers.update(p, dt, rate);
      if (!swelled && p > P.fogStart) { swelled = true; Audio.swell((P.fogFull - P.fogStart) / rate + 1.5); }
    } else {
      if (!ended) { ended = true; Audio.finale(); }
      arrival.draw(wall, spr!);
      ditherFill('#d9b88a', 1 - smooth(prog(p, P.posterLeave, P.revealEnd)));
      papers.update(p, dt, 1);
    }
    if (!flapped && p > P.posterStart + 1.2) { flapped = true; Audio.flap(); }
    ditherFill('#1b120d', 1 - smooth(prog(p, 0, P.fadeIn)));
    tale.update(p);
    drawPosterLayer(pctx, posterCanvas, p, wall);
    els.hint.style.opacity = p > 2 && p < P.posterArrive - 0.5 ? '1' : '0';
    hooks.cinema(p > 0.3 && p < P.posterStart + 1.0);
    if (p >= P.arrivalText && !finished) { finished = true; hooks.onFinish(); }
  }

  function begin(reduceMotion: boolean): void {
    finished = false; swelled = false; flapped = false; ended = false;
    p = 0; dist = 0; wall = 0; rate = 1; animPhase = 0; lastFrame = -1; setBoost(false);
    resetWorld(); tale.reset();
    Audio.cue('ride', true);
    void Audio.unlock().then(() => Audio.wind());
    if (reduceMotion) { skip(); return; }
    running = true; last = performance.now();
    cancelRaf(rafId); rafId = raf(frame);
  }

  function skip(): void {
    p = P.revealEnd; ended = false;
    running = true; last = performance.now();
    cancelRaf(rafId); rafId = raf(frame);
    if (!finished) { finished = true; hooks.onFinish(); }
  }

  const redrawGate = () => { if (!running) { arrival.draw(0, spr!); ditherFill('#1b120d', 0.6); } };

  const fontsReady = document.fonts
    ? Promise.race([
        Promise.all(['86px Rye', '23px "IM Fell English SC"', 'italic 28px "IM Fell English"'].map((f) => document.fonts.load(f))),
        new Promise((r) => setTimeout(r, 2500)),
      ])
    : Promise.resolve();
  const portraitReady = new Promise<void>((r) => { if (portrait.complete) r(); else { portrait.onload = () => r(); portrait.onerror = () => r(); } });
  void Promise.all([fontsReady, portraitReady]).then(() => { posterCanvas = buildPoster(portrait, rng); });

  resize();
  rebuild();
  resetWorld();

  return {
    begin,
    skip,
    // "Rever a chegada" volta para a tela inicial
    stop() { running = false; finished = false; cancelRaf(rafId); },
    setBoost,
    get boosting() { return boosting; },
    get riding() { return running && !finished; },
    rebuild,
    resize,
    redrawGate,
    destroy() { running = false; cancelRaf(rafId); },
    riderImg,
  };
}
