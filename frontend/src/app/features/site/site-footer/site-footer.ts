import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IntroService } from '../../intro/intro.service';
import { SecretsService } from '../../secrets/secrets.service';

// O rodapé: assinatura, os perfis, reiniciar os segredos (com a confirmação do xerife) e rever a chegada
@Component({
  selector: 'footer[appSiteFooter]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <div class="foot-brand">
        <p class="foot-name">João Pedro Santana Rosa</p>
        <p class="foot-role">Desenvolvedor FullStack · .NET · São José dos Pinhais, PR</p>
        <ul class="foot-links" aria-label="Perfis">
          <li><a href="https://github.com/JoaoSanReboot" target="_blank" rel="noopener">GitHub ↗</a></li>
          <li><a href="https://www.linkedin.com/in/joaopedro-santanarosa" target="_blank" rel="noopener">LinkedIn ↗</a></li>
          <li><a href="#saloon">Contato</a></li>
        </ul>
        <p class="foot-made">© 2026 · Pixel art desenhada em código, com Angular e .NET.</p>
      </div>
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
