import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { PlatformService } from '../../core/platform/platform.service';
import { ScrollState } from '../../core/scroll/scroll-state';
import { Commits } from '../commits/commits';
import { Contato } from '../contato/contato';
import { Experiencia } from '../experiencia/experiencia';
import { Formacao } from '../formacao/formacao';
import { Hero } from '../hero/hero';
import { IntroService } from '../intro/intro.service';
import { Projetos } from '../projetos/projetos';
import { CoinNews } from '../secrets/coin-news';
import { Skills } from '../skills/skills';
import { Sobre } from '../sobre/sobre';
import { SiteFooter } from './site-footer/site-footer';
import { SiteNav } from './site-nav/site-nav';
import { SmoothScroll, startSmoothScroll } from './smooth-scroll';

// O site: a barra, o topo e as seções na ordem, e o rodapé.
// Fica sempre no HTML (o prerender sai com tudo); enquanto a abertura está na frente ele fica `inert`.
@Component({
  selector: 'div[appSite]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNav, Hero, Sobre, Projetos, Experiencia, Skills, Commits, Formacao, Contato, SiteFooter, CoinNews],
  host: { id: 'site', '[attr.inert]': 'covered() ? "" : null' },
  template: `
    <!-- a tinta da prensa: borda comida e falhas no preto dos títulos em tipo de madeira (filter: url(#tinta)) -->
    <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="tinta" x="-2%" y="-6%" width="104%" height="112%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="2" seed="7" result="grao" />
        <feDisplacementMap in="SourceGraphic" in2="grao" scale="2.6" xChannelSelector="R" yChannelSelector="G" result="borda" />
        <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" seed="3" result="falha" />
        <feColorMatrix in="falha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -20 0 0 0 15.6" result="mascara" />
        <feComposite in="borda" in2="mascara" operator="in" />
      </filter>
    </svg>
    <a class="skip-link" href="#sobre">Pular para o conteúdo</a>
    <nav appSiteNav></nav>
    <main>
      <section appHero></section>
      <section appSobre></section>
      <section appProjetos></section>
      <section appExperiencia></section>
      <section appSkills></section>
      <section appCommits></section>
      <section appFormacao></section>
      <section appContato></section>
    </main>
    <footer appSiteFooter></footer>
    <app-coin-news />
  `,
})
export class Site {
  private readonly intro = inject(IntroService);
  private readonly platform = inject(PlatformService);
  /** a abertura está na frente (só no navegador: sem JavaScript o site fica utilizável) */
  protected readonly covered = () => this.platform.isBrowser && !this.intro.done();

  constructor() {
    const destroyRef = inject(DestroyRef), scroll = inject(ScrollState);
    if (!this.platform.isBrowser) return;
    afterNextRender(() => destroyRef.onDestroy(scroll.start()));
    // rolagem com inércia: começa quando a cortina sobe e fica parada enquanto a abertura volta
    let smooth: Promise<SmoothScroll> | null = null;
    effect(() => {
      const done = this.intro.done();
      if (done) (smooth ??= startSmoothScroll()).then((s) => s.start());
      else smooth?.then((s) => s.stop());
    });
    destroyRef.onDestroy(() => smooth?.then((s) => s.destroy()));
  }
}
