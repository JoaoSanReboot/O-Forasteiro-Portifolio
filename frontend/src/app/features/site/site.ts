import { afterNextRender, ChangeDetectionStrategy, Component, effect, inject, Injector, untracked } from '@angular/core';
import { PlatformService } from '../../core/platform/platform.service';
import { raf } from '../../engine/core/browser';
import { Commits } from '../commits/commits';
import { Duelo } from '../duelo/duelo';
import { Formacao } from '../formacao/formacao';
import { Guide } from '../guide/guide';
import { IntroService } from '../intro/intro.service';
import { Mural } from '../mural/mural';
import { Projetos } from '../projetos/projetos';
import { Saloon } from '../saloon/saloon';
import { SecretsHud } from '../secrets/secrets-hud/secrets-hud';
import { Skills } from '../skills/skills';
import { Trabalhos } from '../trabalhos/trabalhos';
import { SiteFooter } from './site-footer/site-footer';

// O site: o portfólio por dentro das casas, na ordem das seções; o contador de segredos, o xerife e o rodapé por cima.
// O topo fica vazio para a cena do portão (fixa, atrás, desenhada pela abertura) aparecer.
@Component({
  selector: 'div[appSite]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Mural, Projetos, Trabalhos, Skills, Commits, Formacao, Saloon, Duelo, SecretsHud, Guide, SiteFooter],
  host: { id: 'site', '[hidden]': '!siteOn()' },
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
      <section appDuelo></section>
    </main>
    <div class="coin-hud" id="coin-hud" appSecretsHud></div>
    <!-- Xerife: o guia da vila -->
    <div appGuide></div>
    <footer class="foot" appSiteFooter></footer>
  `,
})
export class Site {
  protected readonly siteOn = inject(IntroService).siteOn;

  constructor() {
    const intro = inject(IntroService), injector = inject(Injector), reduceMotion = inject(PlatformService).reduceMotion;
    // a chegada termina no mural: o visitante cai direto no conteúdo principal
    effect(() => {
      const e = intro.entered();
      if (!e.n) return;
      untracked(() => afterNextRender(() => {
        const mural = document.getElementById('procurado');
        window.scrollTo(0, 0);
        raf(() => {
          mural?.scrollIntoView({ behavior: reduceMotion || e.quick ? 'auto' : 'smooth', block: 'start' });
          document.getElementById('t-mural')?.focus({ preventScroll: true });
        });
      }, { injector }));
    });
  }
}
