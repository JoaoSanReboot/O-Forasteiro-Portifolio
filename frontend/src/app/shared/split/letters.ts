import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Um texto quebrado em letras (cada uma com o seu índice em --i), para as entradas letra a letra.
// O leitor de tela lê a frase inteira (no .sr-only); as letras ficam escondidas dele.
@Component({
  selector: '[appLetters]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="sr-only">{{ appLetters() }}</span>@for (c of chars(); track $index) {<span class="ch" aria-hidden="true" [style.--i]="$index + offset()">{{ c }}</span>}`,
})
export class Letters {
  readonly appLetters = input.required<string>();
  /** soma ao índice de cada letra (para continuar a contagem de uma linha anterior) */
  readonly offset = input(0);
  protected readonly chars = computed(() => [...this.appLetters()].map((c) => (c === ' ' ? ' ' : c)));
}
