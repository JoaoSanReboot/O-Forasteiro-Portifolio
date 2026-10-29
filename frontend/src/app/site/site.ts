import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Commits } from './commits/commits';
import { Formacao } from './formacao/formacao';
import { Mural } from './mural/mural';
import { Projetos } from './projetos/projetos';
import { Saloon } from './saloon/saloon';
import { Skills } from './skills/skills';
import { Trabalhos } from './trabalhos/trabalhos';

// O site: o portfólio por dentro das casas, na mesma ordem do legado.
// O topo fica vazio para a cena do portão (fixa, atrás) aparecer; o duelo, o xerife e os segredos entram na fase 4.
@Component({
  selector: 'div[appSite]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Mural, Projetos, Trabalhos, Skills, Commits, Formacao, Saloon],
  host: { id: 'site' },
  template: `
    <section class="hero" id="inicio" aria-labelledby="hero-title">
      <h1 id="hero-title" class="sr-only" tabindex="-1">João Pedro, desenvolvedor Backend .NET: portfólio</h1>
    </section>
    <main>
      <section appMural></section>
      <section appProjetos></section>
      <section appTrabalhos></section>
      <section appSkills></section>
      <section appCommits></section>
      <section appFormacao></section>
      <section appSaloon></section>
    </main>
  `,
})
export class Site {}
