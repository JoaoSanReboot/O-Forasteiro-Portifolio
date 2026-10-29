import { Provider } from '@angular/core';
import { GITHUB_ENDPOINT } from '../app/site/commits/github-endpoint';

// Provedores de todos os testes. O ng test usa o build de desenvolvimento, que aponta a placa para a API local:
// aqui ela fica desligada, para nenhum teste sair para a rede (commits.spec.ts liga com um fetch falso).
const providers: Provider[] = [{ provide: GITHUB_ENDPOINT, useValue: null }];
export default providers;
