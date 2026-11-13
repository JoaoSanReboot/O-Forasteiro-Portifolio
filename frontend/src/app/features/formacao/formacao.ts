import { afterNextRender, ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { COURSES, Course } from '../../content/profile';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';
import { Coin } from '../secrets/coin';

/** o eixo vai de jan/2022 até o fim de 2028 */
const Y0 = 2022, Y1 = 2029;
const pos = (y: number, m: number) => (((y - Y0) * 12 + (m - 1)) / ((Y1 - Y0) * 12)) * 100;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const when = ([y, m]: readonly [number, number]) => `${MONTHS[m - 1]} ${y}`;

// 06 · Formação: os cursos numa régua de anos, cada um como uma barra do começo ao fim
// (a que está em andamento corre listrada até a previsão) e uma marca de "hoje".
@Component({
  selector: 'section[appFormacao]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal, Coin],
  host: { class: 'sec formacao', id: 'formacao', 'aria-labelledby': 't-formacao' },
  template: `
    <div class="wrap">
      <header appSectionHead num="06" label="Formação" title="Escola," accent="e a vida inteira." emblem="candeeiro" titleId="t-formacao"></header>
      <app-coin coin="candeeiro" class="coin-candeeiro" />
      <div class="edu">
        <div class="edu-rail" aria-hidden="true">
          @for (y of years; track y) { <span class="edu-year" [style.left.%]="at(y)">{{ y }}</span> }
          @if (today() !== null) {
            <span class="edu-today" [style.left.%]="today()"><span>hoje</span></span>
          }
        </div>
        <ol class="edu-list">
          @for (c of courses; track c.title; let i = $index) {
            <li class="course" appReveal [revealDelay]="i">
              <div class="course-text">
                <h3>{{ c.title }}</h3>
                <p class="course-inst">{{ c.inst }} <span aria-hidden="true">·</span> {{ c.period }}</p>
                <p class="course-note">{{ c.note }}</p>
              </div>
              <div class="course-track" aria-hidden="true">
                <span class="course-bar" [class.going]="c.going" [style.left.%]="c.left" [style.width.%]="c.width"></span>
              </div>
              <span class="seal" [class.going]="c.going">{{ c.going ? 'Em andamento' : 'Concluído' }}</span>
            </li>
          }
        </ol>
      </div>
    </div>
  `,
})
export class Formacao {
  protected readonly years = Array.from({ length: Y1 - Y0 }, (_, i) => Y0 + i);
  protected readonly courses = COURSES.map((c: Course) => ({
    ...c,
    left: pos(c.from[0], c.from[1]),
    width: pos(c.to[0], c.to[1] + 1) - pos(c.from[0], c.from[1]),
    period: `${when(c.from)} — ${when(c.to)}${c.going ? ' (previsão)' : ''}`,
  }));
  /** a marca de hoje só existe no navegador (o prerender não sabe a data de quem visita) */
  protected readonly today = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      const d = new Date(), p = pos(d.getFullYear(), d.getMonth() + 1);
      if (p >= 0 && p <= 100) this.today.set(p);
    });
  }

  protected at(y: number): number { return pos(y, 1); }
}
