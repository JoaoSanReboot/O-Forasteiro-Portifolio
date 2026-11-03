import { afterNextRender, ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, Injector, PendingTasks, signal, viewChild } from '@angular/core';
import { PlatformService } from '../../core/platform/platform.service';
import { HeatData, snapshotData } from '../../content/heat-snapshot';
import { SceneCanvas } from '../../shared/scene-canvas/scene-canvas';
import { cancelRaf, raf } from '../../engine/core/browser';
import { GITHUB_ENDPOINT } from './github-endpoint';
import { fetchLiveHeat } from './github-heat.source';

const fmtDay = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtMonth = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
const at = (iso: string) => new Date(iso + 'T12:00:00');
const SNAPSHOT_LABEL = 'registro de outubro de 2026';

interface Cell { b: HTMLButtonElement; l: number }

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
  private readonly endpoint = inject(GITHUB_ENDPOINT);
  private readonly injector = inject(Injector);
  private readonly pendingTasks = inject(PendingTasks);
  private readonly heatRef = viewChild.required<ElementRef<HTMLElement>>('heat');
  private readonly countRef = viewChild.required<ElementRef<HTMLElement>>('count');

  protected readonly data = signal<HeatData>(snapshotData());
  protected readonly tip = signal('Toque nos quadradinhos pra ver cada contribuição.');
  protected readonly status = signal(this.endpoint
    ? 'Consultando o GitHub pelo telégrafo...'
    : `Integração ao vivo com o GitHub ainda não configurada: mostrando o ${SNAPSHOT_LABEL}.`);

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

  // estado quadro a quadro da varredura (fora dos Signals): os botões da grade atual e se ela já terminou
  private heatCells: Cell[] = [];
  private scanDone = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    // só no navegador: o prerender sai com o registro guardado
    afterNextRender(() => {
      this.collectCells();
      if (this.reduceMotion) { this.scanDone = true; this.heatCells.forEach((c) => c.l && c.b.classList.add('on')); }
      else destroyRef.onDestroy(this.animate());
      if (this.endpoint) destroyRef.onDestroy(this.liveHeat(this.endpoint));
    });
  }

  // a grade (re)feita começa apagada, salvo se a varredura já terminou
  private collectCells(): void {
    const days = this.data().days;
    this.heatCells = [...this.heatRef().nativeElement.querySelectorAll<HTMLButtonElement>('button')].map((b, i) => ({ b, l: days[i].level }));
    this.heatCells.forEach(({ b, l }) => {
      b.classList.remove('on', 'scan', 'pop');
      if (l) b.style.setProperty('--d', (Math.random() * 3).toFixed(2) + 's'); else b.style.removeProperty('--d');
      if (l && (this.scanDone || this.reduceMotion)) b.classList.add('on');
    });
    this.countRef().nativeElement.textContent = String(this.data().total);
  }

  // integração ao vivo (github-heat.source.ts): em qualquer falha a placa segue com o registro guardado
  private liveHeat(endpoint: string): () => void {
    const ctrl = new AbortController();
    const done = this.pendingTasks.add();
    fetchLiveHeat(endpoint, ctrl.signal)
      .then((live) => {
        if (!live) { this.status.set(`O GitHub não mandou dados agora: mostrando o ${SNAPSHOT_LABEL}.`); return; }
        this.data.set(live.data);
        afterNextRender(() => this.collectCells(), { injector: this.injector });
        this.status.set(`Ao vivo do GitHub · atualizado em ${live.fetchedAt.toLocaleDateString('pt-BR')}.`);
      })
      .catch(() => { if (!ctrl.signal.aborted) this.status.set(`Sem sinal do GitHub agora: mostrando o ${SNAPSHOT_LABEL}.`); })
      .finally(done);
    return () => ctrl.abort();
  }

  // uma varredura percorre o ano devagar; cada dia com commit acende e fica aceso (só na primeira vez).
  // Lê a grade atual a cada quadro: se os dados ao vivo chegarem no meio, ela segue na grade nova.
  private animate(): () => void {
    const heat = this.heatRef().nativeElement, count = this.countRef().nativeElement;
    let visible = false, i = 0, lit = 0, wait = 0, last = performance.now(), frameId = 0;
    const io = new IntersectionObserver((es) => es.forEach((e) => { visible = e.isIntersecting; }), { threshold: 0.3 });
    io.observe(heat);
    const SPEED = 42; // dias por segundo
    count.textContent = '0';
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (visible) {
        const cells = this.heatCells, total = this.data().total;
        const totalLv = cells.reduce((s, c) => s + c.l, 0) || 1;
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
        if (i >= cells.length) { cells.forEach((c) => c.b.classList.remove('scan')); this.scanDone = true; count.textContent = String(total); io.disconnect(); return; }
      }
      frameId = raf(tick);
    };
    frameId = raf(tick);
    return () => { cancelRaf(frameId); io.disconnect(); };
  }
}
