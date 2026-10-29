# Trilha sonora: origem e licença

As três trilhas do portfólio são composições originais deste projeto, sintetizadas em tempo real
pelo navegador com a Web Audio API (osciladores, filtros e ruído). Não há arquivos de áudio,
samples ou gravações de terceiros, então não há licença externa a cumprir.

| Momento | Clima | Instrumentação (sintetizada) |
|---|---|---|
| Cavalgada | Lá menor, 104 BPM, enérgica | violão dedilhado em tercinas, pocotó de bloco de madeira, baixo, bumbo, assobio |
| Vilarejo | Sol maior, valsa lenta a 80 BPM | violão dedilhado, gaita ao longe, assobio suave, vento baixo |
| Duelo | Lá menor parado, 66 BPM | bordão grave, sino, batida de coração, guitarra com vibrato, assobio solitário |

As referências enviadas (vídeos do YouTube e o estilo de Ennio Morricone) serviram só como
direção de clima. Nenhuma melodia, gravação ou trecho delas foi copiado.

## Se quiser trocar por faixas licenciadas

Use apenas faixas com licença explícita para uso em sites públicos (por exemplo CC0, CC BY com
crédito, ou licença comercial comprada). Guarde o arquivo e o texto da licença junto do projeto,
e registre aqui: título, autor, link da licença e o crédito exigido.

## Espaço preparado para a trilha do duelo

A referência enviada para o duelo (vídeo do YouTube `XZ9BYXXg2MY`) não teve a licença confirmada,
então ela não foi baixada nem incorporada. O duelo continua com a trilha original sintetizada.

Para usar uma faixa licenciada no lugar, publique o arquivo junto do site e defina, antes do script do site:

```html
<script>window.VILA_DUEL_MUSIC = "/audio/duelo.mp3";</script>
```

A faixa entra e sai com a mesma transição suave das outras trilhas, toca em loop durante o duelo
e respeita o alto-falante (mudo e volume geral). Se o arquivo não carregar, a trilha sintetizada segue tocando.
Registre aqui o título, o autor e o link da licença.
