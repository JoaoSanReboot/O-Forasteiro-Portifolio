// Configuração do site publicado (substitui window.VILA_GH_ENDPOINT e window.VILA_DUEL_MUSIC do legado).
// Fica num arquivo próprio porque o build de desenvolvimento troca environment.ts pelo .development.ts.
export interface Environment {
  /** endpoint da placa do GitHub; null mostra o registro guardado */
  githubEndpoint: string | null;
  /** faixa licenciada para o duelo; null mantém a trilha sintetizada */
  duelMusicUrl: string | null;
}
