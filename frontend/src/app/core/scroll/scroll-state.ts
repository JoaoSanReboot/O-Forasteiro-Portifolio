import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { raf } from '../../engine/core/browser';

// O que a rolagem da página conta para quem desenha em volta dela, lido uma vez por quadro:
//   --sy        quanto já rolou (px), para o parallax do topo
//   --progress  de 0 a 1, para a linha de leitura da barra
// e, em Signals, só o que muda pouco: saiu do topo e se a barra deve se esconder (rolando para baixo).
@Injectable({ providedIn: 'root' })
export class ScrollState {
  private readonly doc = inject(DOCUMENT);
  readonly scrolled = signal(false);
  readonly hidden = signal(false);

  private lastY = 0;
  private queued = false;

  /** começa a acompanhar (só no navegador); devolve como parar */
  start(): () => void {
    const win = this.doc.defaultView!;
    const onScroll = () => { if (!this.queued) { this.queued = true; raf(() => this.update(win)); } };
    this.update(win);
    win.addEventListener('scroll', onScroll, { passive: true });
    win.addEventListener('resize', onScroll, { passive: true });
    return () => { win.removeEventListener('scroll', onScroll); win.removeEventListener('resize', onScroll); };
  }

  private update(win: Window): void {
    this.queued = false;
    const root = this.doc.documentElement;
    const y = Math.max(0, win.scrollY), max = root.scrollHeight - win.innerHeight;
    root.style.setProperty('--sy', String(Math.round(y)));
    root.style.setProperty('--progress', max > 0 ? Math.min(1, y / max).toFixed(4) : '0');
    this.scrolled.set(y > 24);
    // a barra some rolando para baixo e volta ao menor gesto para cima (com uma folga contra tremidas)
    const dy = y - this.lastY;
    if (Math.abs(dy) > 6) { this.hidden.set(dy > 0 && y > win.innerHeight * 0.6); this.lastY = y; }
    if (y < 80) this.hidden.set(false);
  }
}
