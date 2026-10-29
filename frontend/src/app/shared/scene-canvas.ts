import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, input, viewChild } from '@angular/core';
import { SceneLoopService } from '../core/scene-loop.service';
import { SceneRunner } from '../engine/runtime/scene-runner';
import { SceneId, SCENES } from '../engine/scenes';

// <figure appScene="armeiro">: o canvas da cena, medido pela largura da figura; o conteúdo projetado fica por cima
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
  private runner?: SceneRunner;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const fig = this.host.nativeElement;
      const runner = new SceneRunner(this.appScene(), this.canvas().nativeElement, SCENES[this.appScene()]());
      this.runner = runner;
      const resize = () => runner.size(fig.clientWidth);
      resize();
      window.addEventListener('resize', resize);
      const visObs = new IntersectionObserver(
        (entries) => entries.forEach((e) => { runner.visible = e.isIntersecting && e.intersectionRatio >= 0.45; }),
        { threshold: [0, 0.45, 0.7, 1] },
      );
      visObs.observe(fig);
      this.loop.register(runner);
      destroyRef.onDestroy(() => {
        window.removeEventListener('resize', resize);
        visObs.disconnect();
        this.loop.unregister(runner);
      });
    });
  }

  /** o runner montado no navegador (indefinido no build estático) */
  get scene(): SceneRunner | undefined { return this.runner; }
}
