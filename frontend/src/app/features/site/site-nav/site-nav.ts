import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

/** uma entrada da navegação: o id da seção e o rótulo; `mobile` só aparece no menu do celular */
interface NavLink { id: string; label: string; mobile?: boolean }

// A barra do topo: marca, as seções (com a atual destacada) e o atalho para o contato.
// No celular as seções ficam num menu. O alto-falante da abertura se encaixa no canto direito (via CSS).
@Component({
  selector: 'nav[appSiteNav]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'nav', 'aria-label': 'Navegação principal', '[class.scrolled]': 'scrolled()', '(keydown.escape)': 'close()' },
  template: `
    <div class="nav-in">
      <a class="brand" href="#procurado" (click)="close()">
        <svg viewBox="0 0 9 9" shape-rendering="crispEdges" aria-hidden="true"><rect x="4" y="0" width="1" height="2" fill="#f0904c"/><rect x="3" y="2" width="3" height="2" fill="#f0904c"/><rect x="0" y="3" width="9" height="2" fill="#f0904c"/><rect x="2" y="5" width="5" height="2" fill="#f0904c"/><rect x="1" y="7" width="2" height="2" fill="#f0904c"/><rect x="6" y="7" width="2" height="2" fill="#f0904c"/><rect x="4" y="4" width="1" height="1" fill="#1c0f07"/></svg>
        <span class="brand-name">João Pedro</span>
        <span class="brand-role">FullStack · .NET</span>
      </a>
      <ul class="nav-links" id="nav-links" [class.open]="open()">
        @for (l of links; track l.id) {
          <li [class.only-mobile]="l.mobile"><a [href]="'#' + l.id" [class.on]="active() === l.id" [attr.aria-current]="active() === l.id ? 'location' : null" (click)="close()">{{ l.label }}</a></li>
        }
      </ul>
      <a class="s-btn nav-cta" href="#saloon">Contato</a>
      <button type="button" class="nav-menu" aria-controls="nav-links" [attr.aria-expanded]="open()" [attr.aria-label]="open() ? 'Fechar o menu' : 'Abrir o menu'" (click)="open.update((v) => !v)">
        <span aria-hidden="true"></span>
      </button>
    </div>
  `,
})
export class SiteNav {
  protected readonly links: NavLink[] = [
    { id: 'procurado', label: 'Sobre' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'trabalhos', label: 'Experiência' },
    { id: 'skills', label: 'Skills' },
    { id: 'commits', label: 'GitHub' },
    { id: 'formacao', label: 'Formação' },
    { id: 'duelo', label: 'Duelo' },
    { id: 'saloon', label: 'Contato', mobile: true },
  ];
  protected readonly active = signal('');
  protected readonly open = signal(false);
  protected readonly scrolled = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // a seção atual é a que cruza o meio da tela
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) this.active.set(e.target.id);
      }, { rootMargin: '-45% 0px -50% 0px' });
      this.links.forEach((l) => { const el = document.getElementById(l.id); if (el) io.observe(el); });
      // em cima da cena do portão a barra fica transparente; depois ganha fundo
      const onScroll = () => this.scrolled.set(window.scrollY > 24);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => { io.disconnect(); window.removeEventListener('scroll', onScroll); });
    });
  }

  protected close(): void { this.open.set(false); }
}
