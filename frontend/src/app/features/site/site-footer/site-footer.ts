import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IntroService } from '../../intro/intro.service';
import { SecretsService } from '../../secrets/secrets.service';

// O rodapé: assinatura, reiniciar os segredos (com a confirmação do xerife) e rever a chegada
@Component({
  selector: 'footer[appSiteFooter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <p>João Pedro Santana Rosa · 2026</p>
      <div class="foot-actions">
        <button type="button" class="s-btn alt" id="reset-secrets" (click)="secrets.askReset()">Reiniciar segredos</button>
        <button type="button" class="s-btn alt site-replay" (click)="intro.replay()">Rever a chegada</button>
      </div>
    </div>
  `,
})
export class SiteFooter {
  protected readonly intro = inject(IntroService);
  protected readonly secrets = inject(SecretsService);
}
