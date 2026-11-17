import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { EmblemKind, Emblema } from '../emblems/emblems';
import { Estrela } from '../ornaments/ornaments';
import { Reveal } from '../reveal/reveal';

// Cabeçalho de seção como cabeça de cartaz: "✦ Nº 02  PROJETOS ═════ 03 obras" e o título, num tipo e
// numa cor só (o mesmo em todas as seções), entrando em duas partes. Ao lado, o emblema que
// desenha o título (a bigorna, as pegadas, as peixeiras...) e se mexe quando entra na tela.
@Component({
  selector: 'header[appSectionHead]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, Estrela, Emblema],
  host: { class: 'sh' },
  template: `
    <p class="sh-meta" appReveal="line">
      <svg appEstrela class="sh-star"></svg>
      <span class="sh-num">Nº {{ num() }}</span>
      <span class="sh-label">{{ label() }}</span>
      <span class="sh-rule" aria-hidden="true"></span>
      @if (aside()) { <span class="sh-aside">{{ aside() }}</span> }
    </p>
    <div class="sh-row">
      <h2 class="sh-title" [id]="titleId()" tabindex="-1">
        <span class="sh-mask" appReveal="mask"><span class="sh-wood">{{ title() }}</span></span>
        @if (accent()) { <span class="sh-mask" appReveal="mask" [revealDelay]="1"><em>{{ accent() }}</em></span> }
      </h2>
      @if (emblem(); as e) { <svg class="sh-emblem" [appEmblema]="e" appReveal="emblem" [revealDelay]="2"></svg> }
    </div>
  `,
})
export class SectionHead {
  readonly num = input.required<string>();
  readonly label = input.required<string>();
  readonly title = input.required<string>();
  readonly accent = input('');
  readonly aside = input('');
  readonly emblem = input<EmblemKind | null>(null);
  readonly titleId = input.required<string>();
}
