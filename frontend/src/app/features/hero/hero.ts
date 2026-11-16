import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PROFILE } from '../../content/profile';
import { Sol } from '../../shared/ornaments/ornaments';
import { Letters } from '../../shared/split/letters';
import { Coin } from '../secrets/coin';

/** os mandacarus do horizonte: posição, altura (escala) e o lado dos braços */
const CACTI = [
  { x: 150, s: 0.55, flip: 1 }, { x: 236, s: 1, flip: -1 }, { x: 860, s: 0.42, flip: 1 },
  { x: 1150, s: 1.15, flip: 1 }, { x: 1238, s: 0.6, flip: -1 },
];
/** as estacas da cerca */
const POSTS = Array.from({ length: 9 }, (_, i) => 430 + i * 42);
/** o rolo de capim seco: galhos enrolados (elipses giradas) e uns gravetos soltos */
const CAPIM = Array.from({ length: 8 }, (_, i) => ({ ry: 8 + (i % 3) * 5, a: i * 23 }));
const GRAVETOS = 'M14 -15 L25 -22 M-17 12 L-27 17 M6 19 L9 28 M-9 -18 L-12 -27 M19 8 L28 10';
/** o redemoinho de poeira: anéis do funil, do mais largo (em cima) ao mais fino (no chão) */
const FUNIL = [0, 1, 2, 3, 4, 5].map((i) => ({ y: i * 13, rx: 26 - i * 4 }));

// O topo: o nome enorme em tipo de madeira, o cartaz de "Procura-se" (enxuto: título, retrato, nome e recompensa),
// o sol de xilogravura com os urubus rodando (parallax pela rolagem)
// e o horizonte do sertão no pé: chão, mandacarus e a cerca de estacas, com o vento passando
// (o rolo de capim seco quicando, a poeira rasteira e um redemoinho que nasce e some).
// A entrada é por CSS e começa quando a abertura sobe (`html.ready`).
@Component({
  selector: 'section[appHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Letters, Sol, Coin],
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
      <h1 class="hero-name" id="hero-title" tabindex="-1">
        <span class="hn-line"><span appLetters="João"></span></span>
        <span class="hn-line hn-2"><span appLetters="Pedro" [offset]="4"></span></span>
        <span class="sr-only">, {{ p.role }} {{ p.stack }}</span>
      </h1>
      <p class="hero-role" aria-hidden="true"><em>desenvolvedor</em><span>FullStack · .NET</span></p>
      <figure class="poster">
        <p class="poster-head">Procura-se</p>
        <div class="poster-photo"><img [src]="p.portrait" alt="Retrato de João Pedro" width="160" height="200" fetchpriority="high"></div>
        <figcaption>
          <span class="poster-name">{{ p.fullName }}</span>
          <span class="poster-reward"><small>Recompensa</small> um bom projeto</span>
        </figcaption>
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
    <div class="vento" aria-hidden="true">
      <span class="poeira"></span><span class="poeira p2"></span><span class="poeira p3"></span>
      <svg class="redemoinho" viewBox="-30 -8 60 84" focusable="false">
        @for (f of funil; track f.y) { <ellipse cx="0" [attr.cy]="f.y" [attr.rx]="f.rx" ry="3.4" [style.--i]="$index" /> }
      </svg>
      <span class="capim"><svg viewBox="-30 -30 60 60" focusable="false">@for (c of capim; track c.a) { <ellipse rx="20" [attr.ry]="c.ry" [attr.transform]="'rotate(' + c.a + ')'" /> }<path [attr.d]="gravetos" /></svg></span>
    </div>
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
  protected readonly capim = CAPIM;
  protected readonly gravetos = GRAVETOS;
  protected readonly funil = FUNIL;
}
