import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, Injector, signal, untracked, viewChild, viewChildren } from '@angular/core';
import { environment } from '../../environments/environment';
import { AudioService } from '../core/audio.service';
import { HeroService } from '../core/hero.service';
import { IntroService } from '../core/intro.service';
import { PlatformService } from '../core/platform.service';
import { drawHero, Hero, HEROES, HeroId } from '../engine/heroes/heroes';
import { createRide, Ride } from './ride';

// A abertura: tela inicial com a escolha do personagem, a cavalgada até a vila e o alto-falante, sempre à mão.
// Depois da chegada, o canvas da estrada continua fixo atrás do topo do site (a cena do portão).
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:keydown)': 'onKeyDown($event)', '(window:keyup)': 'onKeyUp($event)', '(window:blur)': 'boost(false)' },
  templateUrl: './intro.html',
})
export class Intro {
  private readonly heroes = inject(HeroService);
  private readonly intro = inject(IntroService);
  private readonly sound = inject(AudioService);
  private readonly platform = inject(PlatformService);
  private readonly injector = inject(Injector);

  private readonly stage = viewChild.required<ElementRef<HTMLCanvasElement>>('stage');
  private readonly posterLayer = viewChild.required<ElementRef<HTMLCanvasElement>>('posterLayer');
  private readonly tale = viewChild.required<ElementRef<HTMLElement>>('tale');
  private readonly taleSr = viewChild.required<ElementRef<HTMLElement>>('taleSr');
  private readonly hint = viewChild.required<ElementRef<HTMLElement>>('hint');
  private readonly heroView = viewChild.required<ElementRef<HTMLCanvasElement>>('heroView');
  private readonly cards = viewChildren<ElementRef<HTMLButtonElement>>('card');

  protected readonly cast = HEROES;
  protected readonly heroId = this.heroes.id;
  protected readonly hero = this.heroes.hero;
  protected readonly soundOn = this.sound.on;
  protected readonly isTouch = this.platform.isTouch;
  protected readonly gateHidden = signal(false);
  protected readonly hudHidden = signal(true);
  protected readonly skipHidden = signal(false);
  protected readonly hintHidden = signal(true);

  private ride?: Ride;
  private skipping = false;
  private gateRaf = 0;
  private readonly heroSprites = new Map<HeroId, HTMLCanvasElement>();

  constructor() {
    const destroyRef = inject(DestroyRef);
    // os cartões se repintam quando a escolha muda
    effect(() => { this.heroId(); untracked(() => this.paintCards()); });
    // "Rever a chegada" volta para a tela inicial: dá até para trocar de personagem
    effect(() => {
      if (!this.intro.replays()) return;
      untracked(() => {
        this.ride?.stop();
        this.hudHidden.set(true); this.hintHidden.set(true);
        document.body.classList.remove('cinema');
        this.showGate();
      });
    });
    afterNextRender(() => {
      const audio = this.sound.audio!;
      const ride = createRide(
        { stage: this.stage().nativeElement, poster: this.posterLayer().nativeElement, tale: this.tale().nativeElement, taleSr: this.taleSr().nativeElement, hint: this.hint().nativeElement },
        {
          audio, hero: this.heroes.current, siteOn: () => this.intro.siteOn(),
          cinema: (on) => document.body.classList.toggle('cinema', on),
          onFinish: () => this.finish(),
        },
      );
      this.ride = ride;
      const onResize = () => { ride.resize(); ride.rebuild(); };
      window.addEventListener('resize', onResize);
      ride.riderImg.onload = () => { ride.rebuild(); ride.redrawGate(); this.heroSprites.clear(); if (!this.gateHidden()) this.paintCards(); };
      ride.redrawGate();
      this.showGate();
      // quem já chegou nesta visita (ou o build de desenvolvimento) não precisa cavalgar de novo: vai direto para o mural
      if (this.intro.arrivedBefore || environment.skipIntro) {
        this.gateHidden.set(true); this.skipping = true; ride.skip(); this.skipping = false; this.intro.enter(true);
      }
      destroyRef.onDestroy(() => { window.removeEventListener('resize', onResize); ride.destroy(); cancelAnimationFrame(this.gateRaf); });
    });
  }

  private sprite(h: Hero): HTMLCanvasElement {
    let c = this.heroSprites.get(h.id);
    if (!c) { c = drawHero(h, 'front'); this.heroSprites.set(h.id, c); }
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

  // vitrine: o escolhido fica de frente no pedestal, só respirando (sem girar)
  private readonly drawView = (now: number): void => {
    const hv = this.heroView().nativeElement.getContext('2d')!;
    const S = this.sprite(this.heroes.current());
    const breathe = !this.platform.reduceMotion && Math.sin(now / 520) > 0.55 ? 1 : 0;
    hv.clearRect(0, 0, 64, 64); hv.imageSmoothingEnabled = false;
    hv.fillStyle = 'rgba(0,0,0,0.35)'; hv.fillRect(20, 59, 24, 2); hv.fillRect(22, 61, 20, 1);
    hv.drawImage(S, 16, 13 + breathe, 32, 48 - breathe);
    if (!this.gateHidden()) this.gateRaf = requestAnimationFrame(this.drawView);
  };

  private showGate(): void {
    this.gateHidden.set(false);
    this.paintCards();
    cancelAnimationFrame(this.gateRaf); this.gateRaf = requestAnimationFrame(this.drawView);
    this.ride?.redrawGate();
  }

  // a aventura começa com o personagem escolhido
  protected start(): void {
    this.heroes.choose(this.heroId());
    this.ride!.rebuild();
    cancelAnimationFrame(this.gateRaf);
    this.gateHidden.set(true); this.hudHidden.set(false); this.skipHidden.set(false); this.hintHidden.set(false);
    this.ride!.begin(this.platform.reduceMotion);
  }

  protected skip(): void { this.ride?.skip(); }

  private finish(): void {
    this.skipHidden.set(true); this.hintHidden.set(true);
    document.body.classList.remove('cinema');
    // sem tela de "entrar": a cena da chegada sobe e o mural da vila aparece logo em seguida
    if (!this.skipping) { this.hudHidden.set(true); this.intro.enter(); }
  }

  protected toggleSound(): void { this.sound.toggle(); }

  protected boost(on: boolean): void { this.ride?.setBoost(on); }

  protected onKeyDown(e: KeyboardEvent): void {
    if (!this.ride?.riding) return;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) this.boost(true); }
    if (e.key === 'Escape') { e.preventDefault(); this.skip(); }
  }

  protected onKeyUp(e: KeyboardEvent): void { if (e.code === 'Space') this.boost(false); }

  protected stagePointer(e: PointerEvent): void { if (this.ride?.riding) { e.preventDefault(); this.boost(true); } }
}
