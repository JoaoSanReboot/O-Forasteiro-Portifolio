import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SKILL_SHELVES } from '../../content/skills';
import { SceneCanvas } from '../../shared/scene-canvas';

// III · Skills: as prateleiras do armeiro
@Component({
  selector: 'section[appSkills]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SceneCanvas],
  host: { class: 'sector', id: 'skills', 'aria-labelledby': 't-skills' },
  templateUrl: './skills.html',
})
export class Skills {
  protected readonly shelves = SKILL_SHELVES;
}
