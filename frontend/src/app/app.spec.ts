import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    document.documentElement.className = '';
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('a página abre na abertura, com o site já no HTML embaixo dela (inerte até a cortina subir)', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-intro')).not.toBeNull();
    expect(el.querySelector('.intro-word .sr-only')?.textContent).toBe('Forasteiro');
    expect(document.documentElement.classList.contains('intro-on')).toBe(true);
    expect(el.querySelector('#site')?.hasAttribute('inert')).toBe(true);
    expect(el.querySelector('#site h1')?.textContent).toContain('João');
  });

  it('a tela de carregamento dá as boas-vindas e não tem como pular: nem botão, nem clique, nem teclado', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const intro = el.querySelector<HTMLElement>('app-intro')!;
    expect(intro.querySelector('.intro-hello')?.textContent).toBe('Seja bem-vindo,');
    expect(intro.querySelector('.intro-sub')?.textContent).toBe('ao portfólio de João Pedro');
    expect(intro.querySelector('button')).toBeNull();
    // o carregamento é o tambor: começa com uma bala e o contador em 1 de 6
    expect(intro.querySelector('.intro-count')?.textContent).toBe('1/6');
    intro.click();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();
    expect(intro.classList.contains('leaving')).toBe(false);
    expect(document.documentElement.classList.contains('intro-on')).toBe(true);
  });

  it('quando a sexta bala entra no tambor a cortina sobe sozinha e solta o site', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    await new Promise((r) => setTimeout(r, 2900));
    await fixture.whenStable();
    expect(el.querySelector('.intro-count')?.textContent).toBe('6/6');
    expect(el.querySelector('app-intro')?.classList.contains('leaving')).toBe(true);
    expect(document.documentElement.classList.contains('intro-on')).toBe(false);
    expect(document.documentElement.classList.contains('ready')).toBe(true);
    expect(el.querySelector('#site')?.hasAttribute('inert')).toBe(false);
  }, 6000);

  it('"Rever a abertura" traz a abertura de volta', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    await new Promise((r) => setTimeout(r, 4000));
    await fixture.whenStable();
    expect(el.querySelector('app-intro')).toBeNull();
    const replay = [...el.querySelectorAll<HTMLButtonElement>('.foot button')].find((b) => b.textContent?.includes('Rever a abertura'))!;
    replay.click();
    await fixture.whenStable();
    expect(el.querySelector('app-intro')).not.toBeNull();
    expect(document.documentElement.classList.contains('ready')).toBe(false);
  }, 7000);
});
