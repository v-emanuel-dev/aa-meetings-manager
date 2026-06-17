# AA Meetings Manager

Aplicacao web pessoal para acompanhar reunioes de Alcoolicos Anonimos, registrar presencas, escrever reflexoes e visualizar estatisticas simples de evolucao.

## Tecnologias

- Angular 22.0.1 com componentes standalone
- TypeScript
- Angular Router
- Reactive Forms e Signals
- Tailwind CSS 4
- LocalStorage para persistencia inicial
- Icones em SVG no estilo Heroicons

## Funcionalidades

- Dashboard com proxima reuniao, estatisticas do mes, streak, reflexoes e grafico semanal.
- Agenda com cadastro, edicao, exclusao, filtro por mes e visualizacao em lista ou calendario simples.
- Controle de presenca com comparecimento, horario real de chegada e nota rapida.
- Diario de reflexoes com busca, ordenacao por data e associacao opcional a reunioes.
- Estatisticas com frequencia mensal/anual, media semanal, percentual de comparecimento e calendario de atividade.
- Configuracoes para tema claro/escuro, exportacao JSON, importacao JSON e limpeza confirmada dos dados.

## Como executar

Use uma versao de Node suportada pelo Angular 22, preferencialmente Node 22 LTS ou Node 24 LTS.

```bash
npm install
npm start
```

Depois acesse o endereco exibido pelo Angular CLI, normalmente `http://localhost:4200`.

## Validacao feita neste workspace

```bash
./node_modules/.bin/tsc --noEmit -p tsconfig.app.json
./node_modules/.bin/ngc -p tsconfig.app.json
```

As duas validacoes passam. Neste ambiente especifico, `ng build` abortou dentro do binario do `esbuild` ao usar Node `v26.3.0`, antes de reportar erros Angular. Isso indica problema de runtime/tooling, nao de compilacao TypeScript ou templates Angular.

## Estrutura

```text
src/app/
  core/models/
  core/services/
  shared/components/icon/
  features/dashboard/
  features/meetings/
  features/attendance/
  features/reflections/
  features/statistics/
  features/settings/
```
