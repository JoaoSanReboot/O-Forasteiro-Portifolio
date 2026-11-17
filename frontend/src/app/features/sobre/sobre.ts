import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SOBRE } from '../../content/profile';
import { SectionHead } from '../../shared/section-head/section-head';

// 01 · Sobre: "Olá, forasteiro!" com o vaqueiro (virado para a esquerda) que tira o chapéu quando o cabeçalho chega na tela, e a
// apresentação em parágrafos simples, num tipo só, já inteira e acesa.
@Component({
  selector: 'section[appSobre]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead],
  host: { class: 'sec sobre', id: 'sobre', 'aria-labelledby': 't-sobre' },
  template: `
    <div class="wrap">
      <header appSectionHead num="01" label="Sobre" title="Olá," accent="forasteiro!" emblem="chapeu" titleId="t-sobre"></header>
      <div class="sobre-texto">
        @for (par of paragrafos; track $index) { <p>{{ par }}</p> }
      </div>
    </div>
  `,
})
export class Sobre {
  protected readonly paragrafos = SOBRE;
}
