import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SceneCanvas } from '../../shared/scene-canvas';

// V · Formação: diplomas da escola
@Component({
  selector: 'section[appFormacao]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector', id: 'formacao', 'aria-labelledby': 't-formacao' },
  templateUrl: './formacao.html',
})
export class Formacao {}
