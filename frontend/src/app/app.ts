import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Intro } from './features/intro/intro';
import { IntroService } from './features/intro/intro.service';
import { Site } from './features/site/site';

// Casca do portfólio: a abertura por cima e, embaixo dela, o site (sempre no HTML, para quem lê a página
// sem JavaScript e para os buscadores). environment.skipIntro (desenvolvimento) pula a abertura.
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Intro, Site],
  template: `@if (intro.showing()) { <app-intro /> }<div appSite></div>`,
})
export class App {
  protected readonly intro = inject(IntroService);
}
