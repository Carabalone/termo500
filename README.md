# Termo500

Jogo diário mobile-first em português brasileiro: as letras não revelam suas cores; apenas os totais de letras certas, presentes e ausentes são exibidos.

## Desenvolvimento

Requer Node.js 18 ou superior.

```sh
npm install
npm run corpus:check
npm test
npm run build
```

O resultado em `dist/` é um site estático. Partidas de arquivo e infinitas usam query strings, sem regras especiais de rota.

## Léxico 2026.07.20

O jogo usa duas camadas independentes:

- `assets/generated/guesses.txt`: formas aceitas como palpite, incluindo flexões verbais;
- `assets/generated/answers.json`: respostas editoriais com ID estável, grafia, lema, classe, frequência quando conhecida, família, origem e justificativa.

Nunca edite arquivos em `assets/generated/` diretamente. Decisões manuais ficam em `assets/editorial/allow.tsv` e `deny.txt`; execute `npm run corpus:build` e revise `assets/generated/report.json`. `npm run corpus:check` confirma que a geração é determinística.

A versão atual tem 10.589 palpites e 1.264 respostas. A qualidade editorial tem prioridade sobre a meta indicativa de 2.500–6.000 respostas. A seed local é um snapshot de transição do corpus anterior, identificado por SHA-256 no relatório. O pipeline está isolado para receber o PortiLexicon-UD (CC BY 4.0) como fonte morfológica e `wordfreq` como sinal de familiaridade; esses dados externos ainda não são redistribuídos neste repositório. Ao incorporá-los, registre versão, URL, licença e checksum no relatório antes de publicar.

Parâmetros editoriais previstos: Zipf ≥ 3,5 para candidatura automática, 3,0–3,49 para revisão e abaixo de 3,0 somente como palpite, salvo override. Frequência não substitui filtros morfológicos. Palavras sensíveis podem ser palpites, mas não respostas.

## Calendário e infinito

O epoch permanece `2026-07-18`. `assets/generated/schedule.json` congela explicitamente `TERMO`, `SUÍTE` e `ÁVIDO` em 18–20 de julho de 2026 e materializa vinte anos de datas futuras; alterações no léxico não reescrevem esse calendário.

O modo infinito usa uma sacola embaralhada em `termo500.infinite-bag.v1`: cada resposta sai uma vez por ciclo, o estado sobrevive a recarregamentos e atualizações do corpus acrescentam apenas palavras ainda não vistas ao ciclo corrente. As últimas vinte famílias são evitadas quando há alternativa. Links novos usam IDs opacos estáveis; links numéricos antigos continuam resolvidos contra a ordem legada.

Partidas e estatísticas continuam em `termo500.games.v2` no `localStorage`. Não há contas nem sincronização remota.

## Fontes planejadas

- [PortiLexicon-UD](https://portilexicon.icmc.usp.br/) — morfologia PT-BR, CC BY 4.0.
- [wordfreq](https://github.com/rspeer/wordfreq) — estimativa de familiaridade (dados até aproximadamente 2021; consultar a licença de cada distribuição usada).
- Kaikki/Wiktionary e Hunspell/LibreOffice — somente fontes complementares, com atribuição e licença registradas por snapshot.
