import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { SecretsService } from './secrets.service';

// O aviso que sobe no canto da tela quando uma moeda é achada (e quando o revólver é liberado).
// Mostra o causo cunhado na moeda, fica uns segundos e some; o leitor de tela ouve pelo aria-live.
@Component({
  selector: 'app-coin-news',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'coin-news', '[class.on]': 'text() !== ""', role: 'status', 'aria-live': 'polite' },
  template: `
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18" class="coin-edge" /><circle cx="20" cy="20" r="14.5" class="coin-face" /></svg>
    <span>{{ text() }}</span>
  `,
})
export class CoinNews {
  protected readonly text = signal('');
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const secrets = inject(SecretsService);
    effect(() => {
      const news = secrets.news();
      if (!news) return;
      this.text.set(news.text);
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.text.set(''), 5200);
    });
    inject(DestroyRef).onDestroy(() => { if (this.timer) clearTimeout(this.timer); });
  }
}
