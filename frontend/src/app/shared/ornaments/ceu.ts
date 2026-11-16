import { ChangeDetectionStrategy, Component } from '@angular/core';

// O céu do sertão à noite: estrelas miúdas piscando e o Cruzeiro do Sul, que guiava quem andava
// pela caatinga de madrugada. As posições saem de um sorteio com semente fixa, então o prerender
// e o navegador desenham o mesmo céu. Só desenho: `aria-hidden` sempre.

interface Star { x: number; y: number; r: number; d: number }

/** gerador com semente (LCG): o mesmo céu em todo lugar */
function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

function sky(n: number): Star[] {
  const rand = seeded(1938);
  return Array.from({ length: n }, () => ({
    x: +(rand() * 1000).toFixed(1),
    y: +(rand() * 400).toFixed(1),
    r: +(0.6 + rand() * rand() * 1.8).toFixed(2),
    d: +(rand() * 6).toFixed(2),
  }));
}

/** o Cruzeiro do Sul: Gacrux no alto, Mimosa à esquerda, Acrux embaixo, Pálida à direita e a Intrometida */
const CRUZEIRO = [
  { x: 820, y: 60, r: 3.4, d: 0 },
  { x: 788, y: 126, r: 3.8, d: 1.4 },
  { x: 828, y: 196, r: 4.2, d: 0.7 },
  { x: 866, y: 112, r: 2.8, d: 2.1 },
  { x: 850, y: 156, r: 1.8, d: 3 },
].map((s) => ({ d: s.d, path: sparkle(s) }));

/** a estrela de quatro pontas (o brilho cruzado das estrelas grandes) */
function sparkle({ x, y, r }: Star): string {
  const far = r * 2.6, near = r * 0.55;
  return `M${x} ${y - far} L${x + near} ${y - near} L${x + far} ${y} L${x + near} ${y + near} `
    + `L${x} ${y + far} L${x - near} ${y + near} L${x - far} ${y} L${x - near} ${y - near} Z`;
}

const STARS = sky(70);

@Component({
  selector: 'svg[appCeu]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 1000 400', preserveAspectRatio: 'xMaxYMin slice', 'aria-hidden': 'true', focusable: 'false', class: 'ceu' },
  template: `
    @for (s of stars; track $index) {
      <svg:circle class="ceu-star" [attr.cx]="s.x" [attr.cy]="s.y" [attr.r]="s.r" [style.--d]="s.d" />
    }
    <svg:g class="cruzeiro">
      @for (s of cruzeiro; track $index) {
        <svg:path class="ceu-cruz" [style.--d]="s.d" [attr.d]="s.path" />
      }
    </svg:g>
  `,
})
export class Ceu {
  protected readonly stars = STARS;
  protected readonly cruzeiro = CRUZEIRO;
}
