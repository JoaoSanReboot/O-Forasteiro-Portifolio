import { TestBed } from '@angular/core/testing';
import { BANDITS } from '../../content/jogos';
import { Duelo } from './duelo';

// O duelo da Experiência: os bandidos são os problemas que eu resolvi
describe('Duelo', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [Duelo] }).compileComponents();
    const fixture = TestBed.createComponent(Duelo);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('pendura um cartaz por problema resolvido e oferece as cinco armas', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('.wc-alias')].map((a) => a.textContent)).toEqual(BANDITS.map((b) => b.alias));
    expect(el.querySelector('.wc-crime')?.textContent).toContain(BANDITS[0].before);
    expect(el.querySelectorAll('input[name="duel-weapon"]')).toHaveLength(5);
    expect(el.querySelector('.duel-hud')?.textContent).toContain(BANDITS[0].alias);
  });

  it('sacar antes do sino deixa o bandido fugir e custa um chapéu', async () => {
    const { fixture, el } = await render();
    el.querySelector<HTMLButtonElement>('.duel-foot > .btn')!.click();
    await fixture.whenStable();
    expect(el.querySelector('.duel-stage')?.classList.contains('ph-waiting')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    await fixture.whenStable();
    expect(el.querySelector('.duel-stamp')?.textContent).toContain(`${BANDITS[0].alias} fugiu`);
    expect(el.querySelector('.game-score')?.textContent).toMatch(/Presos 0 de 4 · Chapéus 2/);
    fixture.destroy();
  });
});
