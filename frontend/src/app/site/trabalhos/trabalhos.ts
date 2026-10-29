import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { SceneCanvas } from '../../shared/scene-canvas';

// II · Trabalhos: fichas da delegacia
@Component({
  selector: 'section[appTrabalhos]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector alt flip', id: 'trabalhos', 'aria-labelledby': 't-trabalhos' },
  templateUrl: './trabalhos.html',
})
export class Trabalhos {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  // só uma ficha aberta por vez (o name="fichas" já faz isso nos navegadores novos)
  protected onlyOne(e: Event): void {
    const d = e.target as HTMLDetailsElement;
    if (d.open) this.host.nativeElement.querySelectorAll('details').forEach((o) => { if (o !== d) o.open = false; });
  }
}
