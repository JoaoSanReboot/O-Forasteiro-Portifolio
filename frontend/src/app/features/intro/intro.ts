import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { environment } from '../../../environments/environment';
import { cancelRaf, raf } from '../../engine/core/browser';
import { Ceu } from '../../shared/ornaments/ceu';
import { Mandacaru, Sol } from '../../shared/ornaments/ornaments';
import { Letters } from '../../shared/split/letters';
import { IntroService } from './intro.service';

/** quanto o contador leva de 000 a 100 (ms) e quanto a cortina leva para subir */
const COUNT_MS = 2600;
const CURTAIN_MS = 1100;
/** as câmaras do tambor do revólver (uma bala a cada sexto do contador) */
const CHAMBERS = [0, 1, 2, 3, 4, 5];

// A tela de carregamento: madrugada no sertão, com o Cruzeiro do Sul e uma estrela cadente; o sol de xilogravura
// nasce atrás do mandacaru, "Seja bem-vindo, Forasteiro" entra letra por letra e o contador vai de 000 a 100
// enquanto o tambor do revólver é carregado, bala por bala. Aí a cortina sobe e o site aparece por baixo.
// Não dá para pular: ela roda inteira a cada visita e a cada recarregamento (com "reduzir movimento", sem as animações).
// Sem JavaScript, o CSS tira a abertura da frente sozinho depois de alguns segundos.
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Sol, Mandacaru, Ceu, Letters],
  host: {
    class: 'intro', role: 'region', 'aria-label': 'Carregando o portfólio',
    '[class.leaving]': 'leaving()',
  },
  template: `
    <div class="intro-sky" aria-hidden="true">
      <svg appCeu class="intro-ceu"></svg>
      <span class="cadente"></span>
      <div class="intro-sun"><svg appSol></svg></div>
      <svg appMandacaru class="intro-cactus c1"></svg>
      <svg appMandacaru class="intro-cactus c2"></svg>
      <svg appMandacaru class="intro-cactus c3"></svg>
      <div class="intro-ground"></div>
    </div>
    <div class="intro-copy">
      <p class="intro-title">
        <em class="intro-hello">Seja bem-vindo,</em>
        <span class="intro-word" appLetters="Forasteiro"></span>
      </p>
      <p class="intro-sub">ao portfólio de João Pedro</p>
    </div>
    <div class="intro-foot" aria-hidden="true">
      <span class="intro-load">
        <svg class="tambor" #tambor viewBox="-50 -50 100 100" focusable="false">
          <circle class="tb-body" r="47" />
          <circle class="tb-axis" r="9" />
          @for (c of chambers; track c) {
            <g [attr.transform]="'rotate(' + c * 60 + ') translate(0 -29)'">
              <circle class="tb-hole" r="11.5" />
              <circle class="tb-bala" r="8.5" [style.--i]="c" />
            </g>
          }
        </svg>
        <span class="intro-count" #count>000</span>
      </span>
    </div>
  `,
})
export class Intro {
  private readonly intro = inject(IntroService);
  private readonly count = viewChild.required<ElementRef<HTMLElement>>('count');
  private readonly tambor = viewChild.required<ElementRef<SVGElement>>('tambor');
  protected readonly chambers = CHAMBERS;
  protected readonly leaving = signal(false);
  private frame = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.intro.begin();
      // atalho só de desenvolvimento: direto para o site
      if (environment.skipIntro) { this.leave(true); return; }
      const el = this.count().nativeElement, drum = this.tambor().nativeElement;
      // o relógio começa no primeiro quadro (o tempo do quadro e o performance.now() nem sempre têm a mesma origem)
      let t0 = -1, loaded = -1;
      const tick = (now: number) => {
        if (t0 < 0) t0 = now;
        const k = Math.min(1, (now - t0) / COUNT_MS);
        // começa rápido e segura no fim, como um carregamento de verdade
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = String(Math.round(eased * 100)).padStart(3, '0');
        // uma bala a mais a cada sexto: o tambor gira uma câmara (o CSS anima o giro)
        const n = Math.min(6, Math.floor(eased * 6.02));
        if (n !== loaded) { loaded = n; drum.style.setProperty('--n', String(n)); }
        if (k < 1) this.frame = raf(tick); else this.leave();
      };
      this.frame = raf(tick);
    });
    destroyRef.onDestroy(() => { cancelRaf(this.frame); if (this.timer) clearTimeout(this.timer); });
  }

  /** o carregamento terminou: a cortina sobe (`now` tira a abertura sem animação) */
  private leave(now = false): void {
    if (this.leaving()) return;
    cancelRaf(this.frame);
    this.leaving.set(true);
    this.intro.finish();
    this.timer = setTimeout(() => this.intro.hide(), now ? 0 : CURTAIN_MS);
  }
}
