import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Bandeirinhas } from './bandeirinhas';
import { Ceu } from './ceu';

@Component({
  imports: [Ceu, Bandeirinhas],
  template: `<svg appCeu></svg><svg appBandeirinhas></svg>`,
})
class Palco {}

describe('Ornamentos do sertão', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [Palco] }).compileComponents();
    const fixture = TestBed.createComponent(Palco);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('o céu tem o Cruzeiro do Sul (cinco estrelas) e sai igual a cada desenho', async () => {
    const a = await render();
    const ceu = a.querySelector('svg.ceu')!;
    expect(ceu.getAttribute('aria-hidden')).toBe('true');
    expect(ceu.querySelectorAll('.ceu-cruz')).toHaveLength(5);
    const first = [...ceu.querySelectorAll('.ceu-star')].map((s) => s.getAttribute('cx'));
    TestBed.resetTestingModule();
    const b = await render();
    // semente fixa: o prerender e o navegador desenham o mesmo céu
    expect([...b.querySelectorAll('svg.ceu .ceu-star')].map((s) => s.getAttribute('cx'))).toEqual(first);
  });

  it('as bandeirinhas ficam penduradas em dois cordões', async () => {
    const el = await render();
    const flags = el.querySelector('svg.bandeirinhas')!;
    expect(flags.querySelectorAll('.bd-cord')).toHaveLength(2);
    expect(flags.querySelectorAll('.bd-flag').length).toBeGreaterThan(20);
  });
});
