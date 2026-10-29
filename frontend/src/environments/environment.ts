import { Environment } from './environment.model';

export const environment: Environment = {
  // null mantém a placa no registro guardado. Com a API publicada no Azure App Service, troque pela URL dela
  // (ex.: 'https://<app>.azurewebsites.net/api/github/contributions'); veja docs/INTEGRACAO-GITHUB.md
  githubEndpoint: null,
  duelMusicUrl: null,
  skipIntro: false,
};
