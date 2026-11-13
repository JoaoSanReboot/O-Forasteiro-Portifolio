import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ScrollState } from '../../../core/scroll/scroll-state';
import { Estrela } from '../../../shared/ornaments/ornaments';
import { SecretsService } from '../../secrets/secrets.service';

/** uma entrada da navegação: o id da seção e o rótulo; `mobile` só aparece no menu do celular */
interface NavLink { id: string; label: string; mobile?: boolean }

// A barra do topo: a estrela e o nome, as seções numeradas (com a atual marcada) e o atalho para o contato.
// Some rolando para baixo e volta ao rolar para cima; a linha de baixo é o progresso da leitura.
// No celular as seções viram um menu de tela cheia, com os links grandes.
@Component({
  selector: 'nav[appSiteNav]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Estrela],
  host: {
    class: 'nav', 'aria-label': 'Navegação principal',
    '[class.scrolled]': 'scroll.scrolled()', '[class.away]': 'scroll.hidden() && !open()', '[class.menu-open]': 'open()',
    '(keydown.escape)': 'close()',
  },
  template: `
    <div class="nav-in">
      <a class="brand" href="#inicio" (click)="close()">
        <svg appEstrela class="brand-star"></svg>
        <span class="brand-name">João Pedro</span>
        <span class="brand-role">FullStack · .NET</span>
      </a>
      <ul class="nav-links" id="nav-links" [class.open]="open()">
        @for (l of links; track l.id; let i = $index) {
          <li [class.only-mobile]="l.mobile">
            <a [href]="'#' + l.id" [class.on]="active() === l.id" [attr.aria-current]="active() === l.id ? 'location' : null" (click)="close()" [style.--i]="i">
              <span class="nl-num" aria-hidden="true">{{ i + 1 < 10 ? '0' + (i + 1) : i + 1 }}</span>{{ l.label }}
            </a>
          </li>
        }
      </ul>
      @if (secrets.count() > 0) {
        <a class="nav-purse" href="#duelo" [attr.aria-label]="'Moedas achadas: ' + secrets.count() + ' de ' + secrets.total + '. Ir para o duelo'">
          <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18" class="coin-edge" /><circle cx="20" cy="20" r="14.5" class="coin-face" /></svg>
          {{ secrets.count() }}/{{ secrets.total }}
        </a>
      }
      <a class="btn btn-sm nav-cta" href="#contato">Contato <span class="btn-arrow" aria-hidden="true">→</span></a>
      <button type="button" class="nav-menu" aria-controls="nav-links" [attr.aria-expanded]="open()" (click)="open.update((v) => !v)">
        <span class="nav-menu-t">{{ open() ? 'Fechar' : 'Menu' }}</span><span class="nav-menu-i" aria-hidden="true"></span>
      </button>
    </div>
    <span class="nav-progress" aria-hidden="true"></span>
  `,
})
export class SiteNav {
  protected readonly scroll = inject(ScrollState);
  protected readonly secrets = inject(SecretsService);
  protected readonly links: NavLink[] = [
    { id: 'sobre', label: 'Sobre' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'experiencia', label: 'Experiência' },
    { id: 'skills', label: 'Skills' },
    { id: 'github', label: 'GitHub' },
    { id: 'formacao', label: 'Formação' },
    { id: 'contato', label: 'Contato', mobile: true },
  ];
  protected readonly active = signal('');
  protected readonly open = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // a seção atual é a que cruza o meio da tela
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) if (e.isIntersecting) this.active.set(e.target.id);
      }, { rootMargin: '-45% 0px -50% 0px' });
      this.links.forEach((l) => { const el = document.getElementById(l.id); if (el) io.observe(el); });
      destroyRef.onDestroy(() => io.disconnect());
    });
  }

  protected close(): void { this.open.set(false); }
}
