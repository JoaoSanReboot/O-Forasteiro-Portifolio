import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, untracked, viewChild } from '@angular/core';
import { AudioService } from '../../core/audio.service';
import { GuideService } from '../../core/guide.service';
import { IntroService } from '../../core/intro.service';
import { PlatformService } from '../../core/platform.service';
import { limb, O } from '../../engine/draw/primitives';
import { head, Person, torso } from '../../engine/figures/people';

const TIPS: Record<string, string> = {
  procurado: 'Bom, parece que tem um forasteiro à solta... Fique ligeiro, o sujeito é bom de mira!',
  projetos: 'Aqui a gente dá vida às ideia. Tem muita coisa no papel que logo vai pra forja! Clica num baú pra abrir e usa as setas pra trocar de projeto.',
  trabalhos: 'É aqui que eu registro por onde o forasteiro passou e os feito dele mundo afora. Um trabalhão danado! Abre as fichas pra ver cargo, empresa e o que ele fez.',
  skills: 'Nosso amigo Xavier vende os melhor revórvi da região. Se quiser um, é só dar uma olhada!',
  commits: 'Aqui é nossa conexão com a internet. Num é das mais moderna, mas dá pro gasto!',
  formacao: 'Shhh... Silêncio! É aqui que se formam os maior engenheiro de software da região!',
  saloon: 'Opa, Tião! Bão? Trouxe um convidado. Fique à vontade por aqui!',
  duelo: 'Rapaiz! Esqueci meu revórvi... Como é que nós vamo prender esse forasteiro agora?',
};

// o desenho do xerife: chapéu, bigode e estrela; acena enquanto fala
const SHERIFF: Person = { skin: '#c89070', skinD: '#9a6a50', hair: '#6a6662', stache: '#8a8682', hat: '#4a3a2a', band: '#2a1e18', shirt: '#8a6a3c', vest: '#3e2e24', badge: true, blinkOff: 0.4 };

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
      Object.keys(TIPS).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });

      const g = this.cv().nativeElement.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      let gt = 0;
      const draw = () => {
        g.clearRect(0, 0, 28, 40);
        const cx = 14, talking = !!this.speech() && !this.reduceMotion, P = SHERIFF;
        O(g, cx - 6, 32, 5, 7, '#3a3230'); O(g, cx + 1, 32, 5, 7, '#3a3230');
        torso(g, cx, 19, P, 13);
        head(g, cx, 9, P, gt);
        limb(g, [[cx - 9, 22], [cx - 11, 27], [cx - 9, 31]], 3, P.shirt, P.skin);
        const w = talking ? Math.round(Math.sin(gt * 7) * 2) : 0;
        if (talking) limb(g, [[cx + 8, 22], [cx + 12, 17], [cx + 11 + w, 9]], 3, P.shirt, P.skin);
        else limb(g, [[cx + 8, 22], [cx + 10, 27], [cx + 8, 31]], 3, P.shirt, P.skin);
      };
      draw();
      const timer = setInterval(() => { if (!this.intro.siteOn() || document.hidden) return; gt += 0.12; draw(); }, 120);
      destroyRef.onDestroy(() => { io.disconnect(); clearInterval(timer); clearTimeout(greetTimer); });
    });
  }

  protected toggle(): void {
    if (this.speech()) this.guide.hide(); else this.guide.say(TIPS[this.here]);
  }

  protected escape(): void { this.guide.hide(); this.btn().nativeElement.focus(); }
}
