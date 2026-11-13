import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JOBS } from '../../content/profile';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';
import { Duelo } from '../duelo/duelo';

/** "texto **destaque** texto" → partes, com as ímpares em destaque */
const marks = (s: string) => s.split('**').map((t, i) => ({ t, strong: i % 2 === 1 }));

// 03 · Experiência: cada trabalho com a ficha presa à esquerda enquanto as entregas passam à direita,
// e no fim o duelo ao meio-dia contra os problemas que essas entregas resolveram.
@Component({
  selector: 'section[appExperiencia]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal, Duelo],
  host: { class: 'sec experiencia', id: 'experiencia', 'aria-labelledby': 't-experiencia' },
  template: `
    <div class="wrap">
      <header appSectionHead num="03" label="Experiência" title="Rastros pelo" accent="caminho." emblem="rastros" titleId="t-experiencia"></header>
      <ol class="jobs">
        @for (j of jobs; track j.org) {
          <li class="job">
            <div class="job-side">
              <p class="job-period">{{ j.period }}</p>
              <h3 class="job-role">{{ j.role }}</h3>
              <p class="job-org">{{ j.org }} <span aria-hidden="true">·</span> {{ j.mode }}</p>
            </div>
            <div class="job-body">
              <ul class="job-bullets">
                @for (b of j.bullets; track $index) {
                  <li appReveal>@for (m of b; track $index) {@if (m.strong) {<strong>{{ m.t }}</strong>} @else {{{ m.t }}}}</li>
                }
              </ul>
              <p class="job-tech-label">Ferramentas do dia a dia</p>
              <ul class="chips" appReveal>@for (t of j.tech; track t) {<li>{{ t }}</li>}</ul>
            </div>
          </li>
        }
      </ol>
      <article appDuelo appReveal></article>
    </div>
  `,
})
export class Experiencia {
  protected readonly jobs = JOBS.map((j) => ({ ...j, bullets: j.bullets.map(marks) }));
}
