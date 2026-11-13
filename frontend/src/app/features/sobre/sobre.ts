import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { PROFILE, STATEMENT, STATS } from '../../content/profile';
import { PlatformService } from '../../core/platform/platform.service';
import { raf } from '../../engine/core/browser';
import { clamp } from '../../engine/core/math';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

interface Word { parts: { t: string; em: boolean }[] }

/** quebra a frase em palavras; *trechos* (mesmo os que atravessam palavras) viram itálico */
export function words(text: string): Word[] {
  let em = false;
  return text.split(' ').map((w) => {
    const parts: Word['parts'] = [];
    let buf = '';
    for (const c of w) {
      if (c === '*') { if (buf) parts.push({ t: buf, em }); buf = ''; em = !em; } else buf += c;
    }
    if (buf) parts.push({ t: buf, em });
    return { parts };
  });
}

// 01 · Sobre: a frase grande acende palavra por palavra enquanto passa pela tela (o CSS lê --p de 0 a 1),
// e embaixo os números do que já foi entregue.
@Component({
  selector: 'section[appSobre]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal],
  host: { class: 'sec sobre', id: 'sobre', 'aria-labelledby': 't-sobre' },
  template: `
    <div class="wrap">
      <header appSectionHead num="01" label="Sobre" title="Prazer," accent="forasteiro." emblem="chapeu" titleId="t-sobre"></header>
      <div class="sobre-grid">
        <aside class="sobre-card" appReveal>
          <p class="sc-label">Em poucas palavras</p>
          <dl>
            <div><dt>Ofício</dt><dd>{{ p.role }} · {{ p.stack }}</dd></div>
            <div><dt>Base</dt><dd>{{ p.location }}</dd></div>
            <div><dt>Estudo</dt><dd>Engenharia de Software · Unicesumar</dd></div>
          </dl>
        </aside>
        <p class="statement" #statement [style.--n]="list.length">
          @for (w of list; track $index) {
            <span class="w" [style.--i]="$index">@for (part of w.parts; track $index) {@if (part.em) {<em>{{ part.t }}</em>} @else {{{ part.t }}}}</span>{{ ' ' }}
          }
        </p>
      </div>
      <ul class="stats" aria-label="Resultados entregues">
        @for (s of stats; track s.value; let i = $index) {
          <li class="stat" appReveal [revealDelay]="i"><b>{{ s.value }}</b><span>{{ s.label }}</span></li>
        }
      </ul>
    </div>
  `,
})
export class Sobre {
  protected readonly p = PROFILE;
  protected readonly stats = STATS;
  protected readonly list = words(STATEMENT);
  private readonly statement = viewChild.required<ElementRef<HTMLElement>>('statement');

  constructor() {
    const destroyRef = inject(DestroyRef), platform = inject(PlatformService);
    afterNextRender(() => {
      if (platform.reduceMotion) return;
      const el = this.statement().nativeElement;
      let queued = false, visible = false;
      // a frase começa a acender quando entra por baixo e termina antes de chegar ao topo
      const update = () => {
        queued = false;
        const r = el.getBoundingClientRect(), vh = window.innerHeight;
        el.style.setProperty('--p', clamp((vh * 0.88 - r.top) / (r.height + vh * 0.3)).toFixed(3));
      };
      const onScroll = () => { if (visible && !queued) { queued = true; raf(update); } };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; onScroll(); });
      io.observe(el);
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => { io.disconnect(); window.removeEventListener('scroll', onScroll); });
    });
  }
}
