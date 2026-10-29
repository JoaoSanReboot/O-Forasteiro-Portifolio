import { TestBed } from '@angular/core/testing';
import { installFakeCanvas } from '../../../testing/fake-canvas';
import { Commits } from './commits';
import { GITHUB_ENDPOINT } from './github-endpoint';

const ENDPOINT = 'https://api.forasteiro.example/api/github/contributions';
const LIVE = {
  total: 6,
  days: [
    { date: '2026-10-25', count: 0, level: 0 },
    { date: '2026-10-26', count: 1, level: 1 },
    { date: '2026-10-27', count: 5, level: 3 },
  ],
  fetchedAt: '2026-10-29T12:00:00.000Z',
};

// só o que a placa lê da resposta; nada sai para a rede
const reply = (status: number, body: unknown) => Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('Commits (placa do GitHub)', () => {
  beforeAll(installFakeCanvas);
  afterEach(() => vi.unstubAllGlobals());

  async function render(endpoint: string | null, fetch: () => Promise<Response>) {
    const spy = vi.fn(fetch);
    vi.stubGlobal('fetch', spy);
    await TestBed.configureTestingModule({ imports: [Commits], providers: [{ provide: GITHUB_ENDPOINT, useValue: endpoint }] }).compileComponents();
    const fixture = TestBed.createComponent(Commits);
    await fixture.whenStable();
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { spy, el, status: () => el.querySelector('#heat-status')?.textContent?.trim(), buttons: () => el.querySelectorAll('#heat button') };
  }

  it('sem endpoint: não consulta nada e mostra o registro guardado', async () => {
    const { spy, status, buttons } = await render(null, () => reply(200, LIVE));
    expect(spy).not.toHaveBeenCalled();
    expect(buttons()).toHaveLength(366);
    expect(status()).toBe('Integração ao vivo com o GitHub ainda não configurada: mostrando o registro de outubro de 2026.');
  });

  it('ao vivo: troca o registro pelos dias reais, com a contagem de cada dia', async () => {
    const { spy, el, status, buttons } = await render(ENDPOINT, () => reply(200, LIVE));
    expect(spy).toHaveBeenCalledWith(ENDPOINT, expect.objectContaining({ headers: { Accept: 'application/json' } }));
    expect(buttons()).toHaveLength(3);
    expect(el.querySelectorAll('#heat .pad')).toHaveLength(0); // 25/10/2026 é domingo
    expect([...buttons()].map((b) => b.className)).toEqual(['', 'l1', 'l3']);
    expect(buttons()[1].getAttribute('aria-label')).toBe('segunda-feira, 26 de outubro de 2026: 1 contribuição');
    expect(buttons()[2].getAttribute('aria-label')).toBe('terça-feira, 27 de outubro de 2026: 5 contribuições');
    expect(el.querySelector('#heat-count')?.textContent).toBe('6');
    expect([...el.querySelectorAll('.heat-legend span')].map((s) => s.textContent?.trim())).toEqual(['out 2026', 'out 2026']);
    expect(status()).toBe('Ao vivo do GitHub · atualizado em 29/10/2026.');
  });

  it('erro da API: mantém o registro guardado e avisa que está sem sinal', async () => {
    const { status, buttons } = await render(ENDPOINT, () => reply(502, { error: 'github_error' }));
    expect(buttons()).toHaveLength(366);
    expect(status()).toBe('Sem sinal do GitHub agora: mostrando o registro de outubro de 2026.');
  });

  it('falha de rede: mantém o registro guardado e avisa que está sem sinal', async () => {
    const { status, buttons } = await render(ENDPOINT, () => Promise.reject(new TypeError('Failed to fetch')));
    expect(buttons()).toHaveLength(366);
    expect(status()).toBe('Sem sinal do GitHub agora: mostrando o registro de outubro de 2026.');
  });

  it('resposta sem dias: mantém o registro guardado e avisa', async () => {
    const { status, buttons } = await render(ENDPOINT, () => reply(200, { total: 0, days: [] }));
    expect(buttons()).toHaveLength(366);
    expect(status()).toBe('O GitHub não mandou dados agora: mostrando o registro de outubro de 2026.');
  });
});
