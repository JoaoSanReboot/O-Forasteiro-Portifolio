import { DOCUMENT, inject, Injectable, signal } from '@angular/core';

// Abertura → site. A página sempre abre na abertura; "Rever a abertura" (no rodapé) a traz de volta.
// No <html>: `intro-on` trava a rolagem enquanto ela está na tela; `ready` solta a entrada do topo do site.
@Injectable({ providedIn: 'root' })
export class IntroService {
  private readonly doc = inject(DOCUMENT);
  /** a abertura está montada (some de vez depois que a cortina sobe) */
  readonly showing = signal(true);
  /** a cortina já começou a subir: o site pode animar o topo e rolar */
  readonly done = signal(false);

  /** a abertura começou: trava a rolagem embaixo dela */
  begin(): void {
    this.doc.documentElement.classList.add('intro-on');
  }

  /** a cortina sobe e o site entra */
  finish(): void {
    if (this.done()) return;
    const root = this.doc.documentElement;
    root.classList.remove('intro-on');
    root.classList.add('ready');
    this.done.set(true);
  }

  /** a cortina terminou de subir */
  hide(): void {
    this.showing.set(false);
  }

  replay(): void {
    this.doc.defaultView?.scrollTo(0, 0);
    this.doc.documentElement.classList.remove('ready');
    this.done.set(false);
    this.showing.set(true);
  }
}
