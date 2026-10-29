import { Ctx } from '../core/canvas';
import { shade } from '../core/color';
import { clamp, lerp } from '../core/math';
import { sceneRng } from '../core/rng';
import { SH, SW } from '../core/stage';
import { disc, K, limb, O, Pt, R, seg } from '../draw/primitives';
import { Hero, Weapon } from '../heroes/heroes';
import { head, Person, torso } from '../figures/people';
import { DuelAnim, DuelState } from './duel-state';
import { SceneDef } from './scene';

/** um duelista de frente: a pessoa e o que ela veste da cintura para baixo */
export interface Duelist extends Person {
  pants?: string;
  boot?: string;
  skirt?: string;
  shawl?: string;
  bandoleer?: string;
  bigHair?: boolean;
  ponytail?: boolean;
  hatStyle?: Hero['hatStyle'];
  star?: string;
  coat?: boolean;
  coatD?: string | null;
  gun?: string;
  /** o chapéu que voa quando ele leva o tiro */
  flyHat?: string | null;
  weapon?: Weapon;
  weaponDraw?: (g: Ctx, cx: number) => void;
}

const forasteiro: Duelist = { skin: '#c48c64', skinD: '#8a5c40', hair: '#2a1e18', hairH: 2, beard: '#3a2a22', brow: '#1b120d', hat: '#2c2421', band: '#3e2e28', shirt: '#3c3230', scarf: '#8a2a22', blinkOff: 1.7 };

// o duelista do visitante é o personagem escolhido na tela inicial
export function duelHero(H: Hero | null | undefined): Duelist {
  if (!H || H.id === 'pistoleiro') return { ...forasteiro, flyHat: forasteiro.hat, weapon: 'revolver' };
  return {
    skin: H.skin, skinD: H.skinD, hair: H.hair, hairH: 2, brow: '#1b120d',
    beard: H.facial === 'beard' ? H.facialColor : null, stache: H.facial === 'stache' ? H.facialColor : null,
    goatee: H.facial === 'stubble' ? H.facialColor : null,
    hat: H.hat, hatStyle: H.hatStyle, band: H.band, star: H.star,
    shirt: H.coat || H.shirt, vest: H.vest, scarf: H.scarf, coatD: H.coat ? shade(H.coat, 0.75) : null,
    pants: H.pants, boot: H.boot, skirt: H.skirt, shawl: H.shawl, bandoleer: H.bandoleer,
    bigHair: H.hairStyle === 'big', ponytail: H.hairStyle === 'ponytail', tie: H.tie,
    glasses: H.glasses, blinkOff: 1.7, coat: !!H.coat, flyHat: H.hat || null, weapon: H.weapon || 'revolver',
  };
}

export interface FimDaRuaDeps {
  duel: DuelState;
  hero: () => Hero;
  hasGun: () => boolean;
}

// ---------- VII · Fim da rua ----------
// O João encostado no mourão ao pôr do sol; no duelo, os dois de frente e o visitante com a arma do seu personagem.
export function createFimDaRua({ duel: DUEL, hero, hasGun }: FimDaRuaDeps): SceneDef {
  const GY = 112;
  const joao: Duelist = { skin: '#d6a07a', skinD: '#a8735a', hair: '#2a1a12', curls: true, hat: '#9a6a3c', band: '#5a3820', goatee: '#5a3a2a', shirt: '#1e1a1a', vest: '#7a4a28', scarf: '#a6322a', blinkOff: 0.9 };
  let weedX = -40;
  // pistoleiro de frente; side = para que lado ele atira (+1 direita, -1 esquerda)
  function gunslinger(g: Ctx, cx: number, P: Duelist, side: number, hasHat: boolean, shooting: boolean, tense: boolean, t: number, coat: boolean): void {
    const pants = P.pants || '#2e2826', boot = P.boot || '#1e1612';
    O(g, cx - 6, 92, 5, 20, pants); O(g, cx + 1, 92, 5, 20, pants);
    R(g, cx - 6, 108, 5, 4, boot); R(g, cx + 1, 108, 5, 4, boot);
    if (P.skirt) { for (let y = 89; y < 109; y++) { const w = 7 + Math.floor((y - 89) / 5); R(g, cx - w - 1, y, w * 2 + 2, 1, K); R(g, cx - w, y, w * 2, 1, y > 105 ? shade(P.skirt, 0.8) : P.skirt); } }
    if (coat) { O(g, cx - 8, 88, 3, 12, P.coatD || '#26201e'); O(g, cx + 5, 88, 3, 12, P.coatD || '#26201e'); }
    // cabeleira volumosa e rabo de cavalo ficam atrás da cabeça
    if (P.bigHair) { disc(g, cx, 66, 10, K); disc(g, cx, 66, 9, P.hair!); disc(g, cx - 6, 70, 6, K); disc(g, cx - 6, 70, 5, P.hair!); disc(g, cx + 6, 70, 6, K); disc(g, cx + 6, 70, 5, P.hair!); R(g, cx - 5, 59, 3, 1, shade(P.hair!, 1.15)); }
    if (P.ponytail) { O(g, cx + 4, 64, 3, 15, P.hair!); R(g, cx + 4, 66, 3, 1, P.tie || '#e8c050'); }
    torso(g, cx, 74, P, 19);
    if (P.shawl) { R(g, cx - 8, 74, 16, 4, P.shawl); for (let i = 0; i < 5; i++) R(g, cx - 6 + i, 78 + i, 12 - i * 2, 1, P.shawl); }
    if (P.bandoleer) { for (let i = 0; i < 14; i++) { R(g, cx - 6 + i, 75 + i, 2, 2, P.bandoleer); if (i % 3 === 0) R(g, cx - 6 + i, 75 + i, 1, 1, '#e8c878'); } }
    if (!P.skirt) { R(g, cx - 7, 90, 14, 2, '#1e1612'); R(g, cx - 1, 90, 2, 2, '#c0b090'); }
    const hx = cx + side * 7;
    if (!P.weaponDraw) O(g, hx - 1, 91, 3, 6, '#5a3820');
    const customHat = P.hatStyle === 'halfmoon';
    head(g, cx, 63, { ...P, hat: hasHat && !customHat ? P.hat : null, look: 1 }, t);
    if (customHat && hasHat) {
      // chapéu de couro em meia-lua, com a estrela na frente
      [[0, 5], [1, 8], [2, 10], [3, 11], [4, 12]].forEach(([dy, w]) => { R(g, cx - w - 1, 57 + dy, w * 2 + 2, 1, K); R(g, cx - w, 57 + dy, w * 2, 1, dy === 4 ? shade(P.hat!, 0.75) : P.hat!); });
      R(g, cx - 1, 58, 2, 2, P.star || '#e8c050');
    }
    if (!hasHat && !P.bigHair) { R(g, cx - 5, 62, 10, 3, P.hair!); if (P.curls) { R(g, cx - 6, 61, 3, 3, P.hair!); R(g, cx - 1, 60, 3, 3, P.hair!); R(g, cx + 3, 61, 3, 3, P.hair!); } }
    if (P.weaponDraw) { P.weaponDraw(g, cx); return; }
    const off = side < 0 ? 8 : -9, gunSh = side < 0 ? -9 : 8;
    // braço livre, solto ao lado do corpo
    limb(g, [[cx + off, 77], [cx + off * 1.25, 84], [cx + off * 1.15, 91]], 3, P.shirt, P.skin);
    if (shooting) {
      limb(g, [[cx + gunSh, 77], [cx + side * 16, 78], [cx + side * 24, 78]], 3, P.shirt, P.skin);
      O(g, side > 0 ? cx + 24 : cx - 31, 76, 7, 2, P.gun || '#6a6662'); R(g, side > 0 ? cx + 24 : cx - 30, 78, 2, 3, '#5a3820');
    } else {
      const tw = (tense ? Math.round(Math.sin(t * 9)) : 0) - (side < 0 && performance.now() - DUEL.twitchAt < 280 ? 3 : 0);
      limb(g, [[cx + gunSh, 77], [cx + gunSh * 1.3, 84], [hx + side * 2, 89 + tw]], 3, P.shirt, P.skin);
      R(g, hx, 89, 2, 2, P.gun || '#6a6662');
    }
  }
  // ---- armas do visitante: cada personagem luta do seu jeito ----
  const ROPE = '#c8a060', ROPE_D = '#8a6a3a';
  function ellipsePts(g: Ctx, cx: number, cy: number, rx: number, ry: number, col: string, phase: number, step = 0.3): void {
    for (let a = 0; a < Math.PI * 2; a += step) R(g, Math.round(cx + Math.cos(a + phase) * rx), Math.round(cy + Math.sin(a + phase) * ry), 1, 1, col);
  }
  function ropeLine(g: Ctx, x0: number, y0: number, x1: number, y1: number, sag = 3): void {
    const n = Math.max(1, Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag), 1, 1, i % 4 === 0 ? ROPE_D : ROPE); }
  }
  function pistol(g: Ctx, x: number, y: number, col: string): void { O(g, x, y, 7, 2, col); R(g, x, y + 2, 2, 3, '#5a3820'); }
  function muzzle(g: Ctx, x: number, y: number, big?: boolean): void { disc(g, x, y, big ? 6 : 4, '#fff6c0'); disc(g, x, y, big ? 3 : 2, '#ffffff'); }
  function smoke(g: Ctx, x: number, y: number, k: number): void { for (let i = 0; i < 5; i++) { const s = clamp(k * 1.2 - i * 0.12); if (s <= 0 || s >= 1) continue; R(g, Math.round(x + s * 12 + i), Math.round(y - s * 10 - i), 2, 2, `rgba(220,214,200,${0.55 * (1 - s)})`); } }
  function rollingPin(g: Ctx, x: number, y: number, ang: number): void {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.rotate(ang);
    O(g, -6, -1, 12, 3, '#c89a5a'); R(g, -5, -1, 10, 1, '#e0b878'); R(g, -9, 0, 3, 1, '#8a5a2a'); R(g, 6, 0, 3, 1, '#8a5a2a');
    g.restore();
  }
  function rifleLine(g: Ctx, x0: number, y0: number, x1: number, y1: number, metal: string): void {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) { const k = i / n; R(g, Math.round(lerp(x0, x1, k)), Math.round(lerp(y0, y1, k)), 1, 2, k < 0.36 ? '#7a4a28' : k < 0.48 ? '#3a3634' : metal); }
  }
  function playerWeapon(g: Ctx, cx: number, P: Duelist, A: DuelAnim, t: number): void {
    const now = performance.now(), since = now - A.at;
    const arm = (pts: readonly Pt[]) => limb(g, pts, 3, P.shirt, P.skin);
    const metal = P.gun || '#6a6662';
    const tw = A.mode === 'wait' || A.mode === 'draw' ? Math.round(Math.sin(t * 9)) : 0;
    const idleLeft = () => arm([[cx - 9, 77], [cx - 11, 84], [cx - 10, 91]]);
    if (A.weapon === 'twin') {
      // dois coldres; no saque as duas pistolas sobem juntas, cada uma com o seu disparo
      O(g, cx - 9, 91, 3, 6, '#5a3820'); O(g, cx + 6, 91, 3, 6, '#5a3820');
      if (!A.shots.length) {
        arm([[cx - 9, 77], [cx - 11, 84], [cx - 9, 89 + tw]]); arm([[cx + 8, 77], [cx + 10, 84], [cx + 8, 89 - tw]]);
        R(g, cx - 9, 89, 2, 2, metal); R(g, cx + 7, 89, 2, 2, metal);
        return;
      }
      arm([[cx - 9, 78], [cx + 4, 84], [cx + 20, 82]]); pistol(g, cx + 20, 80, metal);
      arm([[cx + 8, 77], [cx + 16, 77], [cx + 24, 76]]); pistol(g, cx + 24, 74, metal);
      A.shots.forEach((s) => { const d = now - s.at; if (d < 150) muzzle(g, s.side === 'R' ? cx + 33 : cx + 29, s.side === 'R' ? 75 : 81); else if (d < 900) smoke(g, s.side === 'R' ? cx + 32 : cx + 28, s.side === 'R' ? 73 : 79, d / 900); });
      return;
    }
    if (A.weapon === 'lasso') {
      idleLeft();
      if (A.mode === 'spin') {
        // girando o laço por cima da cabeça: quanto mais tempo, mais rápido
        arm([[cx + 8, 77], [cx + 11, 67], [cx + 12, 58]]);
        const ph = (now / 1000) * (7 + A.charge * 12);
        ellipsePts(g, cx + 12, 51, 11, 3, ROPE, ph, 0.26);
        ropeLine(g, cx + 12, 58, Math.round(cx + 12 + Math.cos(ph) * 11), Math.round(51 + Math.sin(ph) * 3), 0);
        if (Math.sin(now / 70) > 0.3) R(g, Math.round(cx + 12 + Math.cos(ph + 1) * 13), 50, 2, 1, 'rgba(255,255,255,0.6)');
        return;
      }
      if (A.mode === 'throw' || A.mode === 'caught' || A.mode === 'fall') {
        arm([[cx + 8, 77], [cx + 16, 72], [cx + 22, 70]]);
        const k = clamp(since / 420), ek = 1 - (1 - k) * (1 - k);
        const tx = A.mode === 'fall' ? 168 : 214, ty = A.mode === 'fall' ? 110 : 82;
        const lx = lerp(cx + 22, tx, ek), ly = lerp(58, ty, ek) - Math.sin(k * Math.PI) * 18;
        ropeLine(g, cx + 22, 70, Math.round(lx), Math.round(ly), A.mode === 'fall' ? 6 : 3);
        if (A.mode === 'caught' && k >= 1) {
          // laçado: duas voltas de corda prendem os braços do João, e ele balança
          const wob = Math.round(Math.sin(now / 90) * 1);
          ellipsePts(g, 214 + wob, 80, 10, 2, ROPE, 0, 0.18); ellipsePts(g, 214 + wob, 86, 10, 2, ROPE, 1.1, 0.18);
          if (since < 700) for (let i = 0; i < 6; i++) R(g, 214 + Math.round(Math.cos(i) * (6 + since / 60)), 82 + Math.round(Math.sin(i) * (2 + since / 200)), 1, 1, '#fff6c0');
        } else ellipsePts(g, Math.round(lx), Math.round(ly), lerp(11, 7, k), lerp(3, 4, k), ROPE, k * 7, 0.28);
        return;
      }
      // laço enrolado na cintura
      arm([[cx + 8, 77], [cx + 10, 84], [cx + 10, 90 - tw]]);
      ellipsePts(g, cx + 11, 93, 4, 3, ROPE, 0, 0.35); ellipsePts(g, cx + 11, 93, 3, 2, ROPE_D, 0.5, 0.45);
      return;
    }
    if (A.weapon === 'pin') {
      if (A.mode === 'wind') {
        // tomando impulso: o rolo sobe, treme mais a cada toque e sai fumaça da cabeça
        const sh = Math.round(Math.sin(now / 35) * (1 + A.charge * 2.5));
        arm([[cx - 9, 77], [cx - 13, 67], [cx - 7 + sh, 56]]); arm([[cx + 8, 77], [cx + 12, 67], [cx + 6 + sh, 56]]);
        rollingPin(g, cx + sh, 55, 0);
        if (A.charge > 0.35) for (let i = 0; i < 3; i++) { const s = ((now / 500) + i / 3) % 1; R(g, cx - 7 + i * 6, Math.round(52 - s * 12), 2, 2, `rgba(255,255,255,${0.75 * (1 - s)})`); }
        if (A.charge > 0.65) { R(g, cx - 4, 66, 2, 1, '#c0392b'); R(g, cx + 2, 66, 2, 1, '#c0392b'); }
        return;
      }
      if (A.mode === 'throw') {
        idleLeft(); arm([[cx + 8, 77], [cx + 16, 70], [cx + 22, 66]]);
        const k = clamp(since / 360);
        if (k < 1) rollingPin(g, lerp(cx + 22, 211, k), lerp(62, 60, k) - Math.sin(k * Math.PI) * 14, k * 14);
        else {
          // PLAFT: o rolo quica de volta e cai; estrelinhas girando na cabeça do João
          const k2 = clamp((since - 360) / 650);
          rollingPin(g, lerp(207, 186, k2), lerp(58, 110, k2 * k2), 14 + k2 * 7);
          if (since - 360 < 240) { disc(g, 214, 60, 7, '#fff6c0'); [[-11, 0], [11, 0], [0, -11], [0, 11], [-8, -8], [8, 8], [-8, 8], [8, -8]].forEach(([dx, dy]) => R(g, 214 + dx, 60 + dy, 2, 2, '#f6d870')); }
          for (let i = 0; i < 3; i++) { const a = now / 240 + i * 2.1; R(g, Math.round(214 + Math.cos(a) * 9), Math.round(55 + Math.sin(a) * 2), 2, 2, i % 2 ? '#f6d870' : '#ffffff'); }
        }
        return;
      }
      if (A.mode === 'drop') {
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
    if (A.weapon === 'rifle') {
      if (A.mode === 'cock' || A.mode === 'aim' || A.mode === 'fire') {
        // rifle no ombro: engatilha, a mira balança e dispara com coice e fumaça
        const sway = A.mode === 'aim' ? Math.round(Math.sin(now / 150)) : 0;
        const recoil = A.mode === 'fire' && since < 170 ? -3 : 0;
        arm([[cx - 9, 77], [cx + 2, 81], [cx + 13 + recoil, 77 + sway]]); arm([[cx + 8, 77], [cx + 5, 80], [cx + 2 + recoil, 76 + sway]]);
        rifleLine(g, cx - 3 + recoil, 75 + sway, cx + 31 + recoil, 75 + sway, metal);
        if (A.mode === 'cock' && since < 280) { R(g, cx + 9, 77 + sway + (since < 140 ? 2 : 0), 3, 3, '#3a3634'); if (since > 120) R(g, cx + 12, 71, 2, 1, '#fff6c0'); }
        if (A.mode === 'fire') {
          if (since < 190) { muzzle(g, cx + 35, 75, true); g.fillStyle = 'rgba(255,248,220,0.4)'; g.fillRect(0, 0, SW, SH); }
          smoke(g, cx + 33, 72, since / 1100);
        }
        return;
      }
      arm([[cx - 9, 77], [cx - 6, 86], [cx - 2, 91 + tw]]); arm([[cx + 8, 77], [cx + 10, 82], [cx + 8, 79 + tw]]);
      rifleLine(g, cx - 6, 97, cx + 12, 73, metal);
      return;
    }
  }
  function duelists(g: Ctx, t: number, dt: number): void {
    const since = performance.now() - DUEL.shotAt;
    const youShoot = DUEL.phase === 'you', joaoShoot = DUEL.phase === 'joao';
    const tense = DUEL.phase === 'wait' || DUEL.phase === 'draw';
    // o João primeiro: assim o laço, o rolo e os tiros do visitante passam por cima dele
    gunslinger(g, 214, joao, -1, DUEL.hat.joao, joaoShoot, tense, t, false);
    const me = duelHero(hero());
    const P: Duelist = hasGun() ? { ...me, gun: '#e8b030' } : { ...me };
    DUEL.anim.weapon = me.weapon!;
    if (me.weapon !== 'revolver') P.weaponDraw = (gg, cx) => playerWeapon(gg, cx, P, DUEL.anim, t);
    gunslinger(g, 110, P, 1, DUEL.hat.you, youShoot && me.weapon === 'revolver', tense, t, me.coat !== false);
    if (DUEL.phase === 'draw') { [110, 214].forEach((x) => { R(g, x - 1, 46, 2, 5, '#c0392b'); R(g, x - 1, 52, 2, 2, '#c0392b'); }); }
    if (since < 160 && ((youShoot && me.weapon === 'revolver') || joaoShoot)) {
      const mx = youShoot ? 141 : 183;
      disc(g, mx, 77, 4, '#fff6c0'); disc(g, mx, 77, 2, '#ffffff');
      g.fillStyle = 'rgba(255,248,220,0.35)'; g.fillRect(0, 0, SW, SH);
    }
    DUEL.flying.forEach((h) => {
      if (h.y < h.ground) { h.x += h.vx * dt * 60; h.y += h.vy * dt * 60; h.vy += 0.14 * dt * 60; h.r += h.vx * 0.12 * dt * 60; } else h.y = h.ground;
      g.save(); g.translate(Math.round(h.x), Math.round(h.y)); g.rotate(h.r);
      O(g, -8, -1, 16, 1, h.col); O(g, -4, -5, 8, 4, h.col);
      g.restore();
    });
  }
  function back(g: Ctx): void {
    const sky = ['#2e2440', '#4a2e4a', '#7a3a4a', '#a8503e', '#d8703e', '#f2a65a', '#f6c47a'];
    sky.forEach((c, i) => R(g, 0, i * 12, SW, 12, c));
    R(g, 0, 84, SW, 28, '#f6c47a');
    disc(g, 80, 96, 16, '#ffe0a0'); disc(g, 80, 96, 13, '#fff3c8');
    // serra
    g.fillStyle = '#6a3a4a';
    for (let x = 0; x < SW; x++) { const h = 14 + Math.round(Math.sin(x * 0.04) * 6 + Math.sin(x * 0.013 + 2) * 8); g.fillRect(x, 98 - h, 1, h + 14); }
    g.fillStyle = '#8a4a48';
    for (let x = 0; x < SW; x++) { const h = 6 + Math.round(Math.sin(x * 0.07 + 1) * 3 + Math.sin(x * 0.02) * 4); g.fillRect(x, 104 - h, 1, h + 8); }
    R(g, 0, GY - 6, SW, SH - GY + 6, '#c89458');
    R(g, 0, GY + 8, SW, SH - GY, '#b07a48');
    const rnd = sceneRng;
    rnd.seed = 12; for (let i = 0; i < 160; i++) R(g, Math.floor(rnd.next() * SW), GY - 6 + Math.floor(rnd.next() * 44), 2, 1, rnd.next() < 0.5 ? '#a86e40' : '#d8a468');
    // varanda do saloon à direita
    O(g, 228, 26, 92, 6, '#6e3e22');
    R(g, 232, 32, 88, 76, '#8a3a22'); for (let x = 236; x < SW; x += 6) R(g, x, 32, 1, 76, '#6e2a18');
    O(g, 262, 60, 24, 48, '#3a1e10'); R(g, 264, 70, 9, 12, '#8a5a34'); R(g, 275, 70, 9, 12, '#8a5a34');
    O(g, 240, 46, 14, 12, '#2b2420'); R(g, 241, 47, 12, 11, 'rgba(255,200,100,0.5)');
    O(g, 224, 104, 96, 6, '#9a6a40');
    // poste de lampião
    O(g, 56, 52, 3, 60, '#3a3634'); O(g, 52, 50, 11, 2, '#3a3634');
    // mourão onde o João se encosta
    O(g, 186, 72, 5, 40, '#6e4426'); R(g, 186, 72, 2, 40, '#8a5a34');
    O(g, 150, 80, 60, 3, '#8a5a34'); O(g, 152, 83, 3, 29, '#6e4426');
  }
  function draw(g: Ctx, t: number, dt: number): void {
    // estrelas aparecendo
    [[20, 8], [52, 20], [96, 6], [140, 16], [180, 4], [214, 14], [300, 8], [262, 20], [120, 28]].forEach(([x, y], i) => {
      if (Math.sin(t * 1.4 + i * 2.1) > -0.3) R(g, x, y, 1, 1, '#fff3d6');
    });
    // lampião com mariposas
    const fl = 0.18 + Math.sin(t * 11) * 0.03;
    disc(g, 57, 56, 16, `rgba(255,210,130,${fl})`);
    O(g, 53, 52, 9, 9, '#3a3634'); R(g, 55, 54, 5, 5, Math.sin(t * 15) > 0 ? '#ffd84a' : '#ffc040');
    for (let i = 0; i < 3; i++) R(g, 57 + Math.cos(t * (2 + i) + i) * 9, 56 + Math.sin(t * (3 + i) + i * 2) * 7, 1, 1, '#f3e3c3');
    // o sino do saloon (balança quando toca no duelo)
    const sinceBell = performance.now() - DUEL.bellAt;
    const bsw = sinceBell < 1600 ? Math.round(Math.sin(sinceBell / 70) * 3 * (1 - sinceBell / 1600)) : 0;
    seg(g, 238, 32, 238 + bsw, 36, 1, '#3a3634'); O(g, 235 + bsw, 36, 6, 5, '#c0902a'); R(g, 237 + bsw, 41, 2, 1, '#8a6a3a');
    if (DUEL.on) { duelists(g, t, dt); }
    else {
      // João encostado, braços cruzados, respirando
      const cx = 196, breathe = Math.sin(t * 1.5) > 0.4 ? 1 : 0;
      O(g, cx - 6, 92, 5, 20, '#3a3230'); O(g, cx + 1, 92, 5, 20, '#3a3230');
      R(g, cx - 6, 108, 5, 4, '#2a1e18'); R(g, cx + 1, 108, 5, 4, '#2a1e18');
      torso(g, cx, 74 + breathe, joao, 19);
      const tip = (t % 9) > 7.6 && (t % 9) < 8.6;
      head(g, cx, tip ? 64 : 63 + breathe, { ...joao, look: 1 }, t);
      limb(g, [[cx - 9, 77 + breathe], [cx - 8, 84], [cx + 5, 84]], 3, joao.shirt, joao.skin);
      if (tip) limb(g, [[cx + 8, 77], [cx + 10, 70], [cx + 6, 60]], 3, joao.shirt, joao.skin);
      else limb(g, [[cx + 8, 77 + breathe], [cx + 8, 85], [cx - 5, 86]], 3, joao.shirt, joao.skin);
      const fl2 = Math.round(Math.sin(t * 5) * 1.5);
      R(g, cx + 3, 78 + breathe, 2, 3, joao.scarf!); R(g, cx + 5 + fl2, 80 + breathe, 2, 2, joao.scarf!);
    }
    // bola de feno
    weedX += dt * 16;
    if (weedX > SW + 40) weedX = -60 - Math.random() * 120;
    const wy = GY + 10 - Math.abs(Math.sin(weedX * 0.08)) * 4;
    disc(g, weedX, wy, 5.5, '#5a4024'); disc(g, weedX, wy, 4.5, '#9a7a44');
    for (let i = 0; i < 4; i++) { const a = weedX * 0.15 + i * 1.6; R(g, weedX + Math.cos(a) * 3, wy + Math.sin(a) * 3, 1, 1, '#5a4024'); }
  }
  // o duelo anda sozinho com movimento reduzido (chapéus voando, disparos)
  return { focus: 180, back, draw, acting: () => DUEL.on };
}
