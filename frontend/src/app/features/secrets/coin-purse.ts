import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SecretsService } from './secrets.service';

// O bolso das moedas escondidas: fica preso no canto esquerdo da tela, contando quantas já foram achadas.
// Leva ao duelo, onde as cinco moedas liberam o revólver aprimorado.
@Component({
  selector: 'app-coin-purse',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="coin-purse" href="#duelo" [class.full]="secrets.count() === secrets.total"
       [attr.aria-label]="'Moedas escondidas achadas: ' + secrets.count() + ' de ' + secrets.total + '. Ir para o duelo'">
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18" class="coin-edge" /><circle cx="20" cy="20" r="14.5" class="coin-face" /></svg>
      <span aria-hidden="true">{{ secrets.count() }}<small>/{{ secrets.total }}</small></span>
    </a>
  `,
})
export class CoinPurse {
  protected readonly secrets = inject(SecretsService);
}
