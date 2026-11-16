import { DOCUMENT, inject, Injectable } from '@angular/core';
import { raf } from '../../engine/core/browser';

// O que a rolagem da página conta para quem desenha em volta dela, lido uma vez por quadro:
//   --sy  quanto já rolou (px), para o parallax do topo
@Injectable({ providedIn: 'root' })
export class ScrollState {
  private readonly doc = inject(DOCUMENT);
  private queued = false;

  /** começa a acompanhar (só no navegador); devolve como parar */
  start(): () => void {
    const win = this.doc.defaultView!;
    const onScroll = () => { if (!this.queued) { this.queued = true; raf(() => this.update(win)); } };
    this.update(win);
    win.addEventListener('scroll', onScroll, { passive: true });
    return () => win.removeEventListener('scroll', onScroll);
  }

  private update(win: Window): void {
    this.queued = false;
    this.doc.documentElement.style.setProperty('--sy', String(Math.round(Math.max(0, win.scrollY))));
  }
}
