import { inject, Injectable } from '@angular/core';
import { PlatformService } from './platform.service';

// as chaves do armazenamento do navegador
export const STORAGE_KEYS = {
  progress: 'vila-progresso',
  hero: 'vila-heroi',
  sound: 'vila-som',
  duelWins: 'vila-duelo-vitorias',
  /** sessionStorage: quem já chegou nesta visita pula a cavalgada */
  arrived: 'vila-chegou',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
type Area = 'local' | 'session';

// sem armazenamento (aba anônima, bloqueio, servidor no build): tudo vira "não lembra" em vez de erro
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = inject(PlatformService).isBrowser;

  get(key: StorageKey, area: Area = 'local'): string | null {
    try { return this.store(area)?.getItem(key) ?? null; } catch { return null; }
  }

  set(key: StorageKey, value: string, area: Area = 'local'): void {
    try { this.store(area)?.setItem(key, value); } catch { /* sem armazenamento: segue sem lembrar */ }
  }

  remove(key: StorageKey, area: Area = 'local'): void {
    try { this.store(area)?.removeItem(key); } catch { /* sem armazenamento */ }
  }

  getJson<T>(key: StorageKey, fallback: T, area: Area = 'local'): T {
    const raw = this.get(key, area);
    if (raw === null) return fallback;
    try { return (JSON.parse(raw) as T) ?? fallback; } catch { return fallback; }
  }

  setJson(key: StorageKey, value: unknown, area: Area = 'local'): void {
    this.set(key, JSON.stringify(value), area);
  }

  private store(area: Area): Storage | null {
    if (!this.isBrowser) return null;
    return area === 'local' ? window.localStorage : window.sessionStorage;
  }
}
