import { TestBed } from '@angular/core/testing';
import { installFakeCanvas } from '../testing/fake-canvas';
import { App } from './app';

describe('App', () => {
  beforeAll(installFakeCanvas);
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('com skipIntro (build de desenvolvimento) pula a abertura e entra no site', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(document.documentElement.classList.contains('site-on')).toBe(true);
    expect(el.querySelector<HTMLElement>('#site')?.hidden).toBe(false);
    expect(el.querySelector<HTMLElement>('#gate')?.hidden).toBe(true);
    expect(sessionStorage.getItem('vila-chegou')).toBe('1');
    expect(el.querySelector('#site > .hero#inicio h1')?.textContent).toContain('João Pedro');
    expect(el.querySelectorAll('.shelf li')).toHaveLength(28);
  });

  it('a tela inicial mostra os cinco personagens, e escolher um fica lembrado', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const cards = [...el.querySelectorAll<HTMLButtonElement>('.cast-card')];
    expect(cards.map((c) => c.textContent)).toEqual(['Pistoleiro', 'Misterioso', 'Vaqueira', 'Senhora', 'Cangaceiro']);
    cards[2].click();
    await fixture.whenStable();
    expect(cards[2].getAttribute('aria-checked')).toBe('true');
    expect(el.querySelector('#hero-name')?.textContent).toBe('Vaqueira aventureira');
    expect(localStorage.getItem('vila-heroi')).toBe('cowgirl');
    expect(el.querySelector('#d-weapon')?.textContent).toBe('Vaqueira aventureira · arma: laço');
    localStorage.removeItem('vila-heroi');
  });
});
