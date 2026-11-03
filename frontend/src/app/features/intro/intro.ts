import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, signal, untracked, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AudioService } from '../../core/audio/audio.service';
import { HeroService } from '../heroes/hero.service';
import { IntroService } from './intro.service';
import { PlatformService } from '../../core/platform/platform.service';
import { Gate } from './gate/gate';
import { createRide, Ride } from './ride/ride';

// A abertura: tela inicial com a escolha do personagem (Gate), a cavalgada até a vila (ride/) e o alto-falante, sempre à mão.
// Depois da chegada, o canvas da estrada continua fixo atrás do topo do site (a cena do portão).
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:keydown)': 'onKeyDown($event)', '(window:keyup)': 'onKeyUp($event)', '(window:blur)': 'boost(false)' },
  imports: [Gate],
  templateUrl: './intro.html',
})
export class Intro {
  private readonly heroes = inject(HeroService);
  private readonly intro = inject(IntroService);
  private readonly sound = inject(AudioService);
  private readonly platform = inject(PlatformService);

  private readonly stage = viewChild.required<ElementRef<HTMLCanvasElement>>('stage');
  private readonly posterLayer = viewChild.required<ElementRef<HTMLCanvasElement>>('posterLayer');
  private readonly tale = viewChild.required<ElementRef<HTMLElement>>('tale');
  private readonly taleSr = viewChild.required<ElementRef<HTMLElement>>('taleSr');
  private readonly hint = viewChild.required<ElementRef<HTMLElement>>('hint');
  private readonly gate = viewChild.required(Gate);

  protected readonly soundOn = this.sound.on;
  protected readonly isTouch = this.platform.isTouch;
  protected readonly gateHidden = signal(false);
  protected readonly hudHidden = signal(true);
  protected readonly skipHidden = signal(false);
  protected readonly hintHidden = signal(true);

  private ride?: Ride;
  private skipping = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
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
      ride.riderImg.onload = () => { ride.rebuild(); ride.redrawGate(); this.gate().refreshSprites(); };
      ride.redrawGate();
      this.showGate();
      // quem já chegou nesta visita (ou o build de desenvolvimento) não precisa cavalgar de novo: vai direto para o mural
      if (this.intro.arrivedBefore || environment.skipIntro) {
        this.hideGate(); this.skipping = true; ride.skip(); this.skipping = false; this.intro.enter(true);
      }
      destroyRef.onDestroy(() => { window.removeEventListener('resize', onResize); ride.destroy(); });
    });
  }

  private showGate(): void {
    this.gateHidden.set(false);
    this.gate().show();
    this.ride?.redrawGate();
  }

  /** `now`: a aventura começou e a vitrine para na hora */
  private hideGate(now = false): void {
    this.gateHidden.set(true);
    this.gate().hide(now);
  }

  // a aventura começa com o personagem escolhido
  protected start(): void {
    this.heroes.choose(this.heroes.id());
    this.ride!.rebuild();
    this.hideGate(true);
    this.hudHidden.set(false); this.skipHidden.set(false); this.hintHidden.set(false);
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
