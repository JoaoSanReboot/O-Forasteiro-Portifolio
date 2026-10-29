import { computed, inject, Injectable, signal } from '@angular/core';
import { Hero, HERO_BY_ID, HeroId, isHeroId } from '../engine/heroes/heroes';
import { STORAGE_KEYS, StorageService } from './storage.service';

// o personagem escolhido na tela inicial: segue na cavalgada e no duelo, e fica lembrado no navegador
@Injectable({ providedIn: 'root' })
export class HeroService {
  private readonly storage = inject(StorageService);
  readonly id = signal<HeroId>(this.read());
  readonly hero = computed<Hero>(() => HERO_BY_ID[this.id()]);

  /** o objeto comum que as cenas leem a cada quadro */
  current = (): Hero => HERO_BY_ID[this.id()];

  choose(id: HeroId): void {
    this.id.set(id);
    this.storage.set(STORAGE_KEYS.hero, id);
  }

  private read(): HeroId {
    const v = this.storage.get(STORAGE_KEYS.hero);
    return isHeroId(v) ? v : 'pistoleiro';
  }
}
