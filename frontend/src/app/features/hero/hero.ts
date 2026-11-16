import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PROFILE } from '../../content/profile';
import { Feno } from '../../shared/ornaments/feno';
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
/** o redemoinho de poeira: anéis do funil, do mais largo (em cima) ao mais fino (no chão) */
const FUNIL = [0, 1, 2, 3, 4, 5].map((i) => ({ y: i * 13, rx: 26 - i * 4 }));

// O topo: o nome enorme em tipo de madeira (com o pistoleiro em xilogravura escorado no "O" de João: gira o
// revólver, descarrega o tambor no cartaz, que fica furado de lado a lado, e segue girando a arma de vez em quando), o título "Desenvolvedor FullStack" em letreiro de cartaz, o cartaz de
// "Procura-se" em papel velho (título, retrato, nome e recompensa), o sol de xilogravura com os urubus rodando
// (parallax pela rolagem) e o horizonte do sertão no pé: chão, mandacarus e a cerca de estacas, com o vento
// passando (o feno rolando aos pulos com a sombra no chão, a poeira rasteira e um redemoinho que nasce e some).
// A entrada é por CSS e começa quando a abertura sobe (`html.ready`).
@Component({
  selector: 'section[appHero]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Letters, Sol, Feno, Coin],
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
      <div class="hero-id">
        <h1 class="hero-name" id="hero-title" tabindex="-1">
          <span class="hn-line"><span class="hn-txt" appLetters="João"></span><span class="pistoleiro" aria-hidden="true">
            <svg viewBox="0 0 64 80" focusable="false">
              <g class="pist-corpo" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <path d="M31 52 L36 64 L42 76 M32 52 L40 64 L35.5 76" stroke-width="5" />
                <path d="M40.5 77 H47 M34 77 H40" stroke-width="4.6" />
                <path d="M19 34 L9.5 39 L15 47" stroke-width="4" />
                <path d="M31 52 L20 33" stroke-width="10" />
                <path d="M21 34 L31 35.5 L42.5 32.5" stroke-width="4" />
                <circle cx="16" cy="24" r="5.4" fill="currentColor" stroke="none" />
                <path d="M9.5 19.5 Q15 6 24.5 18 Z" fill="currentColor" stroke-width="1.5" />
                <path d="M5.5 20.5 Q16 15 28 18.5" stroke-width="2.6" />
              </g>
              <path class="pist-goiva" d="M11.5 17.6 Q16 15.6 22.5 16.6 M26.4 45.6 L32.4 42.6 M27.8 49.6 L21.6 37.8 M41.5 75.4 H46 M34.8 75.4 H39" />
              <circle class="pist-olho" cx="18.4" cy="23.4" r="0.9" />
              <circle class="pist-estrela" cx="16.4" cy="13.4" r="1.4" />
              <path class="pist-lenco" d="M12.5 30 L23 32.5 L17 38 Z" />
              <g class="pist-mira">
                <g class="pist-roda">
                  <path class="pist-cabo" d="M44.6 32.6 Q43 35.6 41.4 38.6" />
                  <path class="pist-cano" d="M44.5 30.2 H56.5" />
                  <rect class="pist-tambor" x="43.8" y="28.6" width="5.6" height="4.6" rx="1.2" />
                </g>
                <path class="pist-fogo" d="M58 30.2 l3 -3.4 l0.6 2.6 l3.6 0.8 l-3.6 0.8 l-0.6 2.6 Z" />
              </g>
              <circle class="pist-fumaca" cx="59" cy="29" r="2.4" />
            </svg>
          </span></span>
          <span class="hn-line hn-2"><span class="hn-txt" appLetters="Pedro" [offset]="4"></span></span>
          <span class="sr-only">, {{ p.role }} {{ p.stack }}</span>
        </h1>
        <p class="hero-role" aria-hidden="true"><span class="role-what">Desenvolvedor</span> <span class="role-stack">FullStack</span></p>
      </div>
      <figure class="poster">
        <span class="poster-nail" aria-hidden="true"></span>
        <div class="poster-sheet">
          <p class="poster-head">Procura-se</p>
          <p class="poster-sub" aria-hidden="true">vivo e codando</p>
          <div class="poster-photo"><img [src]="p.portrait" alt="Retrato de João Pedro" width="160" height="200" fetchpriority="high"></div>
          <figcaption>
            <span class="poster-name">{{ p.fullName }}</span>
            <span class="poster-reward"><small>Recompensa</small><span>um bom projeto</span></span>
          </figcaption>
          <!-- os seis buracos de bala (posição e hora de cada um em $furos, _hero.scss) -->
          <span class="poster-furo f1" aria-hidden="true"></span><span class="poster-furo f2" aria-hidden="true"></span>
          <span class="poster-furo f3" aria-hidden="true"></span><span class="poster-furo f4" aria-hidden="true"></span>
          <span class="poster-furo f5" aria-hidden="true"></span><span class="poster-furo f6" aria-hidden="true"></span>
        </div>
      </figure>
    </div>
    <app-coin coin="horizonte" class="coin-horizonte" />
    <div class="vento" aria-hidden="true">
      <span class="poeira"></span><span class="poeira p2"></span><span class="poeira p3"></span>
      <svg class="redemoinho" viewBox="-30 -8 60 84" focusable="false">
        @for (f of funil; track f.y) { <ellipse cx="0" [attr.cy]="f.y" [attr.rx]="f.rx" ry="3.4" [style.--i]="$index" /> }
      </svg>
      <span class="feno-rota"><span class="feno-sombra"></span><span class="feno-pulo"><svg appFeno class="feno-gira"></svg></span></span>
    </div>
    <svg class="horizon" viewBox="0 -24 1440 144" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <g class="hz-fence" fill="none" stroke="currentColor" stroke-linecap="round">
        @for (x of posts; track x) { <path [attr.d]="'M' + x + ' 112 V' + (78 + ($index % 3) * 3)" stroke-width="4" /> }
        <path [attr.d]="'M' + posts[0] + ' 86 Q' + (posts[0] + 168) + ' 92 ' + posts[posts.length - 1] + ' 86'" stroke-width="1.4" />
        <path [attr.d]="'M' + posts[0] + ' 95 Q' + (posts[0] + 168) + ' 100 ' + posts[posts.length - 1] + ' 95'" stroke-width="1.4" />
      </g>
      @for (c of cacti; track c.x) {
        <g class="hz-cactus" [attr.transform]="'translate(' + c.x + ' 104) scale(' + c.s * c.flip + ' ' + c.s + ')'" [style.--d]="$index">
          <path d="M0 26 V-88 M-3 -38 H-16 Q-23 -38 -23 -45 V-66 M3 -56 H15 Q22 -56 22 -63 V-80" fill="none" stroke="currentColor" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" />
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
  protected readonly funil = FUNIL;
}
