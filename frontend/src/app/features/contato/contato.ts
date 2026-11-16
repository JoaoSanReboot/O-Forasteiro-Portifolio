import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { CONTACTS, EMAIL } from '../../content/profile';
import { Bandeirinhas } from '../../shared/ornaments/bandeirinhas';
import { Ceu } from '../../shared/ornaments/ceu';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';
import { Coin } from '../secrets/coin';

// 07 · Contato: noite de prosa no terreiro, com as bandeirinhas balançando e o céu do sertão por cima.
// O convite enorme, o e-mail com o botão de copiar e os perfis em linhas grandes.
@Component({
  selector: 'section[appContato]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal, Coin, Ceu, Bandeirinhas],
  host: { class: 'sec sec-night contato', id: 'contato', 'aria-labelledby': 't-contato' },
  template: `
    <svg appCeu class="contato-ceu"></svg>
    <svg appBandeirinhas class="contato-flags"></svg>
    <div class="wrap">
      <header appSectionHead num="07" label="Contato" title="Bora" accent="prosear?" emblem="fogueira" titleId="t-contato"></header>
      <div class="contact">
        <app-coin coin="prosa" class="coin-prosa" />
        <p class="contact-lead" appReveal>Puxa uma cadeira, forasteiro. Vaga, projeto, ideia ou só um café: cada conversa pode abrir novos caminhos.</p>
        <div class="mail" appReveal [revealDelay]="1">
          <a class="mail-link" [href]="'mailto:' + email" id="email">{{ user }}&#64;<wbr>{{ domain }}</a>
          <button type="button" class="btn" id="copy-email" (click)="copy()">{{ copied() ? 'Copiado' : 'Copiar e-mail' }}<span class="btn-arrow" aria-hidden="true">{{ copied() ? '✓' : '⧉' }}</span></button>
          <p id="copy-msg" class="sr-only" aria-live="polite">{{ msg() }}</p>
        </div>
        <ul class="links">
          @for (c of contacts; track c.label; let i = $index) {
            <li appReveal [revealDelay]="i + 2">
              <a class="link-row" [href]="c.href" target="_blank" rel="noopener">
                <span class="lr-label">{{ c.label }}</span>
                <span class="lr-handle">{{ c.handle }}</span>
                <span class="lr-arrow" aria-hidden="true">↗</span>
                <span class="sr-only"> (abre em outra aba)</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class Contato {
  protected readonly email = EMAIL;
  /** o e-mail quebra depois do @ quando não cabe na linha */
  protected readonly user = EMAIL.split('@')[0];
  protected readonly domain = EMAIL.split('@')[1];
  protected readonly contacts = CONTACTS;
  protected readonly copied = signal(false);
  protected readonly msg = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => { if (this.timer) clearTimeout(this.timer); });
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.email);
      this.copied.set(true);
      this.msg.set('E-mail copiado.');
    } catch {
      this.msg.set(`Não deu para copiar: o e-mail é ${this.email}.`);
    }
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 2400);
  }
}
