import { computed, inject, Injectable, signal } from '@angular/core';
import { COIN_FACTS } from '../../content/jogos';
import { PlatformService } from '../../core/platform/platform.service';

/** as moedas escondidas pelo site, uma por esconderijo */
export const COIN_IDS = ['horizonte', 'couro', 'candeeiro', 'prosa', 'rodape'] as const satisfies readonly (keyof typeof COIN_FACTS)[];
export type CoinId = (typeof COIN_IDS)[number];
const isCoinId = (v: unknown): v is CoinId => typeof v === 'string' && (COIN_IDS as readonly string[]).includes(v);

const KEY = 'forasteiro-moedas';

// A caça às moedas: cinco moedas de ouro escondidas pelas seções, cada uma com um causo do forasteiro
// cunhado nela. Com todas no bolso, o duelo ganha o revólver aprimorado (a faixa vermelha também vale). O progresso fica só neste navegador,
// e sem armazenamento (aba anônima, bloqueado) a caça vale até fechar a página.
@Injectable({ providedIn: 'root' })
export class SecretsService {
  private readonly platform = inject(PlatformService);
  private readonly found = signal<readonly CoinId[]>([]);
  private restored = false;

  readonly total = COIN_IDS.length;
  readonly count = computed(() => this.found().length);
  /** todas as moedas: o revólver aprimorado está liberado no duelo */
  readonly gun = computed(() => this.count() === this.total);
  /** a última notícia (moeda achada, revólver liberado), para o aviso na tela */
  readonly news = signal<{ text: string; n: number } | null>(null);

  has(id: CoinId): boolean { return this.found().includes(id); }

  /** lê o que já foi achado neste navegador; chamado depois da hidratação, para o HTML do servidor bater */
  restore(): void {
    if (this.restored) return;
    this.restored = true;
    const saved = this.read();
    if (saved.length) this.found.update((f) => [...new Set([...saved, ...f])]);
  }

  collect(id: CoinId): void {
    if (this.has(id)) return;
    this.found.update((f) => [...f, id]);
    this.write();
    const n = this.count();
    this.news.set({
      n: (this.news()?.n ?? 0) + 1,
      text: n === this.total
        ? `${COIN_FACTS[id]} Bolso cheio: o revólver aprimorado está liberado no duelo.`
        : `${n} de ${this.total} · ${COIN_FACTS[id]}`,
    });
  }

  /** esconde tudo de novo */
  reset(): void {
    this.found.set([]);
    this.write();
    this.news.set({ n: (this.news()?.n ?? 0) + 1, text: 'As moedas voltaram para os esconderijos. Boa caçada!' });
  }

  private read(): CoinId[] {
    if (!this.platform.isBrowser) return [];
    try {
      const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      return Array.isArray(v) ? [...new Set(v.filter(isCoinId))] : [];
    } catch { return []; }
  }

  private write(): void {
    if (!this.platform.isBrowser) return;
    try { localStorage.setItem(KEY, JSON.stringify(this.found())); } catch { /* sem armazenamento: vale até fechar */ }
  }
}
