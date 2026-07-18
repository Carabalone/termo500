# Termo500

Jogo diário mobile-first em português brasileiro: as letras não revelam suas cores; apenas os totais de letras certas, presentes e ausentes são exibidos.

## Desenvolvimento

Requer Node.js 18 ou superior.

```sh
npm install
npm run dev
npm test
npm run build
```

O resultado em `dist/` é um site estático. Configure a hospedagem para servir `index.html` na raiz; as partidas de arquivo usam query strings e não exigem regras especiais de rota.

## Dados e calendário

- A data de desenvolvimento/publicação padrão é `2026-07-18` (`src/game.ts`). Antes de publicar em outra data, altere `EPOCH` e gere uma nova programação.
- A programação é estável pela ordem de `ANSWERS` em `src/corpus.ts`. Novas respostas devem ser acrescentadas ao fim; reordenar entradas muda puzzles já publicados.
- `src/corpus.ts` contém formas revistas e uma base sintética determinística para a versão inicial. Antes de uma publicação editorial, substitua a base sintética pelo pipeline de importação do dicionário Hunspell pt_BR do LibreOffice, fixe a revisão e preserve os arquivos de licença e atribuição do upstream.
- Colisões de normalização devem manter uma única grafia canônica. Toda resposta deve continuar presente na lista de palpites.

O armazenamento usa a chave versionada `termo500.games.v2` no `localStorage`. Não há contas nem sincronização remota.
