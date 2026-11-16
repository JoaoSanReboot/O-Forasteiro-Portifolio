import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

// Os emblemas dos títulos: cada seção ganha um desenho de xilogravura que conta o próprio título
// e se mexe quando entra na tela (a classe `in` vem do appReveal do cabeçalho):
//   chapeu     "Olá, forasteiro!"         o vaqueiro que tira o chapéu de cangaceiro num cumprimento
//   bigorna    "Forjados na bigorna."     o martelo batendo a ferradura em brasa na bigorna, soltando faísca
//   rastros    "Rastros pelo caminho."    as pegadas de alpercata andando
//   peixeiras  "Ferramentas do ofício."   as peixeiras cruzadas com a estrela do cangaço
//   telegrafo  "Sinais do telégrafo."     os postes e o sinal correndo pelo fio
//   candeeiro  "Escola, e a vida inteira." o candeeiro de lata com a chama tremendo
//   fogueira   "Bora prosear?"            a fogueira da prosa, com as fagulhas subindo
// São só desenho (aria-hidden). Cores: currentColor para o traço e as classes `e-fogo`, `e-sol`,
// `e-couro` e `e-furo` (CSS em styles/_emblems.scss).

export type EmblemKind = 'chapeu' | 'bigorna' | 'rastros' | 'peixeiras' | 'telegrafo' | 'candeeiro' | 'fogueira';

const VIEWBOX: Record<EmblemKind, string> = {
  chapeu: '0 0 100 130',
  bigorna: '0 0 160 120',
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
        <svg:g class="e-boneco" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
          <svg:path d="M49 82 L45 104 L44 122 M52 82 L56 104 L58 122" stroke-width="7" />
          <svg:path d="M39 124 H49 M55 124 H65" stroke-width="6" />
          <svg:g class="e-tronco">
            <svg:path d="M47 57 L42 72 L45 84" stroke-width="6" />
            <svg:path d="M50 82 L50 54" stroke-width="15" />
            <svg:circle cx="50" cy="42" r="8.5" fill="currentColor" stroke="none" />
            <svg:path d="M43 50 L58 52 L49 60 Z" class="e-fogo" stroke="none" />
            <svg:circle cx="54.5" cy="41" r="1.3" class="e-furo" stroke="none" />
            <svg:g class="e-braco">
              <svg:path d="M54 56 L65 48 L61 35" stroke-width="6" />
              <svg:g class="e-hat">
                <svg:path d="M35 35 Q50 10 65 35 Z" fill="currentColor" stroke-width="1.5" />
                <svg:path d="M29 36.5 Q50 27 71 36.5" stroke-width="3.4" />
                <svg:path d="M40 31 Q50 21 60 31" class="e-furo-s" stroke-width="1.2" stroke-dasharray="1.6 2.4" />
                <svg:polygon [attr.points]="star" class="e-sol" stroke="none" transform="translate(45.5 19.5) scale(.09)" />
              </svg:g>
            </svg:g>
          </svg:g>
        </svg:g>
        <svg:path d="M26 127 H74" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round" opacity=".5" />
      }
      @case ('bigorna') {
        <svg:circle class="e-glow" cx="93" cy="44" r="22" />
        <svg:g fill="currentColor">
          <svg:path d="M46 48 Q24 49 12 57 Q30 61 46 61 Z" />
          <svg:path d="M44 47 H126 V60 H114 Q104 62 100 72 H72 Q68 62 58 60 H44 Z" />
          <svg:path d="M74 71 H98 L102 88 H70 Z" />
          <svg:path d="M58 87 H114 L122 99 H50 Z" />
        </svg:g>
        <svg:path d="M50 53 H120" class="e-furo-s" stroke-width="1.2" opacity=".6" />
        <svg:path class="e-peca" d="M82 44.5 H96 Q104 44.5 104 41.5 Q104 38.5 96 38.5 H82" fill="none" stroke-width="4" stroke-linecap="round" />
        <svg:g class="e-martelo">
          <svg:path d="M140 32 L98 25.5" stroke-width="5" stroke-linecap="round" class="e-cabo" />
          <svg:path d="M92 13 H104 L103 16.5 V34.5 L104 38.5 H92 L93 34.5 V16.5 Z" fill="currentColor" />
          <svg:path d="M94 23 H102 M94 28 H102" class="e-furo-s" stroke-width="1.1" />
        </svg:g>
        <svg:g class="e-faiscas">
          <svg:circle cx="94" cy="40" r="2" style="--dx:-26px; --dy:-22px" />
          <svg:circle cx="94" cy="40" r="1.6" style="--dx:-14px; --dy:-32px" />
          <svg:circle cx="94" cy="40" r="1.8" style="--dx:18px; --dy:-26px" />
          <svg:circle cx="94" cy="40" r="1.4" style="--dx:30px; --dy:-12px" />
          <svg:circle cx="94" cy="40" r="1.5" style="--dx:-34px; --dy:-6px" />
          <svg:circle cx="94" cy="40" r="1.3" style="--dx:6px; --dy:-36px" />
        </svg:g>
        <svg:path d="M40 112 H132" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1 5" stroke-linecap="round" opacity=".5" />
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
