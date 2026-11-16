import { ChangeDetectionStrategy, Component } from '@angular/core';

// As bandeirinhas de festa no terreiro: dois cordões atravessados, cada bandeira com o corte em V
// no pé, balançando no vento (o CSS gira cada uma em volta do próprio topo). Só desenho.

interface Flag { x: number; y: number; a: number; c: number; d: number }

/** as bandeiras ao longo de uma curva (quadrática) de `from` a `to`, com o cordão cedendo `sag` no meio */
function cord(n: number, from: [number, number], to: [number, number], sag: number, shift: number): { d: string; flags: Flag[] } {
  const cx = (from[0] + to[0]) / 2, cy = (from[1] + to[1]) / 2 + sag * 2;
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * from[0] + 2 * u * t * cx + t * t * to[0],
      y: u * u * from[1] + 2 * u * t * cy + t * t * to[1],
      // a inclinação do cordão naquele ponto, para a bandeira acompanhar a curva
      a: Math.atan2(2 * u * (cy - from[1]) + 2 * t * (to[1] - cy), 2 * u * (cx - from[0]) + 2 * t * (to[0] - cx)) * 180 / Math.PI,
    };
  };
  const flags = Array.from({ length: n }, (_, i) => {
    const p = at((i + 0.5) / n);
    return { x: +p.x.toFixed(1), y: +p.y.toFixed(1), a: +p.a.toFixed(1), c: (i + shift) % 5, d: +((i * 0.37) % 2.2).toFixed(2) };
  });
  return { d: `M${from[0]} ${from[1]} Q${cx} ${cy} ${to[0]} ${to[1]}`, flags };
}

const CORDS = [cord(22, [-20, 6], [1220, 22], 34, 0), cord(16, [-20, 30], [1220, 4], 22, 3)];

@Component({
  selector: 'svg[appBandeirinhas]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 1200 110', preserveAspectRatio: 'xMidYMin slice', 'aria-hidden': 'true', focusable: 'false', class: 'bandeirinhas' },
  template: `
    @for (c of cords; track $index) {
      <svg:path class="bd-cord" [attr.d]="c.d" />
      @for (f of c.flags; track $index) {
        <svg:g [attr.transform]="'translate(' + f.x + ' ' + f.y + ') rotate(' + f.a + ')'">
          <svg:path class="bd-flag" [attr.data-c]="f.c" [style.--d]="f.d" d="M-13 0 H13 V30 L0 21 L-13 30 Z" />
        </svg:g>
      }
    }
  `,
})
export class Bandeirinhas {
  protected readonly cords = CORDS;
}
