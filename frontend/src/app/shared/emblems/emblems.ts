import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Os emblemas dos títulos: cada seção ganha um desenho de xilogravura que conta o próprio título
// e se mexe quando entra na tela (a classe `in` vem do appReveal do cabeçalho):
//   chapeu     "Prazer, forasteiro."      o chapéu de couro tirado num cumprimento
//   ferro      "Feitos a ferro e fogo."   o ferro de marcar em brasa, soltando faísca
//   rastros    "Rastros pelo caminho."    as pegadas de alpercata andando
//   peixeiras  "Ferramentas do ofício."   as peixeiras cruzadas com a estrela do cangaço
//   telegrafo  "Sinais do telégrafo."     os postes e o sinal correndo pelo fio
//   candeeiro  "Escola, e a vida inteira." o candeeiro de lata com a chama tremendo
//   fogueira   "Bora prosear?"            a fogueira da prosa, com as fagulhas subindo
// São só desenho (aria-hidden). Cores: currentColor para o traço e as classes `e-fogo`, `e-sol`,
// `e-couro` e `e-furo` (CSS em styles/_emblems.scss).

export type EmblemKind = 'chapeu' | 'ferro' | 'rastros' | 'peixeiras' | 'telegrafo' | 'candeeiro' | 'fogueira';

const VIEWBOX: Record<EmblemKind, string> = {
  chapeu: '0 0 120 90',
  ferro: '0 0 160 120',
  rastros: '0 0 260 80',
  peixeiras: '0 0 120 120',
  telegrafo: '0 0 200 120',
  candeeiro: '0 0 100 130',
  fogueira: '0 0 120 120',
};

function starPoints(n: number, outer: number, inner: number, cx = 50, cy = 50): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer, a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** as pegadas: alpercata esquerda e direita alternando, andando para a direita */
const STEPS = Array.from({ length: 8 }, (_, k) => ({ x: 16 + k * 31, y: k % 2 ? 50 : 30, r: k % 2 ? 6 : -6 }));

@Component({
  selector: 'svg[appEmblema]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.viewBox]': 'box()',
    'aria-hidden': 'true',
    focusable: 'false',
    class: 'orn em',
    '[attr.data-em]': 'kind()',
  },
  template: `
    @switch (kind()) {
      @case ('chapeu') {
        <svg:g class="e-hat">
          <svg:path d="M60 28 C38 28 30 46 30 58 L90 58 C90 46 82 28 60 28 Z" class="e-couro" />
          <svg:path d="M4 32 C20 60 100 60 116 32 C100 68 20 68 4 32 Z" fill="currentColor" />
          <svg:path d="M14 12 C30 64 90 64 106 12 C96 52 24 52 14 12 Z" fill="currentColor" />
          <svg:path d="M22 22 C36 54 84 54 98 22" fill="none" class="e-furo-s" stroke-width="1.4" stroke-dasharray="2 3" />
          <svg:polygon [attr.points]="star" class="e-sol" transform="translate(49 25) scale(.22)" />
        </svg:g>
        <svg:path d="M30 86 H90" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round" opacity=".5" />
      }
      @case ('ferro') {
        <svg:g transform="rotate(-24 80 60)">
          <svg:g class="e-iron">
            <svg:rect x="6" y="54" width="42" height="13" rx="6.5" class="e-couro" />
            <svg:path d="M14 54 V67 M22 54 V67 M30 54 V67 M38 54 V67" class="e-furo-s" stroke-width="1.4" />
            <svg:path d="M48 60.5 H104" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
            <svg:g class="e-brand">
              <svg:circle cx="124" cy="60.5" r="17" fill="none" stroke-width="6" />
              <svg:path d="M118 50 V66 Q118 71 113 71 M126 71 V50 H131 Q137 50 137 56 Q137 62 131 62 H126" fill="none" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" />
            </svg:g>
          </svg:g>
        </svg:g>
        <svg:g class="e-sparks">
          <svg:circle cx="130" cy="40" r="2.4" style="--k:0" />
          <svg:circle cx="142" cy="46" r="1.8" style="--k:1" />
          <svg:circle cx="120" cy="34" r="1.6" style="--k:2" />
          <svg:circle cx="136" cy="30" r="2" style="--k:3" />
        </svg:g>
        <svg:path class="e-smoke" d="M128 30 C120 22 136 16 128 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      }
      @case ('rastros') {
        @for (s of steps; track $index) {
          <svg:g class="e-step" [style.--k]="$index" [attr.transform]="'translate(' + s.x + ' ' + s.y + ') rotate(' + s.r + ')'">
            <svg:path d="M-2 -6.5 C8 -7.5 14 -4 14 0 C14 4 8 7.5 -2 6.5 C-5 6 -5 -6 -2 -6.5 Z" fill="currentColor" />
            <svg:ellipse cx="-10" cy="0" rx="4.6" ry="5" fill="currentColor" />
          </svg:g>
        }
      }
      @case ('peixeiras') {
        <svg:g class="e-knife e-k1">
          <svg:g transform="translate(60 60) rotate(-45) translate(-59 0)">
            <svg:rect x="0" y="-6" width="36" height="12" rx="4" class="e-couro" />
            <svg:circle cx="10" cy="0" r="1.8" class="e-sol" /><svg:circle cx="24" cy="0" r="1.8" class="e-sol" />
            <svg:rect x="36" y="-7.5" width="5" height="15" rx="1.5" fill="currentColor" />
            <svg:path d="M41 -5 H102 Q114 -4 120 3 L41 6 Z" fill="currentColor" />
            <svg:path d="M46 -1.5 H100" class="e-furo-s" stroke-width="1.2" />
          </svg:g>
        </svg:g>
        <svg:g class="e-knife e-k2">
          <svg:g transform="translate(60 60) rotate(-135) scale(1 -1) translate(-59 0)">
            <svg:rect x="0" y="-6" width="36" height="12" rx="4" class="e-couro" />
            <svg:circle cx="10" cy="0" r="1.8" class="e-sol" /><svg:circle cx="24" cy="0" r="1.8" class="e-sol" />
            <svg:rect x="36" y="-7.5" width="5" height="15" rx="1.5" fill="currentColor" />
            <svg:path d="M41 -5 H102 Q114 -4 120 3 L41 6 Z" fill="currentColor" />
            <svg:path d="M46 -1.5 H100" class="e-furo-s" stroke-width="1.2" />
          </svg:g>
        </svg:g>
        <svg:g class="e-star"><svg:polygon [attr.points]="star" class="e-sol" transform="translate(44 44) scale(.32)" /></svg:g>
      }
      @case ('telegrafo') {
        <svg:g fill="none" stroke="currentColor" stroke-linecap="round">
          <svg:path d="M28 24 V116 M172 24 V116" stroke-width="5" />
          <svg:path d="M12 30 H44 M156 30 H188" stroke-width="4" />
          <svg:path d="M18 31 Q100 62 182 31" stroke-width="1.6" opacity=".7" />
          <svg:path d="M38 31 Q100 50 162 31" stroke-width="1.6" opacity=".7" />
          <svg:path d="M8 116 H192" stroke-width="1.5" stroke-dasharray="1 5" opacity=".5" />
        </svg:g>
        <svg:g fill="currentColor"><svg:circle cx="18" cy="27" r="3" /><svg:circle cx="38" cy="27" r="3" /><svg:circle cx="162" cy="27" r="3" /><svg:circle cx="182" cy="27" r="3" /></svg:g>
        <svg:path class="e-signal" d="M18 31 Q100 62 182 31" fill="none" stroke-width="3.4" stroke-linecap="round" pathLength="100" />
        <svg:path class="e-signal e-signal-2" d="M38 31 Q100 50 162 31" fill="none" stroke-width="3.4" stroke-linecap="round" pathLength="100" />
        <svg:circle class="e-blink" cx="182" cy="27" r="5" />
        <svg:path class="e-bird" d="M86 39 q4 -5 8 0 q4 -5 8 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      }
      @case ('candeeiro') {
        <svg:circle class="e-glow" cx="50" cy="34" r="30" />
        <svg:g class="e-flame">
          <svg:path d="M50 6 C60 22 64 34 58 43 Q50 50 42 43 C36 34 40 22 50 6 Z" class="e-fogo" />
          <svg:path d="M50 22 C55 30 57 37 54 41 Q50 45 46 41 C43 37 45 30 50 22 Z" class="e-sol" />
        </svg:g>
        <svg:rect x="47" y="46" width="6" height="12" rx="1.5" fill="currentColor" />
        <svg:path d="M30 120 L70 120 L66 74 Q50 64 34 74 Z" fill="currentColor" />
        <svg:path d="M36 86 H64 M35 100 H65" class="e-furo-s" stroke-width="1.6" />
        <svg:path d="M69 112 Q92 100 68 80" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <svg:rect x="20" y="118" width="60" height="8" rx="3" fill="currentColor" />
      }
      @case ('fogueira') {
        <svg:circle class="e-glow" cx="60" cy="70" r="40" />
        <svg:g class="e-flames">
          <svg:path class="e-f1 e-fogo" d="M60 12 C76 36 86 56 80 76 Q72 92 60 92 Q46 92 40 76 C34 56 46 40 60 12 Z" />
          <svg:path class="e-f2 e-sol" d="M60 40 C70 54 74 66 70 78 Q66 88 60 88 Q52 88 50 78 C46 66 52 54 60 40 Z" />
          <svg:path class="e-f3 e-furo" d="M60 62 C65 70 66 76 64 82 Q62 86 60 86 Q56 86 55 82 C54 76 56 70 60 62 Z" />
        </svg:g>
        <svg:g class="e-logs">
          <svg:rect x="18" y="88" width="84" height="12" rx="6" class="e-couro" transform="rotate(14 60 94)" />
          <svg:rect x="18" y="88" width="84" height="12" rx="6" class="e-couro e-lenha" transform="rotate(-14 60 94)" />
        </svg:g>
        <svg:g class="e-sparks">
          <svg:circle cx="50" cy="30" r="2.2" style="--k:0" />
          <svg:circle cx="70" cy="24" r="1.8" style="--k:1" />
          <svg:circle cx="62" cy="14" r="1.6" style="--k:2" />
          <svg:circle cx="44" cy="20" r="1.4" style="--k:3" />
        </svg:g>
      }
    }
  `,
})
export class Emblema {
  readonly kind = input.required<EmblemKind>({ alias: 'appEmblema' });
  protected readonly box = computed(() => VIEWBOX[this.kind()]);
  protected readonly star = starPoints(8, 50, 22);
  protected readonly steps = STEPS;
}
