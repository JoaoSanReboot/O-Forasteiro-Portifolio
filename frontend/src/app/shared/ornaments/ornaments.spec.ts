import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Bandeirinhas } from './bandeirinhas';
import { Ceu } from './ceu';
import { Feno } from './feno';

@Component({
  imports: [Ceu, Bandeirinhas, Feno],
  template: `<svg appCeu></svg><svg appBandeirinhas></svg><svg appFeno></svg>`,
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

  it('o feno é um emaranhado de galhos com gravetos para fora, igual a cada desenho', async () => {
    const a = (await render()).querySelector('svg.feno')!;
    expect(a.getAttribute('aria-hidden')).toBe('true');
    const galhos = a.querySelector('.feno-galho')!.getAttribute('d')!;
    expect(galhos.match(/M/g)).toHaveLength(12);
    expect(a.querySelector('.feno-fio')!.getAttribute('d')!.match(/M/g)).toHaveLength(26);
    expect(a.querySelector('.feno-graveto')!.getAttribute('d')!.match(/M/g)).toHaveLength(14);
    TestBed.resetTestingModule();
    expect((await render()).querySelector('svg.feno .feno-galho')!.getAttribute('d')).toBe(galhos);
  });
});
