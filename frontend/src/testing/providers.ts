import { Provider } from '@angular/core';
import { GITHUB_ENDPOINT } from '../app/features/commits/github-endpoint';
import { provideScenes } from '../app/features/site/scene-host';

// Provedores de todos os testes. O ng test usa o build de desenvolvimento, que aponta a placa para a API local:
// aqui ela fica desligada, para nenhum teste sair para a rede (commits.spec.ts liga com um fetch falso).
// As cenas recebem do site o estado de jogo, como em app.config.ts.
const providers: Provider[] = [{ provide: GITHUB_ENDPOINT, useValue: null }, ...provideScenes()];
export default providers;
