import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../../content/profile';
import { Chapeu } from '../../../shared/ornaments/ornaments';
import { IntroService } from '../../intro/intro.service';
import { Coin } from '../../secrets/coin';

// O rodapé: o bordado de cangaceiro no alto, a assinatura, voltar ao topo, rever a abertura e o nome gigante cortado no pé da página.
@Component({
  selector: 'footer[appSiteFooter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Chapeu, Coin],
  host: { class: 'foot' },
  template: `
    <div class="bordado" aria-hidden="true"></div>
    <div class="wrap">
      <div class="foot-top">
        <div class="foot-sign">
          <svg appChapeu class="foot-hat"></svg>
          <p><b>{{ p.fullName }}</b><span>{{ p.role }} · {{ p.stack }} — {{ p.location }}</span></p>
        </div>
        <div class="foot-actions">
          <button type="button" class="btn btn-ghost btn-sm" (click)="intro.replay()">Rever a abertura</button>
          <a class="btn btn-ghost btn-sm" href="#inicio">Voltar ao topo <span class="btn-arrow" aria-hidden="true">↑</span></a>
        </div>
      </div>
      <p class="foot-word" aria-hidden="true">Forasteiro</p>
      <app-coin coin="rodape" class="coin-rodape" />
      <p class="foot-small"><span>© 2026 · Feito à mão com Angular e .NET</span><span>Sertão de cordel, código de agora.</span></p>
    </div>
  `,
})
export class SiteFooter {
  protected readonly intro = inject(IntroService);
  protected readonly p = PROFILE;
}
