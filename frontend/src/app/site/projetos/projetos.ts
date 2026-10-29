import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PlatformService } from '../../core/platform.service';
import { PROJECTS } from '../../content/projects';
import { Ctx } from '../../engine/core/canvas';
import { clamp } from '../../engine/core/math';
import { drawChest } from '../../engine/figures/chest';
import { R } from '../../engine/draw/primitives';
import { SceneCanvas } from '../../shared/scene-canvas';

interface Spark { x: number; y: number; vx: number; vy: number; life: number }

// I · Projetos: a ferraria e os baús em carrossel (fechar → deslizar para o lado → abrir)
@Component({
  selector: 'section[appProjetos]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector', id: 'projetos', 'aria-labelledby': 't-projetos' },
  templateUrl: './projetos.html',
})
export class Projetos {
  private readonly reduceMotion = inject(PlatformService).reduceMotion;
  private readonly mainBtn = viewChild.required<ElementRef<HTMLButtonElement>>('mainBtn');
  private readonly mainCv = viewChild.required<ElementRef<HTMLCanvasElement>>('mainCv');
  private readonly prevCv = viewChild.required<ElementRef<HTMLCanvasElement>>('prevCv');
  private readonly nextCv = viewChild.required<ElementRef<HTMLCanvasElement>>('nextCv');
  private readonly panelRef = viewChild.required<ElementRef<HTMLElement>>('panel');

  private readonly idx = signal(0);
  protected readonly isOpen = signal(false);
  protected readonly project = computed(() => PROJECTS[this.idx()]);
  /** o painel mostra o projeto de quando o baú foi aberto */
  protected readonly shown = signal(PROJECTS[0]);

  // estado quadro a quadro (fora dos Signals)
  private openK = 0;
  private opening = 0;
  private t = 0;
  private sparks: Spark[] = [];
  private visible = false;
  private turning = false;
  private closing: Promise<void> = Promise.resolve();
  private swipeX: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const [cMain, cPrev, cNext] = [this.mainCv(), this.prevCv(), this.nextCv()].map((r) => r.nativeElement.getContext('2d')!);
      [cMain, cPrev, cNext].forEach((g) => { g.imageSmoothingEnabled = false; });
      const io = new IntersectionObserver((es) => es.forEach((e) => { this.visible = e.isIntersecting; }), { threshold: 0.1 });
      io.observe(this.mainBtn().nativeElement.closest('.forge')!);
      let last = performance.now(), raf = 0;
      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (this.visible || this.t === 0) this.paint(cMain, cPrev, cNext, dt);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      destroyRef.onDestroy(() => { cancelAnimationFrame(raf); io.disconnect(); });
    });
  }

  private paint(cMain: Ctx, cPrev: Ctx, cNext: Ctx, dt: number): void {
    this.t += dt;
    if (this.opening) { this.openK = clamp(this.openK + this.opening * dt * (this.reduceMotion ? 99 : 2.6)); if (this.openK === 0 || this.openK === 1) this.opening = 0; }
    const tt = this.reduceMotion ? 1 : this.t, i = this.idx(), n = PROJECTS.length;
    drawChest(cMain, PROJECTS[i], this.openK, tt);
    this.sparks = this.sparks.filter((s) => (s.life += dt) < 1);
    for (const s of this.sparks) { s.x += s.vx; s.y += s.vy; s.vy += 0.02; R(cMain, s.x, s.y - this.openK * 6, 1, 1, s.life < 0.5 ? '#fff0b0' : '#e8b040'); }
    drawChest(cPrev, PROJECTS[(i + n - 1) % n], 0, tt);
    drawChest(cNext, PROJECTS[(i + 1) % n], 0, tt);
  }

  protected toggle(): void { if (!this.turning) this.setOpen(!this.isOpen()); }

  protected closeButton(): void { if (!this.turning) { this.setOpen(false); this.mainBtn().nativeElement.focus(); } }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') { e.preventDefault(); void this.go(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); void this.go(1); }
    if (e.key === 'Escape' && !this.panelRef().nativeElement.hidden) { this.setOpen(false); this.mainBtn().nativeElement.focus(); }
  }

  protected swipeStart(e: PointerEvent): void { this.swipeX = e.clientX; }
  protected swipeEnd(e: PointerEvent): void {
    if (this.swipeX !== null && Math.abs(e.clientX - this.swipeX) > 50) void this.go(e.clientX < this.swipeX ? 1 : -1);
    this.swipeX = null;
  }

  private setOpen(on: boolean, keepSpace = false): void {
    const panel = this.panelRef().nativeElement;
    this.opening = on ? 1 : -1; this.isOpen.set(on);
    if (on) {
      this.shown.set(this.project());
      for (let i = 0; i < 18; i++) this.sparks.push({ x: 32 + (Math.random() - 0.5) * 30, y: 22, vx: (Math.random() - 0.5) * 0.8, vy: -0.6 - Math.random() * 1.2, life: 0 });
      setTimeout(() => {
        if (this.opening >= 0) { panel.hidden = false; panel.style.visibility = ''; panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in'); }
      }, this.reduceMotion ? 0 : 380);
    } else this.closing = this.closePanel(keepSpace);
  }

  // o painel recolhe junto com a tampa, em vez de sumir de uma vez
  private closePanel(keepSpace: boolean): Promise<void> {
    const panel = this.panelRef().nativeElement;
    if (panel.hidden) return Promise.resolve();
    panel.classList.remove('in');
    const done = () => { if (this.isOpen()) return; if (keepSpace) panel.style.visibility = 'hidden'; else { panel.hidden = true; panel.style.visibility = ''; } };
    if (this.reduceMotion || !panel.animate) { done(); return Promise.resolve(); }
    const a = panel.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-34px) scale(0.9)' }], { duration: 360, easing: 'cubic-bezier(.5, 0, .75, 0)' });
    return a.finished.then(done).catch(done);
  }

  private lidShut(): Promise<void> {
    return new Promise((res) => {
      const t0 = performance.now();
      const check = () => { if ((this.openK === 0 && this.opening <= 0) || performance.now() - t0 > 1000) res(); else requestAnimationFrame(check); };
      check();
    });
  }

  // fechar → deslizar para o lado → abrir: cada etapa espera a anterior terminar
  protected async go(d: number): Promise<void> {
    if (this.turning) return;
    this.turning = true;
    try {
      const wasOpen = this.isOpen() || this.opening > 0;
      if (wasOpen) { this.setOpen(false, true); await Promise.all([this.closing, this.lidShut()]); }
      const cv = this.mainCv().nativeElement;
      const sides = [this.prevCv().nativeElement, this.nextCv().nativeElement];
      const dir = d > 0 ? -1 : 1;
      const dur = this.reduceMotion || !cv.animate ? 0 : 300;
      let outs: Animation[] = [];
      if (dur) {
        outs = sides.map((c) => c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${dir * 28}px)` }], { duration: dur, easing: 'ease-in', fill: 'forwards' }));
        const half = cv.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${dir * 90}px)` }], { duration: dur, easing: 'ease-in', fill: 'forwards' });
        outs.push(half);
        await half.finished;
      }
      // com o baú fora de cena, troca o projeto: nada de dois projetos ao mesmo tempo
      this.idx.update((i) => (i + d + PROJECTS.length) % PROJECTS.length);
      if (dur) {
        await new Promise((r) => requestAnimationFrame(r));
        const back = cv.animate([{ opacity: 0, transform: `translateX(${-dir * 90}px)` }, { opacity: 1, transform: 'none' }], { duration: dur + 80, easing: 'ease-out' });
        const sideIn = sides.map((c) => c.animate([{ opacity: 0, transform: `translateX(${-dir * 28}px)` }, { opacity: 1, transform: 'none' }], { duration: dur + 80, easing: 'ease-out' }));
        outs.forEach((a) => a.cancel());
        await Promise.all([back.finished, ...sideIn.map((a) => a.finished)]);
      }
      if (wasOpen) { await new Promise((r) => setTimeout(r, this.reduceMotion ? 0 : 140)); this.setOpen(true); }
    } finally { this.turning = false; }
  }
}
