import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { Ctx } from '../engine/core/canvas';
import { Pt } from '../engine/draw/primitives';
import { CoinId, COIN_IDS, drawCoin, drawGunForSale, GUN_PRICE, isCoinId, nearCoin, onGun, SECRETS_TOTAL } from '../engine/secrets/coins';
import { DuelService } from './duel.service';
import { GuideService } from './guide.service';
import { HeroService } from './hero.service';
import { SceneLoopService } from './scene-loop.service';
import { STORAGE_KEYS, StorageService } from './storage.service';

export interface Progress { coins: CoinId[]; gun: boolean; piano: boolean; hero?: string | null }

const FULL_POCKETS = 'Ora, ora... Parece que seus bolsos tão cheios agora! Acho que já dá pra comprar um revórvi com o Xavier, não?';

// as moedas, o revólver do Xavier e o segredo do Saloon; o progresso fica no navegador (vila-progresso),
// e os formatos antigos (vila-moedas, vila-revolver) são lidos uma vez para ninguém perder o que achou
@Injectable({ providedIn: 'root' })
export class ProgressService {
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
    const p = this.storage.getJson<Partial<Progress> | null>(STORAGE_KEYS.progress, null);
    if (p) return p;
    const coins = this.storage.getJson<string[]>(STORAGE_KEYS.legacyCoins, []);
    return { coins: coins as CoinId[], gun: this.storage.get(STORAGE_KEYS.legacyGun) === '1' };
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
    if (this.done()) this.guide.say('Achou tudo que tinha escondido por aqui? Tá mais esperto que eu, sô!');
    else if (this.allCoins() && !this.progress.gun) this.guide.say(FULL_POCKETS);
    else this.guide.say('Tá procurando os segredos da região, é? Fique de olho... Às vezes as coisas mais estranhas tão bem debaixo do nosso nariz!');
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
    if (this.allCoins() && !this.progress.gun) this.guide.say(FULL_POCKETS);
    return true;
  }

  private buyGun(): void {
    if (!this.allCoins()) {
      const falta = GUN_PRICE - this.coinCount();
      this.guide.say(`Esse aí é o revórvi aprimorado do Xavier. Custa ${GUN_PRICE} moedas de ouro, e ainda falta${falta > 1 ? 'm' : ''} ${falta}. Procura mais, sô!`);
      return;
    }
    this.progress.gun = true; this.gain(); this.loop.invalidate('armeiro');
    this.guide.say('Negócio fechado! Com esse revórvi, as faixas vermelhas do duelo também valem. Agora sim, hein?');
  }

  // fim da sequência da vela: conta o segredo uma vez só
  pianoDone(): void {
    if (this.progress.piano) return;
    this.progress.piano = true; this.gain();
    this.guide.say('Eita! O Tião já trocou o cartaz... Mas essa arte eu vi, viu? Tá anotada!');
  }

  // reset controlado: esconde tudo de novo (moedas, revólver e segredos)
  askReset(): void {
    this.guide.ask('Quer que eu esconda tudo de novo? As moedas, o revórvi do Xavier e os segredos voltam pro lugar.', 'Sim, esconder tudo', () => {
      this.reset();
      this.guide.say('Pronto! Escondi tudo de novo. Boa caçada, forasteiro!');
    });
  }

  reset(): void {
    this.progress.coins = []; this.progress.gun = false; this.progress.piano = false;
    [STORAGE_KEYS.progress, STORAGE_KEYS.legacyCoins, STORAGE_KEYS.legacyGun].forEach((k) => this.storage.remove(k));
    this.loop.invalidate();
    this.sync();
  }
}
