import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, Injector, output, signal, viewChild } from '@angular/core';
import { barMove, emptyBoard, Mark, winner } from '../../../engine/games/tic-tac-toe';

interface Game { cells: Mark[]; over: boolean; line: readonly number[] | null }

// O jogo da velha no balcão: o visitante marca com buracos de bala, o bartender com ferraduras.
// Quem começa alterna a cada partida; o placar fica enquanto a página está aberta.
@Component({
  selector: 'div[appTicTacToe]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tic-tac-toe.html',
})
export class TicTacToe {
  /** o ✕ do painel */
  readonly closed = output<void>();

  private readonly board = viewChild.required<ElementRef<HTMLElement>>('board');
  private readonly resetBtn = viewChild.required<ElementRef<HTMLButtonElement>>('reset');
  private readonly injector = inject(Injector);

  protected readonly game = signal<Game>({ cells: emptyBoard(), over: false, line: null });
  protected readonly msg = signal('Sua vez.');
  protected readonly tally = signal({ you: 0, draw: 0, bar: 0 });
  private youStart = true;

  constructor() {
    this.reset();
  }

  /** foca a primeira casa livre (ao abrir o painel ou jogar de novo) */
  focusFirstFree(): void {
    [...this.board().nativeElement.querySelectorAll('button')].find((b) => !b.disabled)?.focus({ preventScroll: true });
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

  protected again(): void {
    this.reset();
    this.later(() => this.focusFirstFree());
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

  /** foca depois que o DOM refletir a jogada */
  private later(fn: () => void): void { afterNextRender(fn, { injector: this.injector }); }
}
