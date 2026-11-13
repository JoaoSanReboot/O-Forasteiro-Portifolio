import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PROJECTS } from '../../content/projects';
import { PlatformService } from '../../core/platform/platform.service';
import { cancelRaf, raf } from '../../engine/core/browser';
import { lerp } from '../../engine/core/math';
import { Reveal } from '../../shared/reveal/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

// 02 · Projetos: um índice em linhas grandes. Passando o mouse, a linha se pinta de tinta
// e a imagem do projeto acompanha o cursor com um atraso macio. No toque, a imagem vem na própria linha.
@Component({
  selector: 'section[appProjetos]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHead, Reveal],
  host: { class: 'sec projetos', id: 'projetos', 'aria-labelledby': 't-projetos' },
  template: `
    <div class="wrap">
      <header appSectionHead num="02" label="Projetos" title="Feitos a" accent="ferro e fogo." [aside]="count" emblem="ferro" titleId="t-projetos"></header>
      <ol class="works" #list (pointermove)="move($event)" (pointerleave)="hover.set(-1)">
        @for (w of projects; track w.name; let i = $index) {
          <li class="work" appReveal [revealDelay]="i">
            <a class="work-link" [href]="w.href" target="_blank" rel="noopener" (pointerenter)="hover.set(i)" (focus)="hover.set(i)" (blur)="hover.set(-1)">
              <span class="work-num">{{ w.num }}</span>
              <span class="work-thumb"><img [src]="w.img" [alt]="w.alt" loading="lazy"></span>
              <span class="work-main">
                <span class="work-name">{{ w.name }}</span>
                <span class="work-title">{{ w.title }}@if (w.wip) { <i class="tag">Em desenvolvimento</i> }</span>
              </span>
              <span class="work-desc">{{ w.desc }}</span>
              <span class="work-side">
                <span class="work-chips">{{ w.chips.join(' · ') }}</span>
                <span class="work-go">{{ w.action }}<span class="go-arrow" aria-hidden="true">↗</span><span class="sr-only"> (abre em outra aba)</span></span>
              </span>
            </a>
          </li>
        }
      </ol>
    </div>
    <div class="work-preview" #preview aria-hidden="true" [class.on]="hover() >= 0">
      @for (w of projects; track w.name; let i = $index) { <img [src]="w.img" alt="" [class.on]="hover() === i" loading="lazy"> }
    </div>
  `,
})
export class Projetos {
  protected readonly projects = PROJECTS;
  protected readonly count = `${String(PROJECTS.length).padStart(2, '0')} obras`;
  protected readonly hover = signal(-1);
  private readonly preview = viewChild.required<ElementRef<HTMLElement>>('preview');
  private target = { x: 0, y: 0 };
  /** só ganha corpo com mouse (no toque a imagem já está na linha) */
  protected move: (e: PointerEvent) => void = () => {};

  constructor() {
    const destroyRef = inject(DestroyRef), platform = inject(PlatformService);
    afterNextRender(() => {
      if (!platform.finePointer) return;
      const el = this.preview().nativeElement;
      const pos = { x: 0, y: 0 };
      let frame = 0, first = true;
      // a imagem persegue o cursor (lerp) e inclina de leve na direção em que ele corre
      const tick = () => {
        const dx = this.target.x - pos.x;
        pos.x = lerp(pos.x, this.target.x, 0.14); pos.y = lerp(pos.y, this.target.y, 0.14);
        const tilt = Math.max(-8, Math.min(8, dx * 0.04));
        el.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
        frame = Math.abs(dx) > 0.3 || Math.abs(this.target.y - pos.y) > 0.3 ? raf(tick) : 0;
      };
      this.move = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        this.target = { x: e.clientX, y: e.clientY };
        if (first) { pos.x = e.clientX; pos.y = e.clientY; first = false; }
        if (!frame) frame = raf(tick);
      };
      destroyRef.onDestroy(() => cancelRaf(frame));
    });
  }
}
