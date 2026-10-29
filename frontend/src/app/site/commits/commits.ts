import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { PlatformService } from '../../core/platform.service';
import { HeatData, snapshotData } from '../../content/heat-snapshot';
import { SceneCanvas } from '../../shared/scene-canvas';

const fmtDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const at = (iso: string) => new Date(iso + 'T12:00:00');
const SNAPSHOT_LABEL = 'registro de outubro de 2026';

// IV · Commits: a placa do telégrafo acende dia por dia
@Component({
  selector: 'section[appCommits]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector alt flip', id: 'commits', 'aria-labelledby': 't-commits' },
  templateUrl: './commits.html',
})
export class Commits {
  private readonly reduceMotion = inject(PlatformService).reduceMotion;
  private readonly heatRef = viewChild.required<ElementRef<HTMLElement>>('heat');
  private readonly countRef = viewChild.required<ElementRef<HTMLElement>>('count');

  protected readonly data = signal<HeatData>(snapshotData());
  protected readonly tip = signal('Toque nos quadradinhos pra ver cada contribuição.');
  // a integração ao vivo com o GitHub entra na fase 5
  protected readonly status = signal(`Integração ao vivo com o GitHub ainda não configurada: mostrando o ${SNAPSHOT_LABEL}.`);

  /** a grade começa no domingo, como no GitHub */
  protected readonly pads = computed(() => Array.from({ length: at(this.data().days[0].date).getDay() }));
  protected readonly cells = computed(() => this.data().days.map((day) => {
    const l = day.level;
    const what = day.count == null ? (l ? 'dia com contribuições' : 'nenhuma contribuição') : day.count === 1 ? '1 contribuição' : `${day.count} contribuições`;
    return { date: day.date, level: l, label: `${fmtDay.format(at(day.date))}: ${what}` };
  }));
  protected readonly legend = computed(() => {
    const days = this.data().days;
    return [days[0], days[days.length - 1]].map((d) => { const x = at(d.date); return { month: fmtMonth.format(x).replace('.', ''), year: x.getFullYear() }; });
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const heat = this.heatRef().nativeElement;
      const cells = [...heat.querySelectorAll<HTMLButtonElement>('button')].map((b, i) => ({ b, l: this.data().days[i].level }));
      cells.forEach((c) => { if (c.l) c.b.style.setProperty('--d', (Math.random() * 3).toFixed(2) + 's'); });
      if (this.reduceMotion) { cells.forEach((c) => c.l && c.b.classList.add('on')); return; }
      destroyRef.onDestroy(this.animate(heat, cells));
    });
  }

  // uma varredura percorre o ano devagar; cada dia com commit acende e fica aceso (só na primeira vez)
  private animate(heat: HTMLElement, cells: { b: HTMLButtonElement; l: number }[]): () => void {
    const count = this.countRef().nativeElement, total = this.data().total;
    let visible = false, i = 0, lit = 0, wait = 0, last = performance.now(), raf = 0;
    const io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.3 });
    io.observe(heat);
    const SPEED = 42; // dias por segundo
    count.textContent = '0';
    const totalLv = cells.reduce((s, c) => s + c.l, 0) || 1;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (visible) {
        wait += dt * SPEED;
        while (wait >= 1 && i < cells.length) {
          wait -= 1;
          const c = cells[i];
          const prev = cells[i - 3]; if (prev) prev.b.classList.remove('scan');
          c.b.classList.add('scan');
          if (c.l) {
            c.b.classList.add('on', 'pop'); lit += c.l;
            count.textContent = String(Math.round(total * lit / totalLv));
            setTimeout(() => c.b.classList.remove('pop'), 700);
          }
          i++;
        }
        if (i >= cells.length) { cells.forEach((c) => c.b.classList.remove('scan')); count.textContent = String(total); io.disconnect(); return; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }
}
