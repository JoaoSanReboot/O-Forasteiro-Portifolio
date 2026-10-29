import { inject, Injectable, isDevMode } from '@angular/core';
import { IntroService } from './intro.service';
import { SceneRunner } from '../engine/runtime/scene-runner';
import { PlatformService } from './platform.service';
import { cancelRaf, raf } from '../engine/core/browser';

declare global {
  interface Window {
    /** usados só para conferir as animações em momentos específicos do ciclo (build de desenvolvimento) */
    vilaTime?: (id: string) => number;
    vilaSeek?: (id: string, t: number) => void;
  }
}

// um único requestAnimationFrame para todas as cenas; a cena só anda quando boa parte dela está na tela
@Injectable({ providedIn: 'root' })
export class SceneLoopService {
  private readonly platform = inject(PlatformService);
  private readonly intro = inject(IntroService);
  private readonly scenes: SceneRunner[] = [];
  private raf = 0;
  private last = 0;

  constructor() {
    if (this.platform.isBrowser && isDevMode()) {
      window.vilaTime = (id) => this.find(id)?.t ?? -1;
      window.vilaSeek = (id, t) => { const s = this.find(id); if (s) { s.t = t; s.drawn = false; } };
    }
  }

  register(scene: SceneRunner): void {
    this.scenes.push(scene);
    if (!this.raf && this.platform.isBrowser) { this.last = performance.now(); this.raf = raf(this.loop); }
  }

  unregister(scene: SceneRunner): void {
    const i = this.scenes.indexOf(scene);
    if (i >= 0) this.scenes.splice(i, 1);
    if (!this.scenes.length && this.raf) { cancelRaf(this.raf); this.raf = 0; }
  }

  /** as cenas paradas (fora da tela ou com movimento reduzido) se redesenham no próximo quadro */
  invalidate(id?: string): void {
    for (const s of this.scenes) if (!id || s.id === id) s.drawn = false;
  }

  find(id: string): SceneRunner | undefined {
    return this.scenes.find((s) => s.id === id);
  }

  private readonly loop = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    // com a tela inicial por cima, o site não anda
    if (this.intro.siteOn()) for (const s of this.scenes) {
      if (this.platform.reduceMotion && !s.def.acting?.()) { if (!s.drawn) s.paint(2.5, 0); continue; }
      if (s.visible) { s.t += dt; s.paint(s.t, dt); }
      else if (!s.drawn) s.paint(s.t, 0);
    }
    this.raf = raf(this.loop);
  };
}
