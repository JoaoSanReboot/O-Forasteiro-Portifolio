import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, untracked, viewChild } from '@angular/core';
import { AudioService } from '../../core/audio/audio.service';
import { GuideService } from './guide.service';
import { IntroService } from '../intro/intro.service';
import { PlatformService } from '../../core/platform/platform.service';
import { drawSheriff } from '../../engine/figures/sheriff';
import { GUIDE_TIPS } from './guide-tips';



// ================= Xerife: o guia da vila =================
@Component({
  selector: 'div[appGuide]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'guide', id: 'guide' },
  template: `
    <div class="guide-say" id="guide-say" role="status" [hidden]="!speech()" (keydown.escape)="escape()">
      @if (speech(); as s) {
        @if (s.html) { <p id="guide-text" [innerHTML]="s.text"></p> } @else { <p id="guide-text">{{ s.text }}</p> }
        <div class="guide-actions" id="guide-actions">
          @for (a of s.actions; track $index) { <button type="button" [class]="a.cls" (click)="a.run()">{{ a.label }}</button> }
        </div>
      }
    </div>
    <button type="button" class="guide-btn" id="guide-btn" #btn [attr.aria-expanded]="!!speech()" aria-controls="guide-say" aria-label="Falar com o xerife, o guia da vila" (click)="toggle()"><canvas #cv width="28" height="40"></canvas></button>
  `,
})
export class Guide {
  private readonly guide = inject(GuideService);
  private readonly intro = inject(IntroService);
  private readonly reduceMotion = inject(PlatformService).reduceMotion;
  protected readonly speech = this.guide.speech;
  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly cv = viewChild.required<ElementRef<HTMLCanvasElement>>('cv');
  private here = 'procurado';

  constructor() {
    const audio = inject(AudioService), destroyRef = inject(DestroyRef);
    // a saudação aparece ao fim da chegada e a cada recarga; trocar de seção não repete
    let greetTimer: ReturnType<typeof setTimeout> | undefined;
    effect(() => {
      if (!this.intro.entered().n) return;
      untracked(() => {
        audio.cue('village');
        clearTimeout(greetTimer);
        greetTimer = setTimeout(() => { if (!this.speech()) this.guide.greet(); }, 1400);
      });
    });
    afterNextRender(() => {
      // só observa em silêncio qual área está na tela, para a fala certa quando o visitante clicar
      const seenH: Record<string, number> = {};
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => { seenH[e.target.id] = e.isIntersecting ? e.intersectionRect.height : 0; });
        const best = Object.keys(seenH).sort((a, b) => seenH[b] - seenH[a])[0];
        if (best && seenH[best] > 0) this.here = best;
      }, { threshold: [0, 0.1, 0.2, 0.4, 0.6, 0.8, 1] });
      Object.keys(GUIDE_TIPS).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

      const g = this.cv().nativeElement.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      let gt = 0;
      const draw = () => drawSheriff(g, gt, !!this.speech() && !this.reduceMotion);
      draw();
      const timer = setInterval(() => { if (!this.intro.siteOn() || document.hidden) return; gt += 0.12; draw(); }, 120);
      destroyRef.onDestroy(() => { io.disconnect(); clearInterval(timer); clearTimeout(greetTimer); });
    });
  }

  protected toggle(): void {
    if (this.speech()) this.guide.hide(); else this.guide.say(GUIDE_TIPS[this.here]);
  }

  protected escape(): void { this.guide.hide(); this.btn().nativeElement.focus(); }
}
