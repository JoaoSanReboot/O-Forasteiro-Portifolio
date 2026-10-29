import { inject, Injectable, isDevMode } from '@angular/core';
import { SceneRunner } from '../engine/runtime/scene-runner';
import { PlatformService } from './platform.service';

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
    if (!this.raf && this.platform.isBrowser) { this.last = performance.now(); this.raf = requestAnimationFrame(this.loop); }
  }

  unregister(scene: SceneRunner): void {
    const i = this.scenes.indexOf(scene);
    if (i >= 0) this.scenes.splice(i, 1);
    if (!this.scenes.length && this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; }
  }

  find(id: string): SceneRunner | undefined {
    return this.scenes.find((s) => s.id === id);
  }

  private readonly loop = (now: number): void => {
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    for (const s of this.scenes) {
      if (this.platform.reduceMotion) { if (!s.drawn) s.paint(2.5, 0); continue; }
      if (s.visible) { s.t += dt; s.paint(s.t, dt); }
      else if (!s.drawn) s.paint(s.t, 0);
    }
    this.raf = requestAnimationFrame(this.loop);
  };
}
