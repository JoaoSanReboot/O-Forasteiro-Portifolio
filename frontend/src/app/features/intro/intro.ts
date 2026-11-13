import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PlatformService } from '../../core/platform/platform.service';
import { cancelRaf, raf } from '../../engine/core/browser';
import { Mandacaru, Sol } from '../../shared/ornaments/ornaments';
import { Letters } from '../../shared/split/letters';
import { IntroService } from './intro.service';

/** quanto o contador leva de 000 a 100 (ms) e quanto a cortina leva para subir */
const COUNT_MS = 2600;
const CURTAIN_MS = 1100;

// A abertura: o sol de xilogravura nasce atrás do mandacaru, "O Forasteiro" entra letra por letra
// e o contador vai de 000 a 100. Aí a cortina sobe e o site aparece por baixo.
// Pula com o botão, com um clique em qualquer lugar ou com Enter/Esc/Espaço.
// Sem JavaScript, o CSS tira a abertura da frente sozinho depois de alguns segundos.
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Sol, Mandacaru, Letters],
  host: {
    class: 'intro', role: 'region', 'aria-label': 'Abertura',
    '[class.leaving]': 'leaving()',
    '(click)': 'leave()',
    '(window:keydown)': 'onKey($event)',
  },
  template: `
    <div class="intro-sky" aria-hidden="true">
      <div class="intro-sun"><svg appSol></svg></div>
      <svg appMandacaru class="intro-cactus c1"></svg>
      <svg appMandacaru class="intro-cactus c2"></svg>
      <svg appMandacaru class="intro-cactus c3"></svg>
      <div class="intro-ground"></div>
    </div>
    <div class="intro-copy">
      <p class="intro-kicker"><span>João Pedro</span><span>Portfólio · 2026</span></p>
      <p class="intro-title">
        <em class="intro-o">O</em>
        <span class="intro-word" appLetters="Forasteiro"></span>
      </p>
      <p class="intro-sub">Desenvolvedor FullStack <span aria-hidden="true">·</span> .NET</p>
    </div>
    <div class="intro-foot" aria-hidden="true">
      <span>Sertão digital — São José dos Pinhais, PR</span>
      <span class="intro-count" #count>000</span>
    </div>
    <button type="button" class="intro-skip" (click)="leave(); $event.stopPropagation()">Pular <span aria-hidden="true">↵</span></button>
  `,
})
export class Intro {
  private readonly intro = inject(IntroService);
  private readonly count = viewChild.required<ElementRef<HTMLElement>>('count');
  protected readonly leaving = signal(false);
  private frame = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const platform = inject(PlatformService), destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.intro.begin();
      // atalho de desenvolvimento e "reduzir movimento": direto para o site
      if (environment.skipIntro || platform.reduceMotion) { this.leave(true); return; }
      const el = this.count().nativeElement, t0 = performance.now();
      const tick = (now: number) => {
        const k = Math.min(1, (now - t0) / COUNT_MS);
        // começa rápido e segura no fim, como um carregamento de verdade
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(eased * 100)).padStart(3, '0');
        if (k < 1) this.frame = raf(tick); else this.leave();
      };
      this.frame = raf(tick);
    });
    destroyRef.onDestroy(() => { cancelRaf(this.frame); if (this.timer) clearTimeout(this.timer); });
  }

  /** a cortina sobe; `now` tira a abertura sem animação */
  protected leave(now = false): void {
    if (this.leaving()) return;
    cancelRaf(this.frame);
    this.leaving.set(true);
    this.intro.finish();
    this.timer = setTimeout(() => this.intro.hide(), now ? 0 : CURTAIN_MS);
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') { e.preventDefault(); this.leave(); }
  }
}
