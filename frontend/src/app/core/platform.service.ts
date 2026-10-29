import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { engineEnv } from '../engine/core/env';

// o que o navegador conta sobre o visitante; lido uma vez, como no legado
@Injectable({ providedIn: 'root' })
export class PlatformService {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly reduceMotion = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  readonly isTouch = this.isBrowser && window.matchMedia('(pointer: coarse)').matches;

  constructor() {
    engineEnv.reduceMotion = this.reduceMotion;
  }
}
