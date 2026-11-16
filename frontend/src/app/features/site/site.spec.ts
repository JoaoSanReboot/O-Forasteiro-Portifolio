import { TestBed } from '@angular/core/testing';
import { CONTACTS, EMAIL, JOBS } from '../../content/profile';
import { PROJECTS } from '../../content/projects';
import { SKILL_SHELVES } from '../../content/skills';
import { words } from '../sobre/sobre';
import { Site } from './site';

describe('Site', () => {
  async function render() {
    await TestBed.configureTestingModule({ imports: [Site] }).compileComponents();
    const fixture = TestBed.createComponent(Site);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }
  const click = async (fixture: { whenStable(): Promise<unknown> }, b: Element | null | undefined) => { (b as HTMLElement).click(); await fixture.whenStable(); };

  it('monta o topo e as seções na ordem, sem nenhum canvas de pixel art', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('main > section')].map((s) => s.id)).toEqual(['inicio', 'sobre', 'projetos', 'experiencia', 'skills', 'github', 'formacao', 'contato']);
    expect(el.querySelectorAll('canvas')).toHaveLength(0);
    expect(el.querySelector('#hero-title')?.textContent).toContain('João');
    expect(el.querySelector('.poster img')?.getAttribute('src')).toBe('assets/retrato-cartaz.png');
    expect(el.querySelector('.poster-head')?.textContent).toBe('Procura-se');
    // as faixas com as ferramentas saíram do topo
    expect(el.querySelector('.bands, .band')).toBeNull();
  });

  it('os jogos moram dentro das seções: o duelo na Experiência e a memória nas Skills', async () => {
    const { el } = await render();
    expect(el.querySelector('#experiencia #duelo')).not.toBeNull();
    expect(el.querySelector('#skills #memoria')).not.toBeNull();
    expect(el.querySelector('#saloon')).toBeNull();
  });

  it('cada título tem o emblema que o desenha e a tinta da prensa existe', async () => {
    const { el } = await render();
    const emblems = [...el.querySelectorAll('main > section')].slice(1).map((s) => s.querySelector('.sh-emblem')?.getAttribute('data-em'));
    expect(emblems).toEqual(['chapeu', 'ferro', 'rastros', 'peixeiras', 'telegrafo', 'candeeiro', 'fogueira']);
    for (const e of el.querySelectorAll('.sh-emblem')) expect(e.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('filter#tinta')).not.toBeNull();
    expect(el.querySelector('#t-experiencia')?.textContent).toContain('Rastros pelo');
  });

  it('a página é só rolagem: sem barra no topo, e o bolso das moedas fica no canto levando ao duelo', async () => {
    const { el } = await render();
    expect(el.querySelector('nav, .nav, .nav-links')).toBeNull();
    const purse = el.querySelector<HTMLAnchorElement>('.coin-purse')!;
    expect(purse.getAttribute('href')).toBe('#duelo');
    expect(el.querySelector(purse.getAttribute('href')!)).not.toBeNull();
    expect(purse.textContent?.replace(/\s/g, '')).toBe('0/5');
    expect(purse.getAttribute('aria-label')).toContain('0 de 5');
  });

  it('o topo mostra o nome e o cartaz enxuto, sem o rótulo "Portfólio · 2026"', async () => {
    const { el } = await render();
    expect(el.querySelector('#inicio')?.textContent).not.toContain('Portfólio');
    expect(el.querySelector('.poster-name')).not.toBeNull();
    expect(el.querySelector('.poster-reward')?.textContent).toContain('um bom projeto');
    expect(el.querySelector('.poster-stamp, .poster-hole, .poster-nail, .poster-seen')).toBeNull();
  });

  it('a frase do Sobre vira palavras, com os trechos marcados em itálico', () => {
    const w = words('Sou dev no *.NET*. Trabalho *do banco à tela*: APIs.');
    expect(w.map((x) => x.parts.map((p) => p.t).join(''))).toEqual(['Sou', 'dev', 'no', '.NET.', 'Trabalho', 'do', 'banco', 'à', 'tela:', 'APIs.']);
    expect(w[3].parts).toEqual([{ t: '.NET', em: true }, { t: '.', em: false }]);
    expect(w.slice(5, 9).every((x) => x.parts[0].em)).toBe(true);
    expect(w[8].parts[1]).toEqual({ t: ':', em: false });
  });

  it('projetos: uma linha por projeto, cada uma levando ao projeto em outra aba', async () => {
    const { el } = await render();
    const links = [...el.querySelectorAll<HTMLAnchorElement>('.work-link')];
    expect(links.map((a) => a.querySelector('.work-name')?.textContent)).toEqual(PROJECTS.map((p) => p.name));
    expect(links.map((a) => a.getAttribute('href'))).toEqual(PROJECTS.map((p) => p.href));
    expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBe(true);
    expect(el.querySelector('.work .tag')?.textContent).toBe('Em desenvolvimento');
  });

  it('experiência, skills e formação trazem todo o conteúdo', async () => {
    const { el } = await render();
    expect([...el.querySelectorAll('.job-org')].map((o) => o.textContent)).toEqual(JOBS.map((j) => `${j.org} · ${j.mode}`));
    expect(el.querySelectorAll('.job-bullets li')).toHaveLength(JOBS.reduce((n, j) => n + j.bullets.length, 0));
    expect([...el.querySelectorAll('.job-bullets strong')].map((s) => s.textContent)).toContain('60 s para 4 s');
    expect(el.querySelectorAll('.kit-list li')).toHaveLength(SKILL_SHELVES.reduce((n, s) => n + s.items.length, 0));
    expect([...el.querySelectorAll('.course h3')].map((h) => h.textContent)).toEqual(['Bacharelado em Engenharia de Software', 'Técnico em Desenvolvimento de Sistemas', 'Inglês intermediário']);
    expect(el.querySelector('.course-inst')?.textContent).toContain('fev 2024 — abr 2028 (previsão)');
  });

  it('contato: copia o e-mail e lista os perfis', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const { fixture, el } = await render();
    expect(el.querySelector('#email')?.getAttribute('href')).toBe('mailto:' + EMAIL);
    await click(fixture, el.querySelector('#copy-email'));
    await fixture.whenStable();
    expect(writeText).toHaveBeenCalledWith(EMAIL);
    expect(el.querySelector('#copy-email')?.textContent).toContain('Copiado');
    expect(el.querySelector('#copy-msg')?.textContent).toBe('E-mail copiado.');
    expect([...el.querySelectorAll<HTMLAnchorElement>('.link-row')].map((a) => a.href)).toEqual(CONTACTS.map((c) => c.href));
  });
});
