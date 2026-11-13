import { ChangeDetectionStrategy, Component } from '@angular/core';

// Os ornamentos do sertão, em SVG e na cor do texto (currentColor): a estrela de couro dos chapéus
// de cangaceiro, o sol de xilogravura de cordel, o mandacaru e o chapéu de couro meia-lua.
// São só desenho: `aria-hidden` sempre.

/** pontos de uma estrela de `n` pontas no quadro 100 × 100 */
function starPoints(n: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer, a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

/** os raios do sol: triângulos alternando compridos e curtos, como entalhe de xilogravura */
function rays(n: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n, w = Math.PI / n * 0.55, r0 = 36, r1 = i % 2 ? 44 : 50;
    const p = (r: number, t: number) => `${(50 + r * Math.cos(t)).toFixed(2)} ${(50 + r * Math.sin(t)).toFixed(2)}`;
    d += `M${p(r0, a - w)}L${p(r1, a)}L${p(r0, a + w)}Z`;
  }
  return d;
}

const STAR8 = starPoints(8, 50, 24);
const STAR8_IN = starPoints(8, 28, 14);
const RAYS = rays(24);

@Component({
  selector: 'svg[appEstrela]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false', class: 'orn orn-estrela' },
  template: `
    <svg:polygon [attr.points]="star" fill="currentColor" />
    <svg:polygon [attr.points]="inner" fill="var(--orn-hole, transparent)" />
    <svg:circle cx="50" cy="50" r="6" fill="currentColor" />
  `,
})
export class Estrela {
  protected readonly star = STAR8;
  protected readonly inner = STAR8_IN;
}

@Component({
  selector: 'svg[appSol]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false', class: 'orn orn-sol' },
  template: `
    <svg:g class="sol-rays"><svg:path [attr.d]="rays" fill="currentColor" /></svg:g>
    <svg:circle cx="50" cy="50" r="31" fill="currentColor" />
    <svg:circle cx="50" cy="50" r="24" fill="none" stroke="var(--orn-hole, transparent)" stroke-width="1.6" stroke-dasharray="3 4" />
  `,
})
export class Sol {
  protected readonly rays = RAYS;
}

@Component({
  selector: 'svg[appMandacaru]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 100 160', 'aria-hidden': 'true', focusable: 'false', class: 'orn orn-mandacaru' },
  template: `
    <svg:g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
      <svg:path d="M50 158 V20" stroke-width="20" />
      <svg:path d="M44 96 H27 Q20 96 20 89 V52" stroke-width="15" />
      <svg:path d="M56 74 H74 Q81 74 81 67 V34" stroke-width="15" />
    </svg:g>
    <svg:g fill="none" stroke="var(--orn-hole, transparent)" stroke-width="1.6" stroke-linecap="round">
      <svg:path d="M46 150 V26 M54 150 V26 M20 88 V58 M81 66 V40" />
    </svg:g>
  `,
})
export class Mandacaru {}

@Component({
  selector: 'svg[appChapeu]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { viewBox: '0 0 120 70', 'aria-hidden': 'true', focusable: 'false', class: 'orn orn-chapeu' },
  template: `
    <!-- o chapéu meia-lua: aba virada para cima na frente, copa por trás e a estrela no meio -->
    <svg:path d="M60 26 C38 26 30 44 30 56 L90 56 C90 44 82 26 60 26 Z" fill="currentColor" opacity=".72" />
    <svg:path d="M4 30 C20 58 100 58 116 30 C100 66 20 66 4 30 Z" fill="currentColor" />
    <svg:path d="M14 10 C30 62 90 62 106 10 C96 50 24 50 14 10 Z" fill="currentColor" />
    <svg:polygon [attr.points]="star" fill="var(--orn-hole, transparent)" transform="translate(48 22) scale(.24)" />
  `,
})
export class Chapeu {
  protected readonly star = STAR8;
}
