import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Intro } from './intro/intro';
import { Site } from './site/site';

// Casca do portfólio: a abertura (tela inicial, cavalgada e alto-falante) e, depois da chegada, o site.
// Quem já chegou nesta visita, ou o build de desenvolvimento (environment.skipIntro), entra direto no mural.
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Intro, Site],
  template: `<app-intro /><div appSite></div>`,
})
export class App {}
