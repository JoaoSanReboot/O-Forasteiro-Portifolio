import { ChangeDetectionStrategy, Component } from '@angular/core';

// Casca do portfólio. A abertura e as seções entram a partir da fase 2 (ver o plano de migração).
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<main><h1>Em Busca do Forasteiro</h1><p>Migração para Angular em andamento.</p></main>`,
})
export class App {}
