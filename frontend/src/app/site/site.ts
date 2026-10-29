import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, Injector, untracked } from '@angular/core';
import { IntroService } from '../core/intro.service';
import { PlatformService } from '../core/platform.service';
import { ProgressService } from '../core/progress.service';
import { Commits } from './commits/commits';
import { Duelo } from './duelo/duelo';
import { Formacao } from './formacao/formacao';
import { Guide } from './guide/guide';
import { Mural } from './mural/mural';
import { Projetos } from './projetos/projetos';
import { Saloon } from './saloon/saloon';
import { Skills } from './skills/skills';
import { Trabalhos } from './trabalhos/trabalhos';
import { raf } from '../engine/core/browser';

// O site: o portfólio por dentro das casas.
// O topo fica vazio para a cena do portão (fixa, atrás, desenhada pela abertura) aparecer.
@Component({
  selector: 'div[appSite]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Mural, Projetos, Trabalhos, Skills, Commits, Formacao, Saloon, Duelo, Guide],
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

    <div class="coin-hud" id="coin-hud" #hud [class.done]="secrets.done()">
      <button type="button" id="secrets-btn" aria-label="Segredos escondidos encontrados. Falar com o xerife" (click)="secrets.talk()"><svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="0" width="1" height="2" fill="#f6d870"/><rect x="3" y="2" width="3" height="2" fill="#f6d870"/><rect x="0" y="3" width="9" height="2" fill="#f6d870"/><rect x="2" y="5" width="5" height="2" fill="#f6d870"/><rect x="1" y="7" width="2" height="2" fill="#f6d870"/><rect x="6" y="7" width="2" height="2" fill="#f6d870"/><rect x="4" y="4" width="1" height="1" fill="#a87818"/></svg><span>Segredos escondidos</span><b id="secrets-count">{{ secrets.found() }}/{{ secrets.total }}</b></button>
    </div>

    <!-- Xerife: o guia da vila -->
    <div appGuide></div>

    <footer class="foot">
      <div class="wrap">
        <p>João Pedro Santana Rosa · 2026</p>
        <div class="foot-actions">
          <button type="button" class="s-btn alt" id="reset-secrets" (click)="secrets.askReset()">Reiniciar segredos</button>
          <button type="button" class="s-btn alt site-replay" (click)="intro.replay()">Rever a chegada</button>
        </div>
      </div>
    </footer>
  `,
})
export class Site {
  protected readonly intro = inject(IntroService);
  protected readonly secrets = inject(ProgressService);
  protected readonly siteOn = this.intro.siteOn;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const injector = inject(Injector), reduceMotion = inject(PlatformService).reduceMotion;
    // cada segredo novo: o contador dá um pulinho
    effect(() => {
      if (!this.secrets.got()) return;
      const hud = this.host.nativeElement.querySelector<HTMLElement>('#coin-hud');
      if (hud) { hud.classList.remove('got'); void hud.offsetWidth; hud.classList.add('got'); }
    });
    // a chegada termina no mural: o visitante cai direto no conteúdo principal
    effect(() => {
      const e = this.intro.entered();
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
