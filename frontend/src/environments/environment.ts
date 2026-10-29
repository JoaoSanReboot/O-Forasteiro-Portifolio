// Configuração do site publicado (substitui window.VILA_GH_ENDPOINT e window.VILA_DUEL_MUSIC do legado).
export interface Environment {
  /** endpoint da placa do GitHub; null mostra o registro guardado */
  githubEndpoint: string | null;
  /** faixa licenciada para o duelo; null mantém a trilha sintetizada */
  duelMusicUrl: string | null;
}

export const environment: Environment = {
  // ligado na fase 5, quando a API estiver publicada no Azure App Service
  githubEndpoint: null,
  duelMusicUrl: null,
};
