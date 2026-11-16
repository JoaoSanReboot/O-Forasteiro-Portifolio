import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { PlatformService } from '../../core/platform/platform.service';
import { raf } from '../../engine/core/browser';
import { clamp } from '../../engine/core/math';
import { Ceu } from '../../shared/ornaments/ceu';
import { Feno } from '../../shared/ornaments/feno';
import { Mandacaru, Sol } from '../../shared/ornaments/ornaments';

/** as três falas da travessia e o trecho da rolagem (0 a 1) em que cada uma fica na tela */
const FALAS = [
  { de: 0.04, ate: 0.33, texto: 'Saiu do banco de dados,' },
  { de: 0.36, ate: 0.65, texto: 'atravessou as APIs' },
  { de: 0.68, ate: 1.2, texto: 'e chegou na tela.' },
];
/** os mandacarus do meio do caminho: posição (% da faixa), altura (em vh, menor em tela estreita) e lado dos braços */
const CACTOS = [
  { x: 6, h: 30, flip: 1 }, { x: 24, h: 17, flip: -1 }, { x: 41, h: 24, flip: 1 }, { x: 63, h: 34, flip: -1 },
  { x: 79, h: 15, flip: 1 }, { x: 93, h: 27, flip: -1 },
];

// A travessia: uma cena do sertão que fica presa na tela enquanto a página rola por baixo dela.
// A rolagem é o relógio: o vaqueiro de chapéu de couro atravessa a caatinga a cavalo (as patas só galopam
// quando se rola), um feno passa rolando aos pulos e ultrapassa o cavalo, o sol se põe atrás da serra, o céu escurece até o Cruzeiro do Sul aparecer, as camadas
// da paisagem correm em velocidades diferentes e as falas contam o caminho, do banco de dados à tela.
// O progresso vai no estilo do elemento (--p, de 0 a 1), lido uma vez por quadro; o resto é CSS.
// Sem JavaScript ou com "reduzir movimento", a cena fica parada no meio do caminho.
@Component({
  selector: 'div[appTravessia]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Sol, Mandacaru, Ceu, Feno],
  host: { class: 'travessia', id: 'travessia', role: 'region', 'aria-label': 'A travessia do forasteiro' },
  template: `
    <div class="tv-stage">
      <div class="tv-sky" aria-hidden="true"><svg appCeu class="tv-ceu"></svg></div>
      <div class="tv-sun" aria-hidden="true"><svg appSol></svg></div>
      <svg class="tv-layer tv-serra-1" viewBox="0 0 2000 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 210 L110 150 L190 175 L300 95 L390 140 L470 120 L580 60 L690 130 L790 105 L900 150 L1010 80 L1120 135 L1230 110 L1340 160 L1450 90 L1560 140 L1660 115 L1780 165 L1880 120 L2000 150 V300 H0 Z" />
      </svg>
      <svg class="tv-layer tv-serra-2" viewBox="0 0 2000 300" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 230 Q140 170 260 205 T520 180 Q640 130 760 190 T1020 200 Q1150 150 1280 195 T1540 185 Q1680 140 1800 200 T2000 190 V300 H0 Z" />
      </svg>
      <div class="tv-layer tv-meio" aria-hidden="true">
        @for (c of cactos; track c.x) {
          <svg appMandacaru class="tv-cacto" [style.left.%]="c.x" [style.--h]="c.h" [style.scale]="c.flip + ' 1'"></svg>
        }
      </div>
      <div class="tv-chao" aria-hidden="true"></div>

      <div class="tv-rider" aria-hidden="true">
        <span class="tv-poeira"></span>
        <svg viewBox="0 0 200 150" focusable="false">
          <g class="tv-cavalo">
            <path class="tv-rabo" d="M56 64 Q32 66 26 106 Q40 88 58 76 Z" />
            <g class="perna tras-a"><path d="M74 80 L68 110 L73 136" /></g>
            <g class="perna frente-a"><path d="M134 82 L139 111 L135 136" /></g>
            <ellipse cx="100" cy="72" rx="48" ry="19" />
            <path d="M126 64 Q136 40 156 28 L170 40 Q158 56 150 82 Z" />
            <path d="M154 26 Q170 20 188 40 Q192 47 185 50 Q172 49 162 42 Z" />
            <path d="M157 29 L160 16 L167 27 Z" />
            <g class="perna tras-b"><path d="M64 78 L57 108 L63 136" /></g>
            <g class="perna frente-b"><path d="M144 80 L150 110 L146 136" /></g>
          </g>
          <g class="tv-vaqueiro">
            <path class="membro" d="M104 58 L97 78 L104 94" />
            <path d="M94 60 Q96 36 103 27 L116 29 Q114 45 113 60 Z" />
            <path class="membro fino" d="M110 37 L127 50 L146 47" />
            <circle cx="109" cy="19" r="7.5" />
            <path d="M88 16 Q109 -8 130 16 Q109 9 88 16 Z" />
          </g>
        </svg>
      </div>
      <span class="tv-feno" aria-hidden="true"><span class="feno-sombra"></span><span class="feno-pulo"><svg appFeno class="feno-gira"></svg></span></span>
      <div class="tv-cerca" aria-hidden="true"></div>

      <div class="tv-copy">
        <p class="tv-kicker">A travessia</p>
        <ol class="tv-falas">
          @for (f of falas; track f.texto; let i = $index) {
            <li class="tv-fala" [style.--de]="f.de" [style.--ate]="f.ate" [class.tv-fala-fim]="i === falas.length - 1">{{ f.texto }}</li>
          }
        </ol>
      </div>
      <div class="tv-trilha" aria-hidden="true"><span></span></div>
    </div>
  `,
})
export class Travessia {
  protected readonly falas = FALAS;
  protected readonly cactos = CACTOS;

  constructor() {
    const platform = inject(PlatformService), destroyRef = inject(DestroyRef);
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => {
      // "reduzir movimento": a cena fica parada no meio do caminho, sem acompanhar a rolagem
      if (platform.reduceMotion) { el.classList.add('still'); return; }
      let queued = false;
      const update = () => {
        queued = false;
        const r = el.getBoundingClientRect(), run = r.height - window.innerHeight;
        el.style.setProperty('--p', (run > 0 ? clamp(-r.top / run, 0, 1) : 0).toFixed(4));
      };
      const onScroll = () => { if (!queued) { queued = true; raf(update); } };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      destroyRef.onDestroy(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); });
    });
  }
}
