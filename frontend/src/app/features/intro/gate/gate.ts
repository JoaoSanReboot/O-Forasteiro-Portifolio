import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, Injector, output, untracked, viewChild, viewChildren } from '@angular/core';
import { PlatformService } from '../../../core/platform/platform.service';
import { cancelRaf, raf } from '../../../engine/core/browser';
import { drawHero } from '../../../engine/heroes/hero-sprite';
import { Hero, HEROES, HeroId } from '../../../engine/heroes/heroes';
import { HeroService } from '../../heroes/hero.service';

// A tela inicial: o elenco em cartões (radiogroup com setas), a ficha do escolhido e a vitrine em que ele respira.
// Quem mostra e esconde a tela é a abertura (show/hide); o botão "Iniciar aventura" sai pelo `begin`.
@Component({
  selector: 'section[appGate]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './gate.html',
})
export class Gate {
  readonly begin = output<void>();

  private readonly heroes = inject(HeroService);
  private readonly platform = inject(PlatformService);
  private readonly injector = inject(Injector);
  private readonly heroView = viewChild.required<ElementRef<HTMLCanvasElement>>('heroView');
  private readonly cards = viewChildren<ElementRef<HTMLButtonElement>>('card');

  protected readonly cast = HEROES;
  protected readonly heroId = this.heroes.id;
  protected readonly hero = this.heroes.hero;

  /** a tela está à mostra: a vitrine segue respirando */
  private shown = false;
  private frameId = 0;
  private readonly sprites = new Map<HeroId, HTMLCanvasElement>();

  constructor() {
    // os cartões se repintam quando a escolha muda
    effect(() => { this.heroId(); untracked(() => this.paintCards()); });
    inject(DestroyRef).onDestroy(() => cancelRaf(this.frameId));
  }

  show(): void {
    this.shown = true;
    this.paintCards();
    cancelRaf(this.frameId); this.frameId = raf(this.drawView);
  }

  /** `now`: para a vitrine na hora (a aventura começou); sem ele, ela ainda pinta o quadro já pedido */
  hide(now = false): void {
    this.shown = false;
    if (now) cancelRaf(this.frameId);
  }

  /** o sprite desenhado à mão chegou: os cartões são repintados com ele */
  refreshSprites(): void {
    this.sprites.clear();
    if (this.shown) this.paintCards();
  }

  protected select(id: HeroId, focus = false): void {
    this.heroes.choose(id);
    if (focus) afterNextRender(() => this.cards().find((b) => b.nativeElement.dataset['id'] === id)?.nativeElement.focus(), { injector: this.injector });
  }

  protected castKey(e: KeyboardEvent): void {
    const ids = HEROES.map((h) => h.id);
    let i = ids.indexOf(this.heroId());
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (i - 1 + ids.length) % ids.length;
    else return;
    e.preventDefault(); this.select(ids[i], true);
  }

  private sprite(h: Hero): HTMLCanvasElement {
    let c = this.sprites.get(h.id);
    if (!c) { c = drawHero(h, 'front'); this.sprites.set(h.id, c); }
    return c;
  }

  private paintCards(): void {
    if (!this.platform.isBrowser) return;
    this.cards().forEach((b) => {
      const h = HEROES.find((x) => x.id === b.nativeElement.dataset['id'])!;
      const g = b.nativeElement.querySelector('canvas')!.getContext('2d')!;
      g.clearRect(0, 0, 32, 48); g.drawImage(this.sprite(h), 0, 0);
    });
  }

  // vitrine: o escolhido fica de frente no pedestal, só respirando (sem girar)
  private readonly drawView = (now: number): void => {
    const hv = this.heroView().nativeElement.getContext('2d')!;
    const S = this.sprite(this.heroes.current());
    const breathe = !this.platform.reduceMotion && Math.sin(now / 520) > 0.55 ? 1 : 0;
    hv.clearRect(0, 0, 64, 64); hv.imageSmoothingEnabled = false;
    hv.fillStyle = 'rgba(0,0,0,0.35)'; hv.fillRect(20, 59, 24, 2); hv.fillRect(22, 61, 20, 1);
    hv.drawImage(S, 16, 13 + breathe, 32, 48 - breathe);
    if (this.shown) this.frameId = raf(this.drawView);
  };
}
