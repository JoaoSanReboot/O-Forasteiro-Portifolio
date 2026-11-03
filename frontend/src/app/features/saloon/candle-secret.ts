import { clamp } from '../../engine/core/math';
import { SceneRunner } from '../../engine/runtime/scene-runner';
import { PianoState, SaloonState } from '../../engine/scenes/saloon-state';

// ================= Segredo do Saloon: a vela do lustre e o aviso do pianista =================
// Pegar a vela do lustre (toque ou arrasto) e encostar a chama no "NÃO" do aviso "NÃO ATIRE NO PIANISTA".
// A cena conta o resto da história; aqui ficam só os gestos sobre o canvas.
export function attachCandleSecret(s: SceneRunner, PIANO: PianoState, SALOON: SaloonState, onDone: () => void): void {
  const canvas = s.canvas;
  PIANO.bc = s.backCanvas;
  let dragging = false, moved = false, sx = 0, sy = 0;
  const near = (lx: number, ly: number, x: number, y: number, r: number) => Math.hypot(lx - x, ly - y) <= r;
  // a ponta da chama é que precisa encostar na palavra
  const overWord = (lx: number, ly: number) => { const W = PIANO.word!, fy = ly - 3; return lx >= W.x0 - 3 && lx <= W.x1 + 3 && fy >= W.y0 - 3 && fy <= W.y1 + 3; };
  const canPick = () => PIANO.state === 'idle' && PIANO.candle === 'lustre' && !SALOON.playing && s.scale;
  const hold = (on: boolean) => { canvas.style.touchAction = on ? 'none' : ''; };
  const giveBack = () => { PIANO.retFrom = [PIANO.cx, PIANO.cy]; PIANO.retAt = performance.now(); PIANO.candle = 'returning'; hold(false); canvas.style.cursor = ''; };
  const ignite = (lx: number, ly: number) => {
    const W = PIANO.word!;
    PIANO.origin = [clamp(Math.round(lx), W.x0, W.x1), clamp(Math.round(ly - 3), W.y0 + 2, W.y1)];
    PIANO.candle = 'burning'; PIANO.state = 'seq'; PIANO.start = s.t; hold(false); canvas.style.cursor = '';
  };
  canvas.addEventListener('pointerdown', (e) => {
    if (!s.scale) return;
    const [lx, ly] = s.toScene(e.clientX, e.clientY);
    // vela na mão: o próximo toque decide (no "NÃO" queima, fora dele a vela volta para o lustre)
    if (PIANO.candle === 'held') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (overWord(lx, ly)) ignite(lx, ly); else giveBack();
      return;
    }
    if (canPick() && near(lx, ly, PIANO.slot.x, PIANO.slot.y, 6)) {
      e.preventDefault(); e.stopImmediatePropagation();
      PIANO.candle = 'held'; PIANO.cx = lx; PIANO.cy = ly; hold(true);
      dragging = true; moved = false; sx = lx; sy = ly;
      try { canvas.setPointerCapture(e.pointerId); } catch { /* sem captura: o toque seguinte resolve */ }
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!s.scale) return;
    const [lx, ly] = s.toScene(e.clientX, e.clientY);
    if (PIANO.candle === 'held') {
      PIANO.cx = lx; PIANO.cy = ly;
      if (Math.hypot(lx - sx, ly - sy) > 3) moved = true;
      canvas.style.cursor = overWord(lx, ly) ? 'pointer' : 'grabbing';
    } else if (canPick() && near(lx, ly, PIANO.slot.x, PIANO.slot.y, 6)) canvas.style.cursor = 'grab';
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    if (PIANO.candle !== 'held' || !moved) return;
    const [lx, ly] = s.toScene(e.clientX, e.clientY);
    if (overWord(lx, ly)) ignite(lx, ly); else giveBack();
  });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  // fim da sequência: conta o segredo uma vez só
  PIANO.onDone = onDone;
}
