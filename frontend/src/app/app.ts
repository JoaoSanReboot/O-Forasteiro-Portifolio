import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { environment } from '../environments/environment';
import { Site } from './site/site';

// Casca do portfólio. A abertura entra na fase 4; até lá o site aparece direto, no modo "site-on" do legado.
// environment.skipIntro (só no build de desenvolvimento) vai pular a abertura quando ela existir.
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Site],
  template: `<div appSite></div>`,
})
export class App {
  protected readonly skipIntro = environment.skipIntro;

  constructor() {
    inject(DOCUMENT).documentElement.classList.add('site-on');
  }
}
