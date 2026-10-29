import { TestBed } from '@angular/core/testing';
import { installFakeCanvas } from '../../testing/fake-canvas';
import { Site } from './site';

describe('Site', () => {
  beforeAll(installFakeCanvas);

  async function render() {
    await TestBed.configureTestingModule({ imports: [Site] }).compileComponents();
    const fixture = TestBed.createComponent(Site);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }
  const click = async (fixture: { whenStable(): Promise<unknown> }, b: Element | null | undefined) => { (b as HTMLElement).click(); await fixture.whenStable(); };

  it('monta as seções na ordem do legado, cada uma com a sua cena', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('main > section')].map((s) => s.id)).toEqual(['procurado', 'projetos', 'trabalhos', 'skills', 'commits', 'formacao', 'saloon']);
    expect([...el.querySelectorAll('figure.scene')].map((f) => f.getAttribute('data-scene'))).toEqual(['ferraria', 'delegacia', 'armeiro', 'telegrafo', 'escola', 'saloon']);
    expect(el.querySelectorAll('.flyer')).toHaveLength(6);
    expect(el.querySelector<HTMLImageElement>('.p-photo img')?.getAttribute('src')).toBe('assets/retrato-cartaz.png');
  });

  it('baús: abre, mostra o projeto e troca com as setas', async () => {
    const { fixture, el } = await render();
    const main = el.querySelector('#chest-main')!;
    expect(el.querySelector('#chest-name')?.textContent).toBe('Ukra');
    expect(main.getAttribute('aria-label')).toBe('Abrir o baú: Ukra');
    await click(fixture, main);
    expect(main.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('#cp-title')?.textContent).toBe('Totem e Gestão de Pedidos');
    expect(el.querySelector('#chest-hint')?.textContent).toBe('Toque de novo para fechar');
    await click(fixture, el.querySelector('#chest-prev'));
    await new Promise((r) => setTimeout(r, 50));
    await fixture.whenStable();
    expect(el.querySelector('#chest-name')?.textContent).toBe('José, o Jogo');
  });

  it('fichas: só uma aberta por vez', async () => {
    const { el } = await render();
    const [a, b] = [...el.querySelectorAll<HTMLDetailsElement>('#trabalhos details')];
    a.open = true; a.dispatchEvent(new Event('toggle'));
    b.open = true; b.dispatchEvent(new Event('toggle'));
    expect([a.open, b.open]).toEqual([false, true]);
  });

  it('placa: um botão por dia do registro e a legenda do período', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('#heat button')).toHaveLength(366);
    expect(el.querySelectorAll('#heat button.l1, #heat button.l2, #heat button.l3')).toHaveLength(15);
    expect([...el.querySelectorAll('.heat-legend span')].map((s) => s.textContent?.trim())).toEqual(['out 2025', 'out 2026']);
    expect(el.querySelector('#heat-status')?.textContent).toContain('ainda não configurada');
  });

  it('jogo da velha: abre pelo convite, joga e conta o placar', async () => {
    const { fixture, el } = await render();
    const panel = el.querySelector<HTMLElement>('#velha-panel')!;
    expect(panel.hidden).toBe(true);
    await click(fixture, el.querySelector('.say'));
    expect(panel.hidden).toBe(false);
    const cells = () => [...el.querySelectorAll<HTMLButtonElement>('#velha button')];
    await click(fixture, cells()[0]);
    expect(cells()[0].getAttribute('aria-label')).toBe('Linha 1, coluna 1: sua bala');
    expect(cells()[4].getAttribute('aria-label')).toBe('Linha 2, coluna 2: ferradura');
    expect(el.querySelector('#velha-msg')?.textContent).toBe('Sua vez.');
    await click(fixture, el.querySelector('#velha-close'));
    expect(panel.hidden).toBe(true);
  });
});
