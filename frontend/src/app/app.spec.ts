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

  it('pular a abertura solta o site: a cortina sobe, a rolagem volta e o topo entra', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('.intro-skip')!.click();
    await fixture.whenStable();
    expect(el.querySelector('app-intro')?.classList.contains('leaving')).toBe(true);
    expect(document.documentElement.classList.contains('intro-on')).toBe(false);
    expect(document.documentElement.classList.contains('ready')).toBe(true);
    expect(el.querySelector('#site')?.hasAttribute('inert')).toBe(false);
  });

  it('"Rever a abertura" traz a abertura de volta', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('.intro-skip')!.click();
    await new Promise((r) => setTimeout(r, 1200));
    await fixture.whenStable();
    expect(el.querySelector('app-intro')).toBeNull();
    const replay = [...el.querySelectorAll<HTMLButtonElement>('.foot button')].find((b) => b.textContent?.includes('Rever a abertura'))!;
    replay.click();
    await fixture.whenStable();
    expect(el.querySelector('app-intro')).not.toBeNull();
    expect(document.documentElement.classList.contains('ready')).toBe(false);
  });
});
