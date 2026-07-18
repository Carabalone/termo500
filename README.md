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
- A programação é estável pela ordem de `assets/words.txt`. Reordenar entradas muda puzzles já publicados.
- `assets/words.txt` é tanto a lista de palpites válidos quanto a lista de respostas possíveis. `assets/accents.txt` preserva a grafia exibida quando ela difere da forma normalizada.
- O corpus foi obtido do JavaScript do Termo no navegador. Os arquivos derivados podem ser regenerados com `python3 scripts/build_corpus.py`.

O armazenamento usa a chave versionada `termo500.games.v2` no `localStorage`. Não há contas nem sincronização remota.
