// Configuração do site publicado.
// Fica num arquivo próprio porque o build de desenvolvimento troca environment.ts pelo .development.ts.
export interface Environment {
  /** endpoint da placa do GitHub; null mostra o registro guardado */
  githubEndpoint: string | null;
  /** faixa licenciada para o duelo; null mantém a trilha sintetizada */
  duelMusicUrl: string | null;
  /** pula a abertura e entra direto no site (só para desenvolvimento) */
  skipIntro: boolean;
}
