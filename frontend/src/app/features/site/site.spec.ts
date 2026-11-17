import { TestBed } from '@angular/core/testing';
import { CONTACTS, EMAIL, JOBS } from '../../content/profile';
import { PROJECTS } from '../../content/projects';
import { SKILL_SHELVES } from '../../content/skills';
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
    expect(emblems).toEqual(['chapeu', 'bigorna', 'rastros', 'peixeiras', 'telegrafo', 'candeeiro', 'fogueira']);
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

  it('o topo mostra o nome e o cartaz enxuto, sem o rótulo "Portfólio · 2026" nem o local e a hora', async () => {
    const { el } = await render();
    expect(el.querySelector('#inicio')?.textContent).not.toContain('Portfólio');
    // nem o local e a hora no alto
    expect(el.querySelector('.hero-top, .hero-clock')).toBeNull();
    expect(el.querySelector('#inicio')?.textContent).not.toContain('São José dos Pinhais');
    expect(el.querySelector('.poster-name')).not.toBeNull();
    expect(el.querySelector('.poster-reward')?.textContent).toContain('um bom projeto');
    expect(el.querySelector('.poster-stamp, .poster-seen')).toBeNull();
  });

  it('o topo fica só com o nome, o título e o cartaz: sem o texto de apresentação e sem os dois botões', async () => {
    const { el } = await render();
    const hero = el.querySelector('#inicio')!;
    expect(hero.textContent).not.toContain('Do banco de dados à tela');
    expect(hero.querySelector('.hero-foot, .hero-lead, .hero-actions, .btn')).toBeNull();
    // só o título, sem o .NET e sem o fio com a estrela
    expect([...hero.querySelectorAll('.hero-role > span')].map((s) => s.textContent)).toEqual(['Desenvolvedor', 'FullStack']);
    expect(hero.querySelector('.role-net, .role-rule, .role-star')).toBeNull();
    // o cartaz em papel velho, pregado, e o feno de verdade rolando no chão
    // o nome e o título embaixo dele, no mesmo bloco (mesmo eixo à esquerda)
    expect(hero.querySelector('.hero-id > .hero-name + .hero-role')).not.toBeNull();
    expect(hero.querySelector('.poster .poster-nail')).not.toBeNull();
    expect(hero.querySelector('.poster-sheet .poster-sub')?.textContent).toBe('vivo e codando');
    expect(hero.querySelector('.poster-sheet .poster-head')?.textContent).toBe('Procura-se');
    expect(hero.querySelector('.vento .feno-rota svg.feno')).not.toBeNull();
    // o pistoleiro escorado no "O" de João (depois das letras, fora do leitor de tela) e os seis buracos de bala no cartaz
    const pist = hero.querySelector('.hn-line:first-child > .pistoleiro');
    expect(pist?.previousElementSibling?.classList).toContain('hn-txt');
    expect(pist?.getAttribute('aria-hidden')).toBe('true');
    expect(pist?.querySelector('.pist-roda .pist-cano')).not.toBeNull();
    expect(hero.querySelectorAll('.poster-sheet .poster-furo').length).toBe(6);
    expect(hero.querySelector('.capim')).toBeNull();
  });

  it('o Sobre vem logo depois do topo, só com a frase inteira: sem a travessia, sem a ficha e sem os números', async () => {
    const { el } = await render();
    expect(el.querySelector('#travessia, .travessia')).toBeNull();
    const sobre = el.querySelector('#sobre')!;
    expect(sobre.previousElementSibling?.id).toBe('inicio');
    expect(sobre.querySelector('.sobre-card, .stats, .stat')).toBeNull();
    expect(sobre.textContent).not.toContain('Em poucas palavras');
    expect(sobre.textContent).not.toContain('60 s → 4 s');
    // "Olá, forasteiro!" e a apresentação inteira, em parágrafos, fechando com a saudação
    expect(sobre.querySelector('.sh-title')?.textContent?.replace(/\s+/g, '')).toBe('Olá,forasteiro!');
    const pars = [...sobre.querySelectorAll('.sobre-texto > p')].map((p) => p.textContent?.replace(/\s+/g, ' ').trim());
    expect(pars).toEqual([
      'Sou Desenvolvedor FullStack, com experiência em diferentes etapas do desenvolvimento, desde a modelagem e arquitetura até a implementação e entrega de soluções.',
      'Movido a café, linhas de código e uma boa dose de criatividade. Sou apaixonado pelo universo do faroeste, algo que talvez você já tenha percebido por aqui.',
      'Fique à vontade para explorar meus projetos, conhecer um pouco do meu trabalho e aproveitar sua estadia por estas terras.',
      'Seja bem-vindo ao Oeste!',
    ]);
    // nada de acender aos poucos e nada de firula: sem estilo de rolagem e sem itálico ou destaque no meio
    expect(sobre.querySelector('.sobre-texto [style]')).toBeNull();
    expect(sobre.querySelector('.sobre-texto :is(em, strong, b, i, span)')).toBeNull();
    // o vaqueiro do cumprimento: tronco, braço e o chapéu de cangaceiro na mão
    expect(sobre.querySelector('.sh-emblem[data-em="chapeu"] .e-tronco .e-braco .e-hat')).not.toBeNull();
  });

  it('projetos: a bigorna forjando no título, sem o ferro de marcar e sem a estrela gigante', async () => {
    const { el } = await render();
    const em = el.querySelector('#projetos')!.querySelector('.sh-emblem')!;
    expect(em.getAttribute('data-em')).toBe('bigorna');
    expect(em.querySelector('.e-martelo')).not.toBeNull();
    expect(em.querySelector('.e-peca')).not.toBeNull();
    expect(em.querySelectorAll('.e-faiscas circle').length).toBeGreaterThan(3);
    expect(el.querySelector('.e-brand, [data-em="ferro"]')).toBeNull();
  });

  it('projetos: um baú por projeto, e cada cartaz leva ao projeto em outra aba', async () => {
    const { el } = await render();
    expect(el.querySelectorAll('#projetos .bau')).toHaveLength(PROJECTS.length);
    expect([...el.querySelectorAll('.carta-nome')].map((h) => h.textContent)).toEqual(PROJECTS.map((p) => p.name));
    const links = [...el.querySelectorAll<HTMLAnchorElement>('.carta-link')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(PROJECTS.map((p) => p.href));
    expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener' && a.textContent?.includes('(abre em outra aba)'))).toBe(true);
    expect(el.querySelector('.bau-carta .tag')?.textContent).toBe('Em desenvolvimento');
    // a lista antiga e a imagem que seguia o mouse saíram
    expect(el.querySelector('.works, .work-preview')).toBeNull();
  });

  it('projetos: as flechinhas giram a fila e o baú do meio abre o cartaz do seu projeto', async () => {
    const { fixture, el } = await render();
    const pos = () => [...el.querySelectorAll('.bau')].map((b) => b.getAttribute('data-pos'));
    expect(pos()).toEqual(['meio', 'dir', 'esq']);
    await click(fixture, el.querySelector('.bau-seta.dir'));
    expect(pos()).toEqual(['esq', 'meio', 'dir']);
    await click(fixture, el.querySelector('.bau-seta.esq'));
    await click(fixture, el.querySelector('.bau-seta.esq'));
    expect(pos()).toEqual(['dir', 'esq', 'meio']);
    // clicar no baú do canto traz ele para o meio, sem abrir
    await click(fixture, el.querySelector('.bau[data-pos="dir"]'));
    expect(pos()).toEqual(['meio', 'dir', 'esq']);
    expect(el.querySelector('.baus.aberto')).toBeNull();

    const meio = el.querySelector<HTMLElement>('.bau[data-pos="meio"]')!;
    expect(meio.getAttribute('aria-expanded')).toBe('false');
    await click(fixture, meio);
    const baus = el.querySelector<HTMLElement>('.baus.aberto');
    expect(baus).not.toBeNull();
    expect(meio.getAttribute('aria-expanded')).toBe('true');
    // o palco abre espaço em cima para o cartaz não cobrir o título
    expect(parseFloat(baus!.style.paddingTop)).toBeGreaterThan(0);
    const abertas = el.querySelectorAll('.bau-carta.on');
    expect(abertas).toHaveLength(1);
    expect(abertas[0].querySelector('.carta-nome')?.textContent).toBe(PROJECTS[0].name);
    // os outros cartazes ficam fora do alcance do teclado e as flechinhas travam enquanto está aberto
    expect(el.querySelectorAll('.bau-carta[inert]')).toHaveLength(PROJECTS.length - 1);
    expect(el.querySelector<HTMLButtonElement>('.bau-seta.dir')!.disabled).toBe(true);

    await click(fixture, abertas[0].querySelector('.carta-fechar'));
    expect(el.querySelector('.baus.aberto, .bau-carta.on')).toBeNull();
    expect(parseFloat(el.querySelector<HTMLElement>('.baus')!.style.paddingTop || '0')).toBe(0);
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
