import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { SaloonService } from '../../core/saloon.service';
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
      this.scene().whenReady(() => { place(); this.scene().pin(this.invite().nativeElement, 246, 42); });
      mq.addEventListener('change', place);
      destroyRef.onDestroy(() => mq.removeEventListener('change', place));
    });
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
