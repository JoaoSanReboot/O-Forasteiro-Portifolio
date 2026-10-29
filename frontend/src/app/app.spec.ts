import { TestBed } from '@angular/core/testing';
import { installFakeCanvas } from '../testing/fake-canvas';
import { App } from './app';

describe('App', () => {
  beforeAll(installFakeCanvas);
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('abre direto no site (modo site-on), com o topo e as seções', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(document.documentElement.classList.contains('site-on')).toBe(true);
    expect(el.querySelector('#site > .hero#inicio h1')?.textContent).toContain('João Pedro');
    expect(el.querySelector('#skills h2')?.textContent).toBe('Skills.');
    expect(el.querySelectorAll('.shelf li')).toHaveLength(28);
  });
});
