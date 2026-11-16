import { TestBed } from '@angular/core/testing';
import { PAIRS } from '../../content/jogos';
import { Memoria } from './memoria';

describe('Cordel da memória', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [Memoria] }).compileComponents();
    const fixture = TestBed.createComponent(Memoria);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('cada ferramenta tem a sua carta e a do lugar onde trabalhou', async () => {
    const { el } = await render();
    const texts = [...el.querySelectorAll('.mem-front')].map((f) => f.textContent?.trim());
    expect(texts).toHaveLength(PAIRS.length * 2);
    for (const p of PAIRS) expect(texts).toEqual(expect.arrayContaining([p.tool, p.where]));
  });

  it('achar um par deixa as duas cartas abertas e conta no placar', async () => {
    const { fixture, el } = await render();
    const cards = () => [...el.querySelectorAll<HTMLButtonElement>('.mem-card')];
    const text = (b: HTMLButtonElement) => b.querySelector('.mem-front')!.textContent!.trim();
    const tool = cards().find((b) => text(b) === PAIRS[0].tool)!;
    const where = cards().find((b) => text(b) === PAIRS[0].where)!;
    tool.click(); where.click();
    await fixture.whenStable();
    expect(tool.classList.contains('found') && where.classList.contains('found')).toBe(true);
    expect(el.querySelector('.game-score')?.textContent).toContain('Pares 1 de 6');
    expect(tool.getAttribute('aria-label')).toBe(PAIRS[0].tool);
  });
});
