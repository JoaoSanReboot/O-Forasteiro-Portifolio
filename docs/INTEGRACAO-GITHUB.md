# Placa do telégrafo: contribuições ao vivo do GitHub

O calendário de contribuições só existe na API GraphQL do GitHub, e ela exige um token.
Por isso a busca acontece num endpoint de servidor (`api/github-contributions.js`), nunca no navegador.

## O que você precisa fazer

1. Criar um token fine-grained no GitHub (Settings → Developer settings → Fine-grained tokens),
   com acesso só de leitura a repositórios públicos. Nenhuma permissão extra é necessária.
2. No projeto da Vercel, em Settings → Environment Variables, criar:
   - `GITHUB_TOKEN` = o token criado acima
   - `GITHUB_LOGIN` = `JoaoSanReboot` (opcional; já é o padrão)
3. Na página publicada, antes do script do site, ligar o endpoint:

   ```html
   <script>window.VILA_GH_ENDPOINT = "/api/github-contributions";</script>
   ```

## Como a placa se comporta

- Sem `VILA_GH_ENDPOINT` (como no protótipo): mostra o registro de outubro de 2026 e avisa que a integração não está configurada.
- Carregando: "Consultando o GitHub pelo telégrafo...".
- Falha de rede ou do GitHub: volta para o registro guardado e avisa "Sem sinal do GitHub agora".
- GitHub sem dados: avisa e mantém o registro guardado.
- Sucesso: a grade é refeita com os dias reais (com a contagem de cada dia no clique) e mostra a data da atualização.
