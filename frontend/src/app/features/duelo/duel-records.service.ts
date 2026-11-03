import { inject, Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from '../../core/storage/storage.service';
import { LEVEL_IDS, LEVELS, LevelId } from './rules/levels';

// Os recordes do duelo: vitórias por dificuldade, lembradas no navegador (vila-duelo-vitorias)
@Injectable({ providedIn: 'root' })
export class DuelRecordsService {
  private readonly storage = inject(StorageService);
  private readonly wins: Partial<Record<LevelId, number>> = this.storage.getJson(STORAGE_KEYS.duelWins, {});

  /** "Vitórias: Normal 2× · Difícil 1×", ou vazio enquanto ninguém venceu */
  readonly summary = signal(this.describe());

  addWin(level: LevelId): void {
    this.wins[level] = (this.wins[level] || 0) + 1;
    this.storage.setJson(STORAGE_KEYS.duelWins, this.wins);
    this.summary.set(this.describe());
  }

  private describe(): string {
    const parts = LEVEL_IDS.filter((k) => this.wins[k]).map((k) => `${LEVELS[k].name} ${this.wins[k]}×`);
    return parts.length ? `Vitórias: ${parts.join(' · ')}` : '';
  }
}
