import { Injectable, signal } from '@angular/core';

export interface GuideAction { label: string; cls: 's-btn' | 'link-btn'; run: () => void }
export interface GuideSpeech { text: string; html?: boolean; actions: GuideAction[] }

// ================= Xerife: o guia da vila =================
// quem fala com o visitante: dicas de cada área, avisos dos segredos e confirmações
@Injectable({ providedIn: 'root' })
export class GuideService {
  /** a fala no balão; null com o balão fechado */
  readonly speech = signal<GuideSpeech | null>(null);

  hide(): void { this.speech.set(null); }

  say(line: string): void {
    this.speech.set({ text: line, actions: [{ label: 'OK', cls: 's-btn', run: () => this.hide() }] });
  }

  ask(line: string, yes: string, fn: () => void): void {
    this.speech.set({ text: line, actions: [
      { label: yes, cls: 's-btn', run: () => { this.hide(); fn(); } },
      { label: 'Não', cls: 'link-btn', run: () => this.hide() },
    ] });
  }

  greet(): void {
    this.speech.set({ text: 'Olá, seja bem-vindo ao vilarejo!<br><br>O que precisar, é só clicar em mim que eu te ajudo!', html: true,
      actions: [{ label: 'OK', cls: 's-btn', run: () => this.hide() }] });
  }
}
