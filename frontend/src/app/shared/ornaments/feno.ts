import { ChangeDetectionStrategy, Component } from '@angular/core';

// O feno (o rolo de capim seco que o vento leva pelo sertão): um emaranhado de galhos curvos dentro de uma
// bola, com os gravetos espetados para fora. Os galhos saem de um sorteio com semente fixa, então o prerender
// e o navegador desenham o mesmo rolo. Só desenho: quem anima (rolar, quicar, girar) é quem usa.

/** gerador com semente (LCG): o mesmo feno em todo lugar */
function seeded(seed: number): () => number {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

const R = 30;
const f = (n: number) => n.toFixed(1);
const at = (a: number, r: number) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`;

/** galhos curvos que cruzam a bola de um lado ao outro (os grossos primeiro) e gravetos para fora */
function feno(): { grossos: string; finos: string; gravetos: string } {
  const rand = seeded(1922);
  const arco = () => {
    const a1 = rand() * Math.PI * 2, a2 = a1 + (rand() < 0.5 ? -1 : 1) * (1 + rand() * 1.7);
    const r1 = R * (0.45 + rand() * 0.55), r2 = R * (0.45 + rand() * 0.55);
    const am = (a1 + a2) / 2 + (rand() - 0.5) * 0.8, rm = R * (0.15 + rand() * 0.95);
    return `M${at(a1, r1)} Q${at(am, rm)} ${at(a2, r2)}`;
  };
  const grossos = Array.from({ length: 12 }, arco).join(' ');
  const finos = Array.from({ length: 26 }, arco).join(' ');
  const gravetos = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + rand() * 0.4, out = R * (1.1 + rand() * 0.22);
    return `M${at(a, R * 0.82)} Q${at(a + 0.12, R)} ${at(a + (rand() - 0.5) * 0.3, out)}`;
  }).join(' ');
  return { grossos, finos, gravetos };
}

const FENO = feno();

@Component({
  selector: 'svg[appFeno]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '-40 -40 80 80', 'aria-hidden': 'true', focusable: 'false', class: 'feno' },
  template: `
    <svg:circle class="feno-miolo" r="22" />
    <svg:path class="feno-fio" [attr.d]="d.finos" />
    <svg:path class="feno-galho" [attr.d]="d.grossos" />
    <svg:path class="feno-graveto" [attr.d]="d.gravetos" />
  `,
})
export class Feno {
  protected readonly d = FENO;
}
