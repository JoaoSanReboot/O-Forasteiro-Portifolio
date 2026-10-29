import { DOCUMENT, inject, Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from './storage.service';

// abertura → site: quem já chegou nesta visita vai direto para o mural; "Rever a chegada" volta para a tela inicial
@Injectable({ providedIn: 'root' })
export class IntroService {
  private readonly storage = inject(StorageService);
  private readonly doc = inject(DOCUMENT);
  /** o site está aberto (põe `site-on` no `<html>`) */
  readonly siteOn = signal(false);
  /** cada entrada no site (o `vila:enter`), com `quick` quando foi direto, sem cavalgada */
  readonly entered = signal<{ n: number; quick: boolean }>({ n: 0, quick: false });
  /** cada "Rever a chegada" (o `vila:replay`) */
  readonly replays = signal(0);

  get arrivedBefore(): boolean { return this.storage.get(STORAGE_KEYS.arrived, 'session') === '1'; }

  enter(quick = false): void {
    if (this.siteOn()) return;
    this.storage.set(STORAGE_KEYS.arrived, '1', 'session');
    this.doc.documentElement.classList.add('site-on');
    this.siteOn.set(true);
    this.entered.update((e) => ({ n: e.n + 1, quick }));
  }

  replay(): void {
    this.doc.defaultView?.scrollTo(0, 0);
    this.doc.documentElement.classList.remove('site-on');
    this.siteOn.set(false);
    this.replays.update((n) => n + 1);
  }
}
