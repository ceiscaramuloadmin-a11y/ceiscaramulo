---
name: notion-to-fix-first
description: Ensures CEISCaramulo work follows the Tasks Tracker backlog with absolute priority on Notion Status = To Fix before any Not started or In progress work. Mandates fetching each task row’s Description, Summary, Task type, comments, due date, Priority, Assignee and page body notes. Use when syncing with database https://www.notion.so/3542aa44c5a980b884d3f99a3efae522, when the user mentions To Fix / hotfix / regressão urgente em Notion, or when balancing multiple tasks alongside tests-required / ceiscaramulo-scope-guard.
---

# Notion «To Fix» — prioridade obrigatória

## Âmbito da base de dados

- Base de trabalho habitual: **[Tasks Tracker](https://www.notion.so/3542aa44c5a980b884d3f99a3efae522)** (`Tasks Tracker`).
- O campo **`Status`** inclui o estado **`To Fix`** (corrigir antes de novo desenvolvimento “normal”).
- Esta skill aplica-se a qualquer sessão onde o trabalho deve alinhar com o quadro desta base ou com tarefas nela mencionadas.

## Regra de ordenação

1. **Antes de** implementar backlog, increments em **Not started**, ou continuar trabalho já em **In progress**, faz o seguinte:
   - Lista ou consulta todas as páginas com **`Status = To Fix`** nessa mesma coleção/data source da base.
   - Se existir **pelo menos uma** linha neste estado, executa primeiro essas tarefas **por ordem**:
     depois **`Priority`** (High → Medium → Low), depois **`Due date`** ascendente quando existir, depois título/`Task name`.
2. Enquanto houver **`To Fix` non finalizadas**, **não iniciar ou expandir escopo em outras tarefas** que não sirvam para desbloquear ou testar esse fix (exceto pedido expresso do utilizador que cancele esta precedência nesta sessão).

## Como ler cada cartão (`máxima atenção`)

Para **cada** tarefa, independentemente do estado (**To Fix**, **Not started**, **In progress**, **Done** só para auditoria regressiva):

- **`Task name`** (título) — critério de aceitação sintético; não reinventar objetivos diferentes do título quando o texto do cartão já é claro.
- **`Description`** (propriedade texto) — requisitos, passos, links, payloads; tratá‑la como **fonte oficial** igual ou superior aos comentários no chat.
- **`Summary`** — contexto rápido (ex.: tema produto Hero, Backoffice…); usar para agrupamento e para não regressar zonas relacionadas à cegas.
- **`Task type`** (Bug / Feature / Polish) — bugs esperam regressão dirigida ou testes que falhavam antes; features seguem mesmo rigor mas com critérios de comportamento público.
- **Corpo da página da tarefa** (notas, toggles, anexos) — usar `fetch` no Notion da página antes de declarar falta de informação quando o cartão tiver conteúdo corpo não vazio.
- **Comentários da página** (`get_comments`) — ler para bloqueadores, QA repro e decisões já tomadas; não duplicar discussão ignorando o histórico.
- **`Due date`** e **`Assignee`** — respeitar prazos e ownership quando existirem; não reatribuir em silêncio.
- **`Fila`** (Backlog / Execução) — não prevalecer sobre **`To Fix`**: um bug em backlog continua primeiro se **`Status`** for **`To Fix`**.

## Ciclo esperado sobre uma tarefa **To Fix**

1. Ler propriedades + corpo + comentários (com ferramentas Notion MCP quando na cloud).
2. Reproduzir mentalmente ou com testes o sintoma quando possível (`tests-required`; bug fix com teste que falhasse sem o patch).
3. Implementar só o fix justificado pela descrição e comentários; manter **`ceiscaramulo-scope-guard`**.
4. Atualizar o Notion (**`Status`**, notas rápidas se necessário) para refletir o estado real assim que o trabalho estiver aceite e testado nesta sessão.
5. Só **depois** voltar ao resto do quadro (Not started / In progress).

## Harmonização com o repositório

- **`tests-required`** — sempre que mudar comportamento; bugs em **`To Fix`** precisam de prova regressiva sempre que aplicável.
- **`tdd-task-slice-comments`** — quando também quiser comentários pedagógicos e pirâmide de testes na fatia da tarefa.
- **`backoffice-content-regressions`** — quando **`To Fix`** apontar para sessão admin ou rich‑text público.

## Mensagem obrigatória ao utilizador

Se não for possível aceder ao Notion (MCP indisponível, sem permissão, ou base movida), dizer **explicitamente** que não foi possível confirmar o conjunto **`To Fix`** e pedir **dump** do título + descrição + comentários relevantes **ou** link da vista filtrada por **`To Fix`**, em vez de assumir que não há hotfixes pendentes.
