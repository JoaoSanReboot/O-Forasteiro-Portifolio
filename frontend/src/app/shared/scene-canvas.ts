import { afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { DuelService } from '../core/duel.service';
import { HeroService } from '../core/hero.service';
import { IntroService } from '../core/intro.service';
import { ProgressService } from '../core/progress.service';
import { SaloonService } from '../core/saloon.service';
import { SceneLoopService } from '../core/scene-loop.service';
import { clamp } from '../engine/core/math';
import { SH } from '../engine/core/stage';
import { SceneRunner } from '../engine/runtime/scene-runner';
import { SceneId, SCENES } from '../engine/scenes';

interface Pin { el: HTMLElement; x: number; y: number }

// <figure appScene="armeiro">: o canvas da cena, medido pela largura da figura; o conteúdo projetado fica por cima.
// Balões e painéis podem ser presos a uma coordenada da arte (pin), numa camada do tamanho do canvas.
@Component({
  selector: 'figure[appScene]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'scene', '[attr.data-scene]': 'appScene()' },
  template: `<canvas #canvas aria-hidden="true"></canvas><ng-content />`,
})
export class SceneCanvas {
  readonly appScene = input.required<SceneId>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly loop = inject(SceneLoopService);
  private readonly saloonState = inject(SaloonService);
  private readonly duel = inject(DuelService);
  private readonly heroes = inject(HeroService);
  private readonly secrets = inject(ProgressService);
  private readonly intro = inject(IntroService);
  private runner?: SceneRunner;
  private layerEl?: HTMLDivElement;
  private readonly pins: Pin[] = [];
  private readonly ready: (() => void)[] = [];

  private resizeNow?: () => void;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // o site fica escondido atrás da tela inicial: a cena só se mede quando ele aparece
    afterRenderEffect(() => { if (this.intro.siteOn()) this.resizeNow?.(); });
    afterNextRender(() => {
      const fig = this.host.nativeElement;
      const { piano, saloon } = this.saloonState;
      const id = this.appScene();
      const deps = { piano, saloon, duel: this.duel.state, hero: this.heroes.current, hasGun: this.secrets.hasGun };
      const canvas = this.canvas().nativeElement;
      const runner = new SceneRunner(id, canvas, SCENES[id](deps));
      this.runner = runner;
      runner.overlay = this.secrets.overlay(id);
      const resize = () => { if (!this.intro.siteOn()) return; runner.size(fig.clientWidth); this.placeLayers(); };
      resize();
      window.addEventListener('resize', resize);
      // as moedas escondidas e o revólver do Xavier: mãozinha por cima e o toque pega
      canvas.addEventListener('pointermove', (e) => { if (runner.scale) canvas.style.cursor = this.secrets.hover(id, runner.toScene(e.clientX, e.clientY)) ? 'pointer' : ''; });
      canvas.addEventListener('pointerdown', (e) => {
        if (!runner.scale || !this.secrets.tap(id, runner.toScene(e.clientX, e.clientY))) return;
        e.stopPropagation(); canvas.style.cursor = '';
      });
      this.resizeNow = resize;
      const visObs = new IntersectionObserver(
        (entries) => entries.forEach((e) => { runner.visible = e.isIntersecting && e.intersectionRatio >= 0.45; }),
        { threshold: [0, 0.45, 0.7, 1] },
      );
      visObs.observe(fig);
      this.loop.register(runner);
      this.ready.splice(0).forEach((fn) => fn());
      destroyRef.onDestroy(() => {
        window.removeEventListener('resize', resize);
        visObs.disconnect();
        this.loop.unregister(runner);
      });
    });
  }

  /** o runner montado no navegador (indefinido no build estático) */
  get scene(): SceneRunner | undefined { return this.runner; }

  /** roda quando a cena estiver montada (na hora, se já estiver) */
  whenReady(fn: (runner: SceneRunner) => void): void {
    if (this.runner) fn(this.runner);
    else this.ready.push(() => fn(this.runner!));
  }

  /** a camada sobre o canvas, criada na primeira vez que alguém precisa dela */
  layer(): HTMLDivElement {
    if (!this.layerEl) {
      this.layerEl = document.createElement('div');
      this.layerEl.className = 'scene-layer';
      this.host.nativeElement.appendChild(this.layerEl);
    }
    return this.layerEl;
  }

  // prende um elemento a uma coordenada da cena (em pixels da arte, 320 × 150)
  pin(el: HTMLElement, x: number, y: number): void {
    this.layer().appendChild(el);
    this.pins.push({ el, x, y });
    this.placeLayers();
  }

  private placeLayers(): void {
    const s = this.runner;
    if (!s || !s.scale) return;
    if (this.layerEl) {
      const c = s.canvas;
      Object.assign(this.layerEl.style, { left: c.offsetLeft + c.clientLeft + 'px', top: c.offsetTop + c.clientTop + 'px', width: s.W * s.scale + 'px', height: SH * s.scale + 'px' });
    }
    for (const p of this.pins) {
      const x = clamp(p.x, s.camX + 34, s.camX + s.W - 34);
      p.el.style.left = (x - s.camX) * s.scale + 'px';
      p.el.style.top = p.y * s.scale + 'px';
    }
  }
}
