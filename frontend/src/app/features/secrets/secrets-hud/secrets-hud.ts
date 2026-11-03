import { ChangeDetectionStrategy, Component, effect, ElementRef, inject } from '@angular/core';
import { SecretsService } from '../secrets.service';

// O contador de segredos no canto da tela: clicar fala com o xerife, e cada segredo novo dá um pulinho
@Component({
  selector: 'div[appSecretsHud]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.done]': 'secrets.done()' },
  template: `
    <button type="button" id="secrets-btn" aria-label="Segredos escondidos encontrados. Falar com o xerife" (click)="secrets.talk()"><svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="0" width="1" height="2" fill="#f6d870"/><rect x="3" y="2" width="3" height="2" fill="#f6d870"/><rect x="0" y="3" width="9" height="2" fill="#f6d870"/><rect x="2" y="5" width="5" height="2" fill="#f6d870"/><rect x="1" y="7" width="2" height="2" fill="#f6d870"/><rect x="6" y="7" width="2" height="2" fill="#f6d870"/><rect x="4" y="4" width="1" height="1" fill="#a87818"/></svg><span>Segredos escondidos</span><b id="secrets-count">{{ secrets.found() }}/{{ secrets.total }}</b></button>
  `,
})
export class SecretsHud {
  protected readonly secrets = inject(SecretsService);

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    effect(() => {
      if (!this.secrets.got()) return;
      host.classList.remove('got'); void host.offsetWidth; host.classList.add('got');
    });
  }
}
