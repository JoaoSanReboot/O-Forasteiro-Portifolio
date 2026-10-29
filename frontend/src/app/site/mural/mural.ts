import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';

// Procurado: o mural da vila, com o cartaz principal e os bilhetes em volta
@Component({
  selector: 'section[appMural]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sector wanted-sec', id: 'procurado', 'aria-labelledby': 't-mural' },
  templateUrl: './mural.html',
})
export class Mural {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const fit = () => this.fitPoster();
      fit();
      window.addEventListener('resize', fit);
      document.fonts?.ready.then(fit);
      destroyRef.onDestroy(() => window.removeEventListener('resize', fit));
    });
  }

  // cartaz: os títulos sempre cabem no papel
  fitPoster(): void {
    this.host.nativeElement.querySelectorAll<HTMLElement>('.p-top, .p-name').forEach((el) => {
      el.style.fontSize = '';
      let fs = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && fs > 18) { fs -= 1; el.style.fontSize = fs + 'px'; }
    });
  }
}
