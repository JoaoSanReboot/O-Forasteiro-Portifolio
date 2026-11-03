import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Ctx } from '../../engine/core/canvas';
import { Pt } from '../../engine/draw/primitives';
import { CoinId, COIN_IDS, drawCoin, drawGunForSale, GUN_PRICE, isCoinId, nearCoin, onGun, SECRETS_TOTAL } from '../../engine/secrets/coins';
import { DuelService } from '../duelo/duel.service';
import { GuideService } from '../guide/guide.service';
import { HeroService } from '../heroes/hero.service';
import { SceneLoopService } from '../../core/scene/scene-loop.service';
import { STORAGE_KEYS, StorageService } from '../../core/storage/storage.service';
import { SECRETS_LINES as LINES } from './secrets-lines';

export interface Progress { coins: CoinId[]; gun: boolean; piano: boolean; hero?: string | null }

// as moedas, o revólver do Xavier e o segredo do Saloon; o progresso fica no navegador (vila-progresso)
@Injectable({ providedIn: 'root' })
export class SecretsService {
  private readonly storage = inject(StorageService);
  private readonly guide = inject(GuideService);
  private readonly heroes = inject(HeroService);
  private readonly duel = inject(DuelService).state;
  private readonly loop = inject(SceneLoopService);

  /** o objeto comum que as cenas consultam a cada quadro */
  readonly progress: Progress = { coins: [], gun: false, piano: false };
  /** quantos segredos foram achados (para o contador) */
  readonly found = signal(0);
  readonly total = SECRETS_TOTAL;
  readonly done = computed(() => this.found() === SECRETS_TOTAL);
  /** cada segredo novo: o contador dá um pulinho */
  readonly got = signal(0);

  constructor() {
    this.absorb(this.readLocal());
    this.sync();
    // trocar de personagem também fica salvo, e as cenas paradas se redesenham com ele
    effect(() => { this.heroes.id(); untracked(() => { this.save(); this.loop.invalidate(); }); });
  }

  hasGun = (): boolean => this.progress.gun;
  private coinCount = () => this.progress.coins.length;
  private allCoins = () => this.coinCount() === COIN_IDS.length;

  private readLocal(): Partial<Progress> | null {
    return this.storage.getJson<Partial<Progress> | null>(STORAGE_KEYS.progress, null);
  }

  private absorb(p: Partial<Progress> | null): void {
    if (!p) return;
    const coins = new Set(this.progress.coins);
    (Array.isArray(p.coins) ? p.coins : []).forEach((id) => { if (typeof id === 'string' && isCoinId(id)) coins.add(id); });
    this.progress.coins = [...coins];
    this.progress.gun = this.progress.gun || p.gun === true;
    this.progress.piano = this.progress.piano || p.piano === true;
    if (p.hero && !this.progress.hero) this.progress.hero = p.hero;
  }

  private save(): void {
    this.progress.hero = this.heroes.id();
    const { coins, gun, piano, hero } = this.progress;
    this.storage.setJson(STORAGE_KEYS.progress, { coins: coins.slice(), gun, piano, hero: hero || null });
  }

  private sync(): void {
    this.found.set(this.coinCount() + (this.progress.gun ? 1 : 0) + (this.progress.piano ? 1 : 0));
  }

  private gain(): void { this.save(); this.sync(); this.got.update((n) => n + 1); }

  // o contador não dá dicas: quem fala é o xerife
  talk(): void {
    if (this.done()) this.guide.say(LINES.allFound);
    else if (this.allCoins() && !this.progress.gun) this.guide.say(LINES.fullPockets);
    else this.guide.say(LINES.keepLooking);
  }

  private coinOn(id: string): id is CoinId {
    return isCoinId(id) && !this.progress.coins.includes(id) && !(id === 'fimdarua' && this.duel.on);
  }

  /** o que vai por cima da cena: a moeda dela, se ainda não foi achada, e o revólver à venda no armeiro */
  overlay(id: string): (g: Ctx, t: number) => void {
    return (g, t) => {
      if (this.coinOn(id)) drawCoin(g, id, t);
      if (id === 'armeiro' && !this.progress.gun) drawGunForSale(g, t);
    };
  }

  /** o ponteiro está sobre algo clicável (para o cursor de mãozinha) */
  hover(id: string, at: Pt): boolean {
    return (this.coinOn(id) && nearCoin(id, at)) || (id === 'armeiro' && !this.progress.gun && onGun(at));
  }

  /** um toque na cena: pega a moeda ou tenta comprar o revólver; devolve se usou o toque */
  tap(id: string, at: Pt): boolean {
    if (id === 'armeiro' && !this.progress.gun && onGun(at)) { this.buyGun(); return true; }
    if (!this.coinOn(id) || !nearCoin(id, at)) return false;
    this.progress.coins.push(id);
    this.gain(); this.loop.invalidate(id);
    if (this.allCoins() && !this.progress.gun) this.guide.say(LINES.fullPockets);
    return true;
  }

  private buyGun(): void {
    if (!this.allCoins()) {
      this.guide.say(LINES.gunPrice(GUN_PRICE, GUN_PRICE - this.coinCount()));
      return;
    }
    this.progress.gun = true; this.gain(); this.loop.invalidate('armeiro');
    this.guide.say(LINES.gunBought);
  }

  // fim da sequência da vela: conta o segredo uma vez só
  pianoDone(): void {
    if (this.progress.piano) return;
    this.progress.piano = true; this.gain();
    this.guide.say(LINES.pianoFound);
  }

  // reset controlado: esconde tudo de novo (moedas, revólver e segredos)
  askReset(): void {
    this.guide.ask(LINES.resetAsk, LINES.resetYes, () => {
      this.reset();
      this.guide.say(LINES.resetDone);
    });
  }

  reset(): void {
    this.progress.coins = []; this.progress.gun = false; this.progress.piano = false;
    this.storage.remove(STORAGE_KEYS.progress);
    this.loop.invalidate();
    this.sync();
  }
}
