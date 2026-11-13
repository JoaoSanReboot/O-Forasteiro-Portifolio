import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILL_SHELVES } from '../../content/skills';
import { Estrela } from '../../shared/ornaments/ornaments';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';
import { Memoria } from '../memoria/memoria';
import { Coin } from '../secrets/coin';

// 04 · Skills: o arsenal em fichas por categoria, numa seção escura com a palavra gigante
// atravessando o fundo conforme a página rola. No fim, o cordel da memória: cada ferramenta e onde ela trabalhou.
@Component({
  selector: 'section[appSkills]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal, Estrela, Coin, Memoria],
  host: { class: 'sec sec-night skills', id: 'skills', 'aria-labelledby': 't-skills' },
  template: `
    <p class="skills-ghost" aria-hidden="true"><span>Arsenal ✦ Arsenal ✦ Arsenal</span></p>
    <div class="wrap">
      <header appSectionHead num="04" label="Skills" title="Ferramentas do" accent="ofício." [aside]="total + ' ferramentas'" emblem="peixeiras" titleId="t-skills"></header>
      <div class="arsenal">
        @for (s of shelves; track s.label; let i = $index) {
          <article class="kit" appReveal [revealDelay]="i">
            <header class="kit-head">
              <span class="kit-n">{{ '0' + (i + 1) }}</span>
              <h3>{{ s.label }}</h3>
              <span class="kit-count">{{ s.items.length }}</span>
            </header>
            <ul class="kit-list">@for (it of s.items; track it) {<li>{{ it }}</li>}</ul>
            <svg appEstrela class="kit-star"></svg>
            @if (i === 2) { <app-coin coin="couro" class="coin-couro" /> }
          </article>
        }
      </div>
      <article appMemoria appReveal></article>
    </div>
  `,
})
export class Skills {
  protected readonly shelves = SKILL_SHELVES;
  protected readonly total = SKILL_SHELVES.reduce((n, s) => n + s.items.length, 0);
}
