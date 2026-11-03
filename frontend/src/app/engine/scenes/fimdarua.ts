import { Ctx } from '../core/canvas';
import { SH, SW } from '../core/stage';
import { sceneRng } from '../core/rng';
import { disc, limb, O, R, seg } from '../draw/primitives';
import { drawPlayerWeapon } from '../figures/duel-weapons';
import { drawGunslinger, duelHero, Duelist } from '../figures/duelist';
import { head, torso } from '../figures/people';
import { Hero } from '../heroes/heroes';
import { DuelState } from './duel-state';
import { SceneDef } from './scene';

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

  function duelists(g: Ctx, t: number, dt: number): void {
    const since = performance.now() - DUEL.shotAt;
    const youShoot = DUEL.phase === 'you', joaoShoot = DUEL.phase === 'joao';
    const tense = DUEL.phase === 'wait' || DUEL.phase === 'draw';
    // o João primeiro: assim o laço, o rolo e os tiros do visitante passam por cima dele
    drawGunslinger(g, 214, joao, -1, DUEL.hat.joao, joaoShoot, tense, t, false, DUEL.twitchAt);
    const me = duelHero(hero());
    const P: Duelist = hasGun() ? { ...me, gun: '#e8b030' } : { ...me };
    DUEL.anim.weapon = me.weapon!;
    if (me.weapon !== 'revolver') P.weaponDraw = (gg, cx) => drawPlayerWeapon(gg, cx, P, DUEL.anim, t);
    drawGunslinger(g, 110, P, 1, DUEL.hat.you, youShoot && me.weapon === 'revolver', tense, t, me.coat !== false, DUEL.twitchAt);
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
