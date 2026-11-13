import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { PAIRS } from '../../content/jogos';
import { Card, deal, MemoryGame } from '../../engine/games/memory';
import { Estrela } from '../../shared/ornaments/ornaments';

interface View { pair: number; side: 0 | 1; text: string; up: boolean; found: boolean }

const SAY = {
  start: 'Vire duas cartas: a ferramenta e onde ela trabalhou.',
  match: 'Par certo. Essa ferramenta já pegou no batente.',
  miss: 'Não é par. Guarda na memória e tenta de novo.',
} as const;

// O jogo da memória da seção Skills: folhetos de cordel virados para baixo, com a xilogravura
// do sol no verso. Cada par junta uma ferramenta ao lugar onde ela trabalhou de verdade
// (dados em content/jogos.ts; as regras em engine/games/memory.ts).
// O prerender sai com o baralho na ordem; o embaralhamento acontece no navegador, depois da hidratação.
@Component({
  selector: 'article[appMemoria]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Estrela],
  host: { class: 'game memoria', id: 'memoria', 'aria-labelledby': 'memoria-t' },
  template: `
    <header class="game-head">
      <p class="game-kicker">Jogo · ferramenta e batente</p>
      <h3 class="game-title" id="memoria-t">Cordel <em>da memória</em></h3>
      <p class="game-score" aria-live="polite">Pares <b>{{ found() }}</b> de {{ total }} · Jogadas <b>{{ moves() }}</b></p>
    </header>
    <div class="mem-board" role="group" aria-label="Cartas do jogo da memória">
      @for (c of cards(); track $index) {
        <button type="button" class="mem-card" [class.up]="c.up" [class.found]="c.found" [class.tool]="c.side === 0"
          [attr.aria-label]="c.up ? c.text : 'Carta virada para baixo'" [attr.aria-pressed]="c.up" (click)="flip($index)">
          <span class="mem-face mem-back" aria-hidden="true"><svg appEstrela></svg></span>
          <span class="mem-face mem-front" aria-hidden="true">{{ c.text }}</span>
        </button>
      }
    </div>
    <div class="game-foot">
      <p class="game-say" aria-live="polite">{{ say() }}</p>
      <button type="button" class="btn btn-sm" (click)="shuffle()">{{ done() ? 'Jogar de novo' : 'Embaralhar' }}</button>
    </div>
  `,
})
export class Memoria {
  protected readonly total = PAIRS.length;
  protected readonly cards = signal<View[]>([]);
  protected readonly found = signal(0);
  protected readonly moves = signal(0);
  protected readonly done = signal(false);
  protected readonly say = signal<string>(SAY.start);
  private game = new MemoryGame(PAIRS.flatMap((_, pair): Card[] => [{ pair, side: 0 }, { pair, side: 1 }]));
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.sync();
    afterNextRender(() => this.shuffle());
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected shuffle(): void {
    this.stop();
    this.game = new MemoryGame(deal(PAIRS.length));
    this.say.set(SAY.start);
    this.sync();
  }

  protected flip(i: number): void {
    const r = this.game.flip(i);
    if (r === 'ignored') return;
    if (r === 'match') this.say.set(this.game.done ? `Cordel completo em ${this.game.moves} jogadas. Arretado!` : SAY.match);
    if (r === 'miss') {
      this.say.set(SAY.miss);
      this.timer = setTimeout(() => { this.game.hide(); this.sync(); }, 1100);
    }
    this.sync();
  }

  private sync(): void {
    const g = this.game;
    this.cards.set(g.cards.map((c, i) => {
      const p = PAIRS[c.pair];
      return { pair: c.pair, side: c.side, text: c.side === 0 ? p.tool : p.where, up: g.faceUp(i), found: g.found.has(c.pair) };
    }));
    this.found.set(g.found.size);
    this.moves.set(g.moves);
    this.done.set(g.done);
  }

  private stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
