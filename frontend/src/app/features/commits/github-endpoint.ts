import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/** endpoint da seção GitHub (a API .NET); null mostra o registro guardado. Os testes trocam por um valor próprio. */
export const GITHUB_ENDPOINT = new InjectionToken<string | null>('GITHUB_ENDPOINT', {
  providedIn: 'root',
  factory: () => environment.githubEndpoint,
});
