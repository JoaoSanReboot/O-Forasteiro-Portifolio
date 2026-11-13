import { afterNextRender, ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { CoinId, SecretsService } from './secrets.service';

// Uma moeda de ouro escondida num canto do site. Clicou, ela gira para o bolso e some.
// No servidor (prerender) nenhuma moeda aparece: elas só surgem no navegador, depois da hidratação,
// porque é lá que o progresso mora.
@Component({
  selector: 'app-coin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'coin-spot' },
  template: `
    @if (show()) {
      <button type="button" class="coin" [class.taking]="taking()" [disabled]="taking()" (click)="take()" aria-label="Moeda de ouro escondida">
        <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
          <circle cx="20" cy="20" r="18" class="coin-edge" />
          <circle cx="20" cy="20" r="14.5" class="coin-face" />
          <polygon class="coin-star" points="20,9 22.6,15.7 29.5,13 26.3,19.4 32,22.8 24.9,23.6 25.2,30.9 20,26 14.8,30.9 15.1,23.6 8,22.8 13.7,19.4 10.5,13 17.4,15.7" />
        </svg>
      </button>
    }
  `,
})
export class Coin {
  private readonly secrets = inject(SecretsService);
  readonly coin = input.required<CoinId>();
  protected readonly taking = signal(false);
  private readonly ready = signal(false);
  protected readonly show = () => this.ready() && (this.taking() || !this.secrets.has(this.coin()));

  constructor() {
    afterNextRender(() => { this.secrets.restore(); this.ready.set(true); });
  }

  protected take(): void {
    this.taking.set(true);
    this.secrets.collect(this.coin());
    setTimeout(() => this.taking.set(false), 900);
  }
}
