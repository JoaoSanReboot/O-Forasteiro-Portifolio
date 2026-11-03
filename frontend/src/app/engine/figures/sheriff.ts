import { Ctx } from '../core/canvas';
import { limb, O } from '../draw/primitives';
import { head, Person, torso } from './people';

// o desenho do xerife: chapéu, bigode e estrela; acena enquanto fala
const SHERIFF: Person = { skin: '#c89070', skinD: '#9a6a50', hair: '#6a6662', stache: '#8a8682', hat: '#4a3a2a', band: '#2a1e18', shirt: '#8a6a3c', vest: '#3e2e24', badge: true, blinkOff: 0.4 };

/** o xerife em 28 × 40 no botão do guia; `gt` é o relógio dele, `talking` levanta o braço e acena */
export function drawSheriff(g: Ctx, gt: number, talking: boolean): void {
  g.clearRect(0, 0, 28, 40);
  const cx = 14, P = SHERIFF;
  O(g, cx - 6, 32, 5, 7, '#3a3230'); O(g, cx + 1, 32, 5, 7, '#3a3230');
  torso(g, cx, 19, P, 13);
  head(g, cx, 9, P, gt);
  limb(g, [[cx - 9, 22], [cx - 11, 27], [cx - 9, 31]], 3, P.shirt, P.skin);
  const w = talking ? Math.round(Math.sin(gt * 7) * 2) : 0;
  if (talking) limb(g, [[cx + 8, 22], [cx + 12, 17], [cx + 11 + w, 9]], 3, P.shirt, P.skin);
  else limb(g, [[cx + 8, 22], [cx + 10, 27], [cx + 8, 31]], 3, P.shirt, P.skin);
}
