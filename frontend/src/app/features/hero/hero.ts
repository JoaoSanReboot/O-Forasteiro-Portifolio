import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { PROFILE } from '../../content/profile';
import { Estrela, Sol } from '../../shared/ornaments/ornaments';
import { Letters } from '../../shared/split/letters';
import { Coin } from '../secrets/coin';

const clockFmt = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

/** os mandacarus do horizonte: posição, altura (escala) e o lado dos braços */
const CACTI = [
  { x: 150, s: 0.55, flip: 1 }, { x: 236, s: 1, flip: -1 }, { x: 860, s: 0.42, flip: 1 },
  { x: 1150, s: 1.15, flip: 1 }, { x: 1238, s: 0.6, flip: -1 },
];
/** as estacas da cerca */
const POSTS = Array.from({ length: 9 }, (_, i) => 430 + i * 42);

// O topo: o nome enorme em tipo de madeira, o cartaz de "Procura-se" pregado na parede (balançando
// no prego, com o carimbo batendo), o sol de xilogravura com os urubus rodando (parallax pela rolagem)
// e o horizonte do sertão no pé: chão, mandacarus e a cerca de estacas.
// A entrada é por CSS e começa quando a abertura sobe (`html.ready`).
@Component({
  selector: 'section[appHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Letters, Sol, Estrela, Coin],
  host: { class: 'hero', id: 'inicio', 'aria-labelledby': 'hero-title' },
  template: `
    <div class="hero-sun" aria-hidden="true">
      <svg appSol></svg>
      <div class="urubus">
        @for (u of [0, 1, 2]; track u) {
          <span class="urubu" [style.--u]="u"><svg viewBox="0 0 40 14"><path d="M2 10 Q10 1 20 8 Q30 1 38 10" /></svg></span>
        }
      </div>
    </div>
    <div class="wrap hero-in">
      <div class="hero-top">
        <p class="hero-meta"><svg appEstrela class="meta-star"></svg>Portfólio · 2026</p>
        <p class="hero-meta hero-where">{{ p.location }}@if (clock()) { <span class="hero-clock"><span class="sr-only">, agora são </span>{{ clock() }}</span> }</p>
      </div>
      <h1 class="hero-name" id="hero-title" tabindex="-1">
        <span class="hn-line"><span appLetters="João"></span></span>
        <span class="hn-line hn-2"><span appLetters="Pedro" [offset]="4"></span></span>
        <span class="sr-only">, {{ p.role }} {{ p.stack }}</span>
      </h1>
      <p class="hero-role" aria-hidden="true"><em>desenvolvedor</em><span>FullStack · .NET</span></p>
      <figure class="poster">
        <span class="poster-nail" aria-hidden="true"></span>
        <div class="poster-sheet">
          <p class="poster-head">Procura-se</p>
          <div class="poster-photo"><img [src]="p.portrait" alt="Retrato de João Pedro" width="160" height="200" fetchpriority="high"></div>
          <figcaption>
            <span class="poster-name">{{ p.fullName }}</span>
            <span class="poster-alias">vulgo <em>O Forasteiro</em></span>
            <span class="poster-reward"><small>Recompensa</small>um bom projeto</span>
            <span class="poster-seen">Visto por último entre o banco de dados e a tela</span>
          </figcaption>
        </div>
        <span class="poster-stamp" aria-hidden="true">Sem stack trace</span>
      </figure>
      <div class="hero-foot">
        <p class="hero-lead">{{ p.lead }}</p>
        <div class="hero-actions">
          <a class="btn" href="#projetos">Ver projetos <span class="btn-arrow" aria-hidden="true">↓</span></a>
          <a class="btn btn-ghost" href="#contato">Bora conversar</a>
        </div>
      </div>
    </div>
    <app-coin coin="horizonte" class="coin-horizonte" />
    <svg class="horizon" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <g class="hz-fence" fill="none" stroke="currentColor" stroke-linecap="round">
        @for (x of posts; track x) { <path [attr.d]="'M' + x + ' 104 V' + (78 + ($index % 3) * 3)" stroke-width="4" /> }
        <path [attr.d]="'M' + posts[0] + ' 86 Q' + (posts[0] + 168) + ' 92 ' + posts[posts.length - 1] + ' 86'" stroke-width="1.4" />
        <path [attr.d]="'M' + posts[0] + ' 95 Q' + (posts[0] + 168) + ' 100 ' + posts[posts.length - 1] + ' 95'" stroke-width="1.4" />
      </g>
      @for (c of cacti; track c.x) {
        <g class="hz-cactus" [attr.transform]="'translate(' + c.x + ' 104) scale(' + c.s * c.flip + ' ' + c.s + ')'" [style.--d]="$index">
          <path d="M0 2 V-88 M-3 -38 H-16 Q-23 -38 -23 -45 V-66 M3 -56 H15 Q22 -56 22 -63 V-80" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
        </g>
      }
      <path d="M0 120 V106 Q160 98 340 104 T700 102 T1060 106 T1440 100 V120 Z" fill="currentColor" />
      <g fill="currentColor"><ellipse cx="560" cy="106" rx="14" ry="6" /><ellipse cx="1020" cy="105" rx="9" ry="5" /><ellipse cx="300" cy="104" rx="7" ry="4" /></g>
    </svg>
  `,
})
export class Hero {
  protected readonly p = PROFILE;
  protected readonly cacti = CACTI;
  protected readonly posts = POSTS;
  /** a hora em São José dos Pinhais (só no navegador: o prerender sai sem ela) */
  protected readonly clock = signal('');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const tick = () => this.clock.set(clockFmt.format(new Date()));
      tick();
      const id = setInterval(tick, 20_000);
      destroyRef.onDestroy(() => clearInterval(id));
    });
  }
}
