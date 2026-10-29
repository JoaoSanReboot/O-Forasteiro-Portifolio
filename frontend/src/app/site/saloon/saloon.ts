import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { ProgressService } from '../../core/progress.service';
import { SaloonService } from '../../core/saloon.service';
import { clamp } from '../../engine/core/math';
import { SceneRunner } from '../../engine/runtime/scene-runner';
import { barMove, emptyBoard, Mark, winner } from '../../engine/games/tic-tac-toe';
import { SceneCanvas } from '../../shared/scene-canvas';

interface Game { cells: Mark[]; over: boolean; line: readonly number[] | null }

const EMAIL = 'joaopedrosantanarosa@gmail.com';

// VI · Saloon: as bebidas levam às redes; o bartender chama para um jogo da velha na própria cena
@Component({
  selector: 'section[appSaloon]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector alt flip', id: 'saloon', 'aria-labelledby': 't-saloon' },
  templateUrl: './saloon.html',
})
export class Saloon {
  private readonly saloonState = inject(SaloonService);
  private readonly secrets = inject(ProgressService);
  private readonly scene = viewChild.required(SceneCanvas);
  private readonly sceneEl = viewChild.required('scene', { read: ElementRef<HTMLElement> });
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  private readonly board = viewChild.required<ElementRef<HTMLElement>>('board');
  private readonly invite = viewChild.required<ElementRef<HTMLButtonElement>>('invite');
  private readonly resetBtn = viewChild.required<ElementRef<HTMLButtonElement>>('reset');
  private readonly email = viewChild.required<ElementRef<HTMLElement>>('email');

  protected readonly open = signal(false);
  protected readonly inviteHidden = this.saloonState.inviteHidden;
  protected readonly narrow = signal(false);
  protected readonly game = signal<Game>({ cells: emptyBoard(), over: false, line: null });
  protected readonly msg = signal('Sua vez.');
  protected readonly tally = signal({ you: 0, draw: 0, bar: 0 });
  protected readonly copyMsg = signal('');
  private youStart = true;
  private readonly injector = inject(Injector);
  /** foca depois que o DOM refletir a jogada */
  private later(fn: () => void): void { afterNextRender(fn, { injector: this.injector }); }

  constructor() {
    this.reset();
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // o painel e o convite ficam presos à cena do saloon; no celular o jogo abre logo abaixo dela
      const mq = window.matchMedia('(max-width: 560px)');
      const place = () => this.placePanel(mq.matches);
      this.scene().whenReady((runner) => { place(); this.scene().pin(this.invite().nativeElement, 246, 42); this.candleSecret(runner); });
      mq.addEventListener('change', place);
      destroyRef.onDestroy(() => mq.removeEventListener('change', place));
    });
  }

  // ================= Segredo do Saloon: a vela do lustre e o aviso do pianista =================
  private candleSecret(s: SceneRunner): void {
    const PIANO = this.saloonState.piano, SALOON = this.saloonState.saloon;
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
    PIANO.onDone = () => this.secrets.pianoDone();
  }

  private placePanel(inline: boolean): void {
    (inline ? this.sceneEl().nativeElement : this.scene().layer()).appendChild(this.panel().nativeElement);
    this.narrow.set(inline);
  }

  protected openGame(): void {
    this.placePanel(this.narrow());
    this.open.set(true); this.saloonState.setPlaying(true);
    this.later(() => this.firstFree()?.focus({ preventScroll: true }));
  }

  protected close(e?: Event): void {
    e?.preventDefault();
    this.open.set(false); this.saloonState.setPlaying(false);
    this.later(() => this.invite().nativeElement.focus({ preventScroll: true }));
  }

  protected cellLabel(i: number): string {
    const c = this.game().cells[i];
    return `Linha ${Math.floor(i / 3) + 1}, coluna ${(i % 3) + 1}: ` + (c === 'x' ? 'sua bala' : c === 'o' ? 'ferradura' : 'vazia');
  }

  protected play(i: number): void {
    const g = this.game();
    if (g.over || g.cells[i]) return;
    const cells = g.cells.slice();
    cells[i] = 'x';
    if (this.check(cells)) return;
    cells[barMove(cells)] = 'o';
    if (this.check(cells)) return;
    this.msg.set('Sua vez.');
    this.game.set({ cells, over: false, line: null });
  }

  private check(cells: Mark[]): boolean {
    const line = winner(cells);
    const t = this.tally();
    if (line) {
      if (cells[line[0]] === 'x') { this.tally.set({ ...t, you: t.you + 1 }); this.msg.set('Você venceu! A próxima é por conta da casa.'); }
      else { this.tally.set({ ...t, bar: t.bar + 1 }); this.msg.set('O bartender fechou a linha.'); }
      this.game.set({ cells, over: true, line });
    } else if (cells.every(Boolean)) {
      this.tally.set({ ...t, draw: t.draw + 1 }); this.msg.set('Empate. Ninguém sai do balcão.');
      this.game.set({ cells, over: true, line: null });
    } else return false;
    this.later(() => this.resetBtn().nativeElement.focus({ preventScroll: true }));
    return true;
  }

  private reset(): void {
    const cells = emptyBoard();
    if (!this.youStart) { cells[barMove(cells)] = 'o'; this.msg.set('O bartender começou. Sua vez.'); } else this.msg.set('Sua vez.');
    this.youStart = !this.youStart;
    this.game.set({ cells, over: false, line: null });
  }

  protected again(): void {
    this.reset();
    this.later(() => this.firstFree()?.focus({ preventScroll: true }));
  }

  private firstFree(): HTMLButtonElement | undefined {
    return [...this.board().nativeElement.querySelectorAll('button')].find((b) => !b.disabled);
  }

  protected async copyEmail(): Promise<void> {
    try { await navigator.clipboard.writeText(EMAIL); this.copyMsg.set('E-mail copiado.'); }
    catch {
      const r = document.createRange(); r.selectNodeContents(this.email().nativeElement);
      const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(r);
      this.copyMsg.set('Selecionei o e-mail: é só copiar.');
    }
  }
}
