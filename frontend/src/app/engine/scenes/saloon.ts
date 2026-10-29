import { Ctx } from '../core/canvas';
import { engineEnv } from '../core/env';
import { clamp, lerp } from '../core/math';
import { SW } from '../core/stage';
import { disc, K, limb, O, R, seg } from '../draw/primitives';
import { head, Person, torso } from '../figures/people';
import { floorBoards, planksV, sign } from '../figures/props';
import { PIXEL_FONT_HEIGHT, pixelText, textWidth } from '../text/pixel-font';
import { tinyText } from '../text/tiny-font';
import { PianoState, PianoTimeline, SaloonState, WordBox } from './saloon-state';
import { SceneDef } from './scene';

interface Note { x: number; y: number; life: number; ph: number }
interface Puff { x: number; y: number; life: number }

// ---------- VI · Saloon ----------
export function createSaloon(PIANO: PianoState, SALOON: SaloonState): SceneDef {
  const barman: Person = { skin: '#d6a07a', skinD: '#a8735a', hair: '#2a1e18', hairH: 3, stache: '#2a1e18', shirt: '#ece4d4', vest: '#2a2a2e', tie: '#a8322a', blinkOff: 1.8 };
  let notes: Note[] = [], steam: Puff[] = [];

  function back(g: Ctx): void {
    R(g, 0, 0, SW, 88, '#6e2620');
    for (let y = 4; y < 88; y += 8) for (let x = (y / 8 % 2) * 6; x < SW; x += 12) { R(g, x, y, 1, 1, '#8a3a2a'); R(g, x - 1, y + 1, 3, 1, '#7e3024'); R(g, x, y + 2, 1, 1, '#8a3a2a'); }
    planksV(g, 0, 88, SW, 30, '#4a2a1c', '#3a1e14', 10); R(g, 0, 88, SW, 2, '#2a160e');
    floorBoards(g, 118, '#7a5034', '#5e3a24');
    // espelho e prateleiras do bar
    O(g, 204, 16, 100, 32, '#9ab0b0'); R(g, 210, 20, 2, 24, '#c8d8d8'); R(g, 216, 20, 1, 24, '#c8d8d8');
    O(g, 200, 14, 108, 3, '#8a5a34');
    O(g, 202, 58, 104, 3, '#6e4426');
    ([[208, '#c0a070'], [220, '#c0a070'], [232, '#c0a070']] as const).forEach(([x, c]) => { O(g, x, 49, 9, 9, c); R(g, x, 49, 9, 2, '#6e4426'); R(g, x + 2, 53, 5, 2, '#f3e3c3'); });
    ([[250, '#5a8a4a'], [258, '#8a3a2a'], [266, '#5a8a4a'], [278, '#c0902a'], [290, '#3a6a8a']] as const).forEach(([x, c]) => { O(g, x, 46, 5, 12, c); O(g, x + 1, 43, 3, 3, c); });
    sign(g, 254, 2, 'CAFÉ');
    // quadro do céu (astronomia)
    O(g, 160, 20, 38, 28, '#6e4426'); R(g, 162, 22, 34, 24, '#1e2a4a');
    disc(g, 186, 30, 4, '#f3efe2'); disc(g, 188, 29, 3, '#1e2a4a');
    // aviso clássico, na fonte maior
    O(g, 90, 18, 66, 34, '#f0dcb0'); R(g, 90, 18, 66, 1, '#fff0cc'); R(g, 122, 17, 2, 2, '#6a6662');
    tinyText(g, 'POR FAVOR', 123, 21, '#8a2a20', true);
    pixelText(g, 'NÃO ATIRE', 123, 30, '#2b1a10');
    pixelText(g, 'NO PIANISTA', 123, 41, '#2b1a10');
    // piano
    O(g, 16, 54, 70, 50, '#3a221a'); R(g, 20, 58, 62, 18, '#4a2e22'); R(g, 22, 60, 58, 1, '#5a3a2a');
    O(g, 18, 82, 66, 5, '#f3e3c3'); for (let x = 20; x < 84; x += 4) R(g, x, 82, 1, 3, K);
    R(g, 22, 104, 4, 14, '#3a221a'); R(g, 76, 104, 4, 14, '#3a221a');
    O(g, 42, 48, 3, 6, '#f3e3c3');
  }

  function front(g: Ctx): void {
    O(g, 190, 86, 130, 32, '#6e3e22');
    for (let x = 196; x < 320; x += 30) { R(g, x, 90, 24, 24, '#5a3018'); R(g, x, 90, 24, 1, '#3a1e10'); }
    O(g, 186, 82, 134, 4, '#a86a3a'); R(g, 186, 82, 134, 1, '#c88a5a');
    R(g, 186, 112, 134, 2, '#c0902a');
    // mesinha com xícara e livro
    O(g, 128, 98, 34, 3, '#6e4426'); R(g, 143, 101, 4, 17, '#5a3820'); R(g, 137, 116, 16, 2, '#5a3820');
    O(g, 132, 94, 12, 3, '#3a6a8a'); R(g, 132, 94, 12, 1, '#f3e3c3');
    O(g, 150, 93, 5, 4, '#f3e3c3');
    // banquinho do piano
    O(g, 40, 98, 18, 3, '#5a3820'); R(g, 42, 101, 2, 17, '#3a221a'); R(g, 54, 101, 2, 17, '#3a221a');
  }

  // ---- segredo da vela: o estado mora em PIANO e a linha do tempo anda no relógio da cena ----
  // (se o visitante sai do Saloon, o relógio para e a sequência continua de onde estava na volta)
  const NAO_X0 = Math.round(123 - textWidth('NÃO ATIRE') / 2), NAO_X1 = NAO_X0 + textWidth('NÃO') - 1;
  const NAO: WordBox = { x0: NAO_X0, x1: NAO_X1, y0: 27, y1: 30 + PIXEL_FONT_HEIGHT - 1, cx: (NAO_X0 + NAO_X1) / 2, cy: 32.5 };
  PIANO.word = NAO;
  // queima · pianista percebe · foge · Tião sai · chega no cartaz · joga fora · pendura · pianista volta · senta · toca · Tião no balcão · fim
  const TL: PianoTimeline = { burn: 1.6, notice: 1.8, run: 2.4, gone: 4.8, tiaoOut: 5.2, atSign: 8.5, toss: 9.3, hang: 9.8, hung: 11.0, back: 11.3, sit: 14.4, play: 14.7, tiaoBack: 14.3, end: 14.9 };
  PIANO.TL = TL;
  const noise = (x: number, y: number) => (((x * 73 + y * 151) % 17) + 17) % 17 / 17;
  // pinta a parede de volta onde o cartaz estava (mesma estampa do fundo)
  function wallPatch(g: Ctx, x0: number, y0: number, w: number, h: number): void {
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
    R(g, x0, y0, w, h, '#6e2620');
    for (let y = 4; y < 88; y += 8) for (let x = (y / 8 % 2) * 6; x < SW; x += 12) {
      if (x < x0 - 2 || x > x0 + w + 2 || y < y0 - 3 || y > y0 + h) continue;
      R(g, x, y, 1, 1, '#8a3a2a'); R(g, x - 1, y + 1, 3, 1, '#7e3024'); R(g, x, y + 2, 1, 1, '#8a3a2a');
    }
    g.restore();
  }
  // o fogo come só o "NÃO": parte da chama da vela, com brasa na frente e borda carbonizada atrás
  function burnWord(g: Ctx, k: number, t: number): void {
    const [ox, oy] = PIANO.origin;
    const rw = (NAO.x1 - NAO.x0) / 2 + 3, rh = 5.6, r = k * 26;
    for (let y = NAO.y0 - 4; y <= NAO.y1 + 4; y++) for (let x = NAO.x0 - 5; x <= NAO.x1 + 3; x++) {
      const n = noise(x, y);
      const q = ((x - NAO.cx) / rw) ** 2 + ((y - NAO.cy) / rh) ** 2 + n * 0.18;
      const d = Math.hypot(x - ox, y - oy) + n * 3;
      if (q < 1) {
        if (d < r - 2.2) R(g, x, y, 1, 1, '#3a1610');
        else if (d < r - 0.8) R(g, x, y, 1, 1, '#1e0e08');
        else if (d < r + 0.6 && k < 1) R(g, x, y, 1, 1, Math.sin(t * 30 + x * 3 + y) > 0 ? '#ffb030' : '#ff6a20');
        else if (d < r + 2 && k < 1) R(g, x, y, 1, 1, '#a8743a');
      } else if (q < 1.32 && d < r) R(g, x, y, 1, 1, q < 1.15 ? '#7a4a22' : '#c09058');
    }
    // fumacinha subindo enquanto queima
    if (k < 1 && !engineEnv.reduceMotion) for (let i = 0; i < 4; i++) {
      const s = (t * 0.9 + i / 4) % 1;
      R(g, Math.round(ox + Math.sin(t * 3 + i * 2) * 3 + i - 2), Math.round(oy - 4 - s * 16), 1, 1, `rgba(200,190,180,${0.55 * (1 - s)})`);
    }
  }
  // pianista em pé: foge em pânico ou volta envergonhado
  function runner(g: Ctx, x: number, t: number, panic: boolean, dir = 1): void {
    x = Math.round(x);
    const b = -dir;
    const a = Math.round(Math.sin(t * (panic ? 26 : 9)) * 3);
    O(g, x - 5 + a, 98, 4, 15, '#1e1e2a'); O(g, x + 1 - a, 98, 4, 15, '#1e1e2a');
    O(g, x - 7 + a, 112, 6, 3, '#1a120e'); O(g, x - 1 - a, 112, 6, 3, '#1a120e');
    O(g, x - 7, 78, 14, 21, '#2a2a3a'); R(g, x - 1, 80, 2, 6, '#ece4d4');
    O(g, x - 5, 67, 10, 11, '#c08a64'); R(g, x - 5, 67, 10, 3, '#3a2418');
    if (panic) {
      R(g, x - 3, 71, 2, 2, K); R(g, x + 1, 71, 2, 2, K); R(g, x - 1, 75, 3, 2, '#5a2a1a');
      const w = Math.round(Math.sin(t * 22) * 3);
      limb(g, [[x - 8, 80], [x - 12, 72], [x - 14 + w, 63]], 3, '#2a2a3a', '#c08a64');
      limb(g, [[x + 7, 80], [x + 11, 72], [x + 13 - w, 63]], 3, '#2a2a3a', '#c08a64');
      if (Math.sin(t * 9) > 0) { R(g, x + b * 8, 66, 1, 2, '#a8d8f0'); R(g, x + b * 11, 63, 1, 2, '#a8d8f0'); R(g, x - b * 9, 65, 1, 2, '#a8d8f0'); }
      R(g, x + b * 10, 111, 3, 2, 'rgba(200,170,130,0.6)'); R(g, x + b * 16, 109, 2, 2, 'rgba(200,170,130,0.4)'); R(g, x + b * 21, 112, 2, 1, 'rgba(200,170,130,0.3)');
    } else {
      R(g, x - 3, 72, 2, 1, K); R(g, x + 1, 72, 2, 1, K); R(g, x - 2, 75, 4, 1, '#7a4a3a');
      R(g, x - 4, 70, 2, 1, '#e8907a'); R(g, x + 2, 70, 2, 1, '#e8907a');
      limb(g, [[x - 8, 80], [x - 9, 88], [x - 8, 95 + a]], 3, '#2a2a3a', '#c08a64');
      limb(g, [[x + 7, 80], [x + 8, 88], [x + 7, 95 - a]], 3, '#2a2a3a', '#c08a64');
    }
  }
  // Tião sai de trás do balcão, troca o cartaz e volta
  function tiao(g: Ctx, e: number, t: number): void {
    let x: number, phase: 'walk' | 'pull' | 'toss' | 'hang' = 'walk', dir = -1;
    if (e < TL.atSign) x = lerp(252, 122, (e - TL.tiaoOut) / (TL.atSign - TL.tiaoOut));
    else if (e < TL.hung) { x = 122; phase = e < TL.toss ? 'pull' : e < TL.hang ? 'toss' : 'hang'; }
    else { x = lerp(122, 252, clamp((e - TL.hung) / (TL.tiaoBack - TL.hung))); dir = 1; }
    x = Math.round(x);
    const a = phase === 'walk' ? Math.round(Math.sin(t * 10) * 3) : 0;
    O(g, x - 5 + a, 86, 4, 27, '#2a2a2e'); O(g, x + 1 - a, 86, 4, 27, '#2a2a2e');
    O(g, x - 6 + a, 112, 6, 3, '#1a120e'); O(g, x - a, 112, 6, 3, '#1a120e');
    torso(g, x, 61, barman, 25);
    head(g, x, 50, { ...barman, look: 1 }, t);
    const arm = (pts: readonly (readonly [number, number])[]) => limb(g, pts, 3, barman.shirt, barman.skin);
    if (phase === 'walk') {
      arm([[x - 9, 63], [x - 10, 72], [x - 9 - a, 80]]); arm([[x + 8, 63], [x + 9, 72], [x + 8 + a, 80]]);
      if (dir < 0) { O(g, x + 7, 66, 4, 15, '#f0dcb0'); R(g, x + 7, 66, 4, 1, '#c8b080'); R(g, x + 7, 80, 4, 1, '#c8b080'); }
    } else if (phase === 'pull') {
      const k = (e - TL.atSign) / (TL.toss - TL.atSign);
      const hy = Math.round(lerp(42, 58, clamp((k - 0.35) / 0.65)));
      arm([[x - 9, 63], [x - 14, 52], [x - 11, hy]]); arm([[x + 8, 63], [x + 13, 52], [x + 10, hy]]);
      O(g, x + 16, 96, 4, 17, '#f0dcb0');
      if (k > 0.35) { O(g, x - 15, hy - 4, 30, 15, '#f0dcb0'); R(g, x - 11, hy - 1, 8, 6, '#3a1610'); R(g, x - 12, hy - 2, 10, 1, '#7a4a22'); }
    } else if (phase === 'toss') {
      const k = (e - TL.toss) / (TL.hang - TL.toss);
      arm([[x - 9, 63], [x - 16, 66], [x - 22, 70]]); arm([[x + 8, 63], [x + 10, 72], [x + 9, 80]]);
      O(g, x + 16, 96, 4, 17, '#f0dcb0');
      g.save(); g.globalAlpha = 1 - k * 0.7; g.translate(x - 30, Math.round(lerp(64, 106, k * k))); g.rotate(-k * 0.9);
      O(g, -11, -6, 22, 11, '#f0dcb0'); R(g, -8, -4, 6, 5, '#3a1610'); g.restore();
    } else {
      const k = (e - TL.hang) / (TL.hung - TL.hang);
      const hy = Math.round(clamp(14 + k * 41, 42, 54));
      arm([[x - 9, 63], [x - 15, 54], [x - 18, hy]]); arm([[x + 8, 63], [x + 14, 54], [x + 17, hy]]);
    }
    if (dir > 0 && e > TL.hung + 0.2) R(g, x - 1, 44, 2, 2, '#e8c878');
  }
  function drawCandle(g: Ctx, t: number): void {
    let pos: [number, number] | null = null;
    if (PIANO.candle === 'held') pos = [PIANO.cx, PIANO.cy];
    else if (PIANO.candle === 'burning') pos = [PIANO.origin[0], PIANO.origin[1] + 3];
    else if (PIANO.candle === 'returning') {
      const k = clamp((performance.now() - PIANO.retAt) / 450), ek = 1 - (1 - k) * (1 - k);
      pos = [lerp(PIANO.retFrom[0], PIANO.slot.x, ek), lerp(PIANO.retFrom[1], PIANO.slot.y - 1, ek)];
      if (k >= 1) PIANO.candle = 'lustre';
    }
    if (!pos) return;
    const x = Math.round(pos[0]), y = Math.round(pos[1]);
    disc(g, x, y - 3, 9, 'rgba(255,200,120,0.16)');
    O(g, x - 1, y, 2, 6, '#f3e3c3'); R(g, x - 1, y + 5, 2, 1, '#c8b898');
    R(g, x - 1, y - 3 - (Math.sin(t * 14) > 0 ? 1 : 0), 2, 2, '#ffd84a'); R(g, x - 1, y - 1, 2, 1, '#ffb030');
  }

  function draw(g: Ctx, t: number, dt: number): void {
    const e = PIANO.state === 'seq' ? t - PIANO.start : -1;
    // estrelas do quadro piscando
    [[166, 26], [172, 38], [178, 24], [192, 40], [168, 43], [184, 42]].forEach(([x, y], i) => R(g, x, y, 1, 1, Math.sin(t * 3 + i * 1.7) > 0.2 ? '#fff8d8' : '#5a6a8a'));
    // o cartaz: queimando, arrancado ou sendo pendurado de novo
    if (e >= 0) {
      if (e < TL.atSign) burnWord(g, Math.min(1, e / TL.burn), t);
      else if (e < TL.hung) {
        wallPatch(g, 86, 14, 72, 41);
        if (e >= TL.hang && PIANO.bc) { const h = Math.round(clamp((e - TL.hang) / (TL.hung - TL.hang)) * 41); if (h > 0) g.drawImage(PIANO.bc, 86, 14, 72, h, 86, 14, 72, h); }
      }
    }
    // lustre (a vela da direita pode ser pega)
    seg(g, 160, 0, 160, 12, 1, '#3a3634');
    const fl = Math.sin(t * 13) * 0.03;
    disc(g, 160, 16, 24, `rgba(255,200,120,${0.07 + fl})`);
    O(g, 148, 13, 24, 2, '#8a6a3a');
    [150, 156, 164, 170].forEach((x, i) => {
      if (i === 3 && PIANO.candle !== 'lustre') { R(g, x - 1, 12, 2, 1, '#5a4a2a'); return; }
      O(g, x - 1, 10, 2, 3, '#f3e3c3'); R(g, x - 1, 8 - (Math.sin(t * 9 + i) > 0 ? 1 : 0), 2, 2, i % 2 ? '#ffd84a' : '#ffb030');
    });
    // pianista
    const px = 50;
    const seated = e < TL.run || e >= TL.sit;
    const playing = e < TL.burn || e >= TL.play;
    if (seated) {
      const startled = e >= TL.notice && e < TL.run;
      const bob = playing && Math.sin(t * 2.2) > 0 ? 1 : 0, jump = startled ? -2 : 0, by = bob + jump;
      const pedal = playing && Math.sin(t * 1.1) > 0.4 ? 1 : 0;
      O(g, px - 6, 100, 4, 14, '#1e1e2a'); O(g, px + 2, 100, 4, 13 + pedal, '#1e1e2a');
      O(g, px - 7, 113, 6, 3, '#1a120e'); O(g, px + 1, 113 + pedal, 6, 3, '#1a120e');
      O(g, px - 3, 109, 8, 1, '#c0902a');
      O(g, px - 10, 79 + by, 4, 5, '#2a2a3a'); O(g, px + 6, 79 + by, 4, 5, '#2a2a3a');
      O(g, px - 7, 78 + by, 14, 20, '#2a2a3a');
      O(g, px - 5, 68 + by, 10, 10, '#3a2418'); R(g, px - 4, 76 + by, 8, 2, '#c08a64');
      O(g, px - 4, 63 + by, 8, 5, '#1e1a1a'); O(g, px - 6, 67 + by, 12, 1, '#1e1a1a');
      const lh = playing ? (Math.sin(t * 5.5) > 0 ? 0 : 2) : 0, rh = playing ? (Math.sin(t * 5.5 + 1.6) > 0 ? 0 : 2) : 0;
      if (startled) {
        limb(g, [[px - 9, 81 + by], [px - 13, 76], [px - 15, 70]], 3, '#2a2a3a', '#c08a64');
        limb(g, [[px + 8, 81 + by], [px + 12, 76], [px + 14, 70]], 3, '#2a2a3a', '#c08a64');
        R(g, px - 1, 50, 2, 7, '#ffd84a'); R(g, px - 1, 58, 2, 2, '#ffd84a');
      } else {
        limb(g, [[px - 9, 81 + by], [px - 12, 84], [px - 16, 81 + lh]], 3, '#2a2a3a', '#c08a64');
        limb(g, [[px + 8, 81 + by], [px + 10, 84], [px + 14, 81 + rh]], 3, '#2a2a3a', '#c08a64');
      }
    } else if (e < TL.gone) runner(g, px + (e - TL.run) * 125, t, true, 1);
    else if (e >= TL.back) runner(g, 345 - (e - TL.back) / (TL.sit - TL.back) * 295, t, false, -1);
    // o chapéu voa na fuga e fica em cima do piano até ele voltar
    if (e >= TL.run && e < TL.sit) {
      const hk = clamp((e - TL.run) / 0.7);
      const hx = Math.round(lerp(50, 66, hk)), hy = Math.round(lerp(63, 49, hk) - Math.sin(hk * Math.PI) * 16);
      O(g, hx - 4, hy, 8, 4, '#1e1a1a'); O(g, hx - 6, hy + 4, 12, 1, '#1e1a1a');
    }
    if (playing && !engineEnv.reduceMotion && Math.random() < dt * 1.1) notes.push({ x: 40 + Math.random() * 30, y: 50, life: 0, ph: Math.random() * 6 });
    notes = notes.filter((n) => (n.life += dt * 0.22) < 1);
    for (const n of notes) {
      const x = Math.round(n.x + n.life * 30 + Math.sin(n.life * 8 + n.ph) * 3), y = Math.round(n.y - n.life * 40);
      g.globalAlpha = 1 - n.life;
      R(g, x + 2, y, 1, 4, '#f3e3c3'); R(g, x, y + 3, 3, 2, '#f3e3c3'); R(g, x + 3, y, 2, 1, '#f3e3c3'); R(g, x + 4, y + 1, 1, 1, '#f3e3c3');
      g.globalAlpha = 1;
    }
    // garçom: passa café, ou sai para trocar o cartaz
    const away = e >= TL.tiaoOut && e < TL.tiaoBack;
    if (away) {
      PIANO.pourT = PIANO.start + TL.tiaoBack;
      O(g, 228, 76, 8, 6, '#f3e3c3'); R(g, 236, 77, 2, 3, K);
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
      O(g, 228, 76, 8, 6, '#f3e3c3'); R(g, 236, 77, 2, 3, K);
      const fill = clamp((ph - 0.2) / 0.28);
      if (ph < 0.98) R(g, 229, 82 - Math.round(fill * 5), 6, Math.round(fill * 5), '#5a3420');
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
      O(g, -8, -6, 9, 9, '#8a8682'); R(g, -8, -6, 9, 2, '#b0aca4'); O(g, -12, -3, 4, 2, '#8a8682'); O(g, -6, -8, 5, 2, '#5a5652');
      g.restore();
      if (pouring && lift > 0.9) R(g, 232, 70, 1, 8, '#5a3420');
      // vapor do café
      if (!engineEnv.reduceMotion && ph > 0.5 && Math.random() < 0.3) steam.push({ x: 231 + Math.random() * 3, y: 74, life: 0 });
      steam = steam.filter((s) => (s.life += dt * 0.45) < 1);
      for (const s of steam) R(g, s.x + Math.sin(s.life * 9) * 1.5, s.y - s.life * 16, 1, 1, `rgba(243,239,226,${0.6 * (1 - s.life)})`);
    }
    // a vela volta para o lustre logo depois de acender o papel
    if (PIANO.candle === 'burning' && e >= TL.burn + 0.25) { PIANO.retFrom = [PIANO.origin[0], PIANO.origin[1] + 3]; PIANO.retAt = performance.now(); PIANO.candle = 'returning'; }
    // o convite do jogo da velha some enquanto o Tião está fora
    const hideInvite = PIANO.state === 'seq' || SALOON.playing;
    if (SALOON.inviteHidden !== hideInvite) { SALOON.inviteHidden = hideInvite; SALOON.onInviteHidden?.(hideInvite); }
    if (e >= TL.end) { PIANO.state = 'idle'; if (PIANO.onDone) PIANO.onDone(); }
  }

  // lousinha de jogo da velha no balcão, ao lado do bartender
  function after(g: Ctx, t: number): void {
    O(g, 200, 72, 14, 10, '#2e3a30'); R(g, 200, 72, 14, 1, '#6a4024');
    R(g, 205, 74, 1, 7, '#dcd8c8'); R(g, 209, 74, 1, 7, '#dcd8c8'); R(g, 202, 76, 10, 1, '#dcd8c8'); R(g, 202, 79, 10, 1, '#dcd8c8');
    R(g, 203, 74, 1, 1, '#e8c878'); R(g, 211, 77, 1, 1, '#e8c878'); R(g, 207, 80, 1, 1, '#dcd8c8');
    drawCandle(g, t);
  }

  return { focus: 179, back, front, draw, after, acting: () => PIANO.state === 'seq' || PIANO.candle !== 'lustre' };
}
