import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// o que o navegador conta sobre o visitante; lido uma vez
@Injectable({ providedIn: 'root' })
export class PlatformService {
  readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly reduceMotion = this.isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** mouse ou caneta (passar o mouse por cima existe) */
  readonly finePointer = this.isBrowser && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
