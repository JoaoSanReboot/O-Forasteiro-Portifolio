import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { PROJECTS } from '../../content/projects';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

/** onde cada baú está no palco: no meio, num dos cantos ou guardado (quando há mais de três) */
export type BauPos = 'meio' | 'esq' | 'dir' | 'fora';

/** posição do baú `i` quando o baú `atual` está no meio de `n` baús (a fila dá a volta) */
export function posDoBau(i: number, atual: number, n: number): BauPos {
  const d = (((i - atual) % n) + n) % n;
  return d === 0 ? 'meio' : d === 1 ? 'dir' : d === n - 1 ? 'esq' : 'fora';
}

// as moedas e estrelas que pulam do baú quando ele abre: [deslocamento x, altura, giro, atraso] (em px, graus e s)
const PULOS: readonly (readonly [number, number, number, number])[] = [
  [-120, -170, -220, 0], [-70, -230, 160, 0.05], [-20, -260, -90, 0.02], [30, -245, 200, 0.08],
  [85, -200, -160, 0.03], [130, -150, 120, 0.06], [-150, -110, 260, 0.1], [160, -100, -240, 0.12],
  [-45, -190, 80, 0.14], [60, -280, -60, 0.16],
];

// 02 · Projetos: três baús do velho oeste. Um fica no meio e os outros dois nos cantos; as flechinhas
// (ou as setas do teclado) giram a fila. Clicando no baú do meio, ele treme, a tampa pula, sai moeda
// e estrela, e o cartaz do projeto sobe de dentro dele. Sem JavaScript, os cartazes ficam todos à mostra.
@Component({
  selector: 'section[appProjetos]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal],
  host: { class: 'sec projetos', id: 'projetos', 'aria-labelledby': 't-projetos' },
  template: `
    <div class="wrap">
      <header appSectionHead num="02" label="Projetos" title="Forjados na" accent="bigorna." [aside]="count" emblem="bigorna" titleId="t-projetos"></header>

      <div class="baus" appReveal [class.aberto]="aberto()" (keydown)="tecla($event)">
        <div class="baus-palco">
          <p class="baus-dica" aria-hidden="true">Clique no baú para abrir</p>
          <button type="button" class="bau-seta esq" (click)="girar(-1)" [disabled]="aberto()" aria-label="Baú anterior">
            <svg viewBox="0 0 64 24" aria-hidden="true"><path d="M60 12 H10" /><path d="M16 4 L4 12 L16 20 Z" class="cheia" /><path d="M60 12 L52 4 M60 12 L52 20 M54 12 L46 4 M54 12 L46 20" /></svg>
          </button>

          @for (p of projects; track p.name; let i = $index) {
            @let pos = posicoes()[i];
            <button type="button" class="bau" [attr.data-pos]="pos" (click)="clicar(i)"
              [attr.tabindex]="pos === 'meio' ? 0 : -1"
              [attr.aria-hidden]="pos === 'meio' ? null : 'true'"
              [attr.aria-expanded]="pos === 'meio' ? aberto() : null"
              [attr.aria-controls]="'carta-' + i"
              [attr.aria-label]="'Abrir o baú ' + p.num + ': ' + p.name">
              <span class="bau-luz" aria-hidden="true"></span>
              <svg class="bau-svg" viewBox="0 0 200 170" aria-hidden="true">
                <ellipse class="bau-sombra" cx="100" cy="160" rx="88" ry="8" />
                <g class="bau-corpo">
                  <rect class="bau-madeira" x="20" y="78" width="160" height="78" rx="6" />
                  <path class="bau-tabua" d="M22 104 H178 M22 130 H178" />
                  <rect class="bau-ferro" x="38" y="78" width="14" height="78" />
                  <rect class="bau-ferro" x="148" y="78" width="14" height="78" />
                  <circle class="bau-prego" cx="45" cy="92" r="2.2" /><circle class="bau-prego" cx="45" cy="142" r="2.2" />
                  <circle class="bau-prego" cx="155" cy="92" r="2.2" /><circle class="bau-prego" cx="155" cy="142" r="2.2" />
                  <rect class="bau-borda" x="20" y="78" width="160" height="78" rx="6" />
                  <g class="bau-boca"><rect class="bau-escuro" x="22" y="77" width="156" height="13" rx="3" /><ellipse class="bau-ouro" cx="100" cy="81" rx="64" ry="5" /></g>
                </g>
                <g class="bau-tampa">
                  <path class="bau-madeira" d="M18 80 V58 Q18 26 100 26 Q182 26 182 58 V80 Z" />
                  <path class="bau-tabua" d="M20 60 H180" />
                  <path class="bau-ferro" d="M38 80 V36 Q38 32 45 31 L52 30.5 V80 Z" />
                  <path class="bau-ferro" d="M162 80 V36 Q162 32 155 31 L148 30.5 V80 Z" />
                  <path class="bau-borda" d="M18 80 V58 Q18 26 100 26 Q182 26 182 58 V80 Z" />
                </g>
                <g class="bau-tranca">
                  <rect class="bau-latao" x="86" y="68" width="28" height="32" rx="4" />
                  <path class="bau-buraco" d="M100 78 a4 4 0 1 1 -0.1 0 Z M98 84 H102 L103 92 H97 Z" />
                </g>
              </svg>
              <span class="bau-pulos" aria-hidden="true">
                @for (q of pulos; track $index; let k = $index) {
                  <i [class]="k % 3 === 2 ? 'estrela' : 'moeda'" [style.--dx.px]="q[0]" [style.--dy.px]="q[1]" [style.--gira.deg]="q[2]" [style.--atraso.s]="q[3]"></i>
                }
              </span>
              <span class="bau-placa" aria-hidden="true"><b>{{ p.num }}</b> {{ p.name }}</span>
            </button>
          }

          <button type="button" class="bau-seta dir" (click)="girar(1)" [disabled]="aberto()" aria-label="Próximo baú">
            <svg viewBox="0 0 64 24" aria-hidden="true"><path d="M4 12 H54" /><path d="M48 4 L60 12 L48 20 Z" class="cheia" /><path d="M4 12 L12 4 M4 12 L12 20 M10 12 L18 4 M10 12 L18 20" /></svg>
          </button>
          <p class="sr-only" aria-live="polite">Baú {{ projects[atual()].num }} no meio: {{ projects[atual()].name }}</p>
        </div>

        <div class="bau-cartas">
          @for (p of projects; track p.name; let i = $index) {
            @let on = aberto() && atual() === i;
            <article class="bau-carta" [class.on]="on" [id]="'carta-' + i" [attr.aria-labelledby]="'carta-t-' + i" [attr.inert]="pronto() && !on ? '' : null">
              <div class="carta-topo">
                <span class="carta-logo"><img [src]="p.img" [alt]="p.alt" loading="lazy"></span>
                <div>
                  <p class="carta-num">Achado nº {{ p.num }}</p>
                  <h3 class="carta-nome" [id]="'carta-t-' + i" tabindex="-1">{{ p.name }}</h3>
                  <p class="carta-titulo">{{ p.title }}@if (p.wip) { <i class="tag">Em desenvolvimento</i> }</p>
                </div>
              </div>
              <p class="carta-desc">{{ p.desc }}</p>
              <p class="carta-chips">{{ p.chips.join(' · ') }}</p>
              <div class="carta-acoes">
                <a class="carta-link" [href]="p.href" target="_blank" rel="noopener">{{ p.action }}<span aria-hidden="true"> ↗</span><span class="sr-only"> (abre em outra aba)</span></a>
                <button type="button" class="carta-fechar" (click)="fechar()">Fechar o baú</button>
              </div>
            </article>
          }
        </div>
      </div>
    </div>
  `,
})
export class Projetos {
  protected readonly projects = PROJECTS;
  protected readonly count = `${String(PROJECTS.length).padStart(2, '0')} baús`;
  protected readonly pulos = PULOS;
  protected readonly atual = signal(0);
  protected readonly aberto = signal(false);
  /** depois da hidratação: só então os cartazes fechados saem do alcance do teclado (sem JS, ficam todos) */
  protected readonly pronto = signal(false);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private foco: ReturnType<typeof setTimeout> | undefined;
  protected readonly posicoes = computed(() => PROJECTS.map((_, i) => posDoBau(i, this.atual(), PROJECTS.length)));

  constructor() {
    afterNextRender(() => this.pronto.set(true));
    inject(DestroyRef).onDestroy(() => clearTimeout(this.foco));
  }

  protected girar(passo: number): void {
    if (this.aberto()) return;
    const n = PROJECTS.length;
    this.atual.update((a) => (a + passo + n) % n);
  }

  protected clicar(i: number): void {
    if (this.aberto()) return;
    const pos = this.posicoes()[i];
    if (pos === 'meio') this.abrir();
    else if (pos === 'esq') this.girar(-1);
    else if (pos === 'dir') this.girar(1);
  }

  private abrir(): void {
    this.aberto.set(true);
    // o cartaz sobe por cima do que está acima do baú: se o topo dele for ficar fora da tela, a página desce até ele
    const raiz = this.el.nativeElement;
    const carta = raiz.querySelector<HTMLElement>(`#carta-${this.atual()}`), cartas = raiz.querySelector<HTMLElement>('.bau-cartas');
    if (carta && cartas) {
      const topo = cartas.getBoundingClientRect().bottom - carta.offsetHeight;
      if (topo < 24) window.scrollBy({ top: topo - 24, behavior: 'smooth' });
    }
    // o foco vai para o nome do projeto quando o cartaz termina de subir
    const reduz = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    clearTimeout(this.foco);
    this.foco = setTimeout(() => this.el.nativeElement.querySelector<HTMLElement>(`#carta-t-${this.atual()}`)?.focus({ preventScroll: true }), reduz ? 0 : 1100);
  }

  protected fechar(): void {
    if (!this.aberto()) return;
    clearTimeout(this.foco);
    this.aberto.set(false);
    this.el.nativeElement.querySelector<HTMLElement>('.bau[data-pos="meio"]')?.focus({ preventScroll: true });
  }

  protected tecla(e: KeyboardEvent): void {
    if (e.key === 'Escape') { this.fechar(); return; }
    if (this.aberto() || (e.target as HTMLElement).closest('.bau-carta')) return;
    if (e.key === 'ArrowLeft') { this.girar(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { this.girar(1); e.preventDefault(); }
  }
}
