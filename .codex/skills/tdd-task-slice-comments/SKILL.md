---
name: tdd-task-slice-comments
description: Treats backlog task completion or task-scoped increments as test-driven milestones — run the smallest full pyramid of Vitest/unit, component and route/integration tests touching that slice, plus update tests in the same change. Requires heavily explanatory Portuguese comments on new or changed logic so a beginner can follow every decision. Use when a backlog card is shipped end-to-end, when an increment narrows to one task/feature, when the user requests TDD, or alongside tests-required when coverage must prove the slice.
---

# TDD por tarefa + comentários para aprendizagem

Ao fechar uma tarefa de **backlog** **ou** entregar um **incremento claramente limitado à mesma tarefa**, trabalha como se o critério de aceitação principal fosse: **«o que prova isto continuamente em testes, com explicações no código?»**.

## Ordem obrigatória (programação orientada a testes)

1. **Ler** o pedido ou o cartão da tarefa e listar comportamentos observáveis (entradas, saídas, erros esperados).
2. **Escrever ou atualizar testes primeiro** sempre que tal seja aplicável ao tipo de trabalho — ou, no mesmo commit/PR que o código novo, garantir que **nenhuma alteração importante fica só em produção**.
3. **Implementar** o mínimo para os testes passarem sem fraude (sem mocks que escondem o comportamento pedido).
4. **Escalar a pirâmide de testes na fatia**, sem largar até cobrir todas as categorias pertinentes ao que mudaste:
   - **Unitários** (`vitest` em helpers, `lib/`, formatadores, regras puras relacionadas à tarefa).
   - **Componentes** (`*.test.tsx`/rendering/handlers que demonstram estado e interação da parte da UI da tarefa).
   - **Rotas ou integração** chamadas quando a tarefa toca handlers `app/api/**`, Server Actions, ou fluxos request→response já testados neste projeto.
5. **Executar comandos**: começar por `pnpm test:run` filtrados ao fichiers da tarefa **ou** padrões de nome relacionados — se o ambiente suportar, correr **`pnpm build`** apenas quando mudanças puderem quebrar o bundle (rotas imports cruzados ou tipos estruturais).
6. Se algum nível não for realizável por limitação real (browser-only, secreto Firebase, etc.), documenta **em voz alta** por que falta esse nível **e** deixa teste próximo máximo (por exemplo spy em camada já existente ou contract test parcial).

## Fecho de «tarefa ao fim» vs «incremento»

- **Fim da tarefa**: assumir regressão aceitável = zero até à fatia; confirmar pelo menos uma prova por camada mencionada acima sempre que tecnologicamente possível para essa mudança.
- **Incremento parcial dentro da mesma tarefa**: mesma régua mas **marcar nos comentários** (bloco inicial no topo do ficheiro ou secção próxima da alteração)
  - o que ficou já entregue;
  - o que falta antes de considerares a backlog item «done».

## Conflito com outros modos compactos — esta skill ganha quando invocada

Quando utilizares esta skill ao lado de políticas mais «minimalistas», as **instruções abaixo de comentários** têm prioridade **para código tocado pela tarefa**.

## Comentários «super explicativos» (obrigatórios onde mexes)

Objetivo: **uma pessoa iniciante deve conseguir ler o ficheiro e perceber o «porquê» de cada bloco funcionar**, não só o «o quê».

- Usa **português** nos comentários, exceto termos técnidos inevitáveis (props, hook, SSR).
- **Antes de blocos decisivos**, explica em 2–6 linhas: contexto da tarefa, decisão principal, caso de borda tratado ou explícito.
- **Nas condições, ramificações `if`/`switch`, laços não triviais**, e **após código assíncrono**, explica causa–efeito (ex.: «se falhar primeiro tentamos fallback X porque …»).
- **Depois de `return`/`throw` que afetem UX/API**, menciona consequência utilizador ou cliente.
- Em **tipo genéricos e props extensos**, pode haver uma tabela rápida em comentário de bloco («Parâmetro / Significado») em vez comentário por vírgula.
- **Imports e linhas triviais repetitivas não precisam de comentário linha-a-linha** — agrupa com um só comentário curto («Importações relacionadas aos testes e ao schema X»).

Evita apenas:

- repetir texto da língua de programação («isto incrementa `i`») sem valor pedagógico;
- secrets ou dados reais nos comentários.

## Harmonização interna ao repositório

- `AGENTS.md` e skill `tests-required` continuam válidos para **todas** as alterações — esta skill adiciona a **orientação pirâmide completa na fatia** e o **contrato pedagógico de comentários**.
- Mantém `.codex/skills/ceiscaramulo-scope-guard` sempre que correras risco de alargares o escopo apenas para «encaixar testes» ou comentários desnecessários fora da tarefa.

## Definição de pronto («done» técnico)

Uma mudança de tarefa não está pronta enquanto:

- existir lacuna óbvia de tipo de teste relevante não justificada; **ou**
- o código novo/alterado carecer das explicações pedagógicas descritas; **ou**
- os testes associados não tiverem sido executados onde o SDK/shell permite.
