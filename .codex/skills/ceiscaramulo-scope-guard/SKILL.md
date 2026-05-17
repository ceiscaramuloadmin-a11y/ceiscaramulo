---
name: ceiscaramulo-scope-guard
description: Limits agent changes to CEIS Caramulo’s intended product surface — Next.js App Router site, CMS-rich public pages, Prisma-backed data, and Firebase/admin flows — and blocks scope creep that introduces regressions or unnecessary churn. Use when implementing features, fixing bugs, refactoring, “cleaning up,” upgrading deps, redesigning UX, touching backoffice/session/rich-text, or whenever the agent might widen scope beyond the user’s ask.
---

# CEIS Caramulo — Scope and Essence Guard

Keep work aligned with **what this app is**, not what a generic greenfield tutorial would suggest.

## Product essence (do not redefine)

This repository is primarily:

- **Public site**: Next.js (App Router) pages for institucional / conteúdo público — navigation, biblioteca, atividades, notícias, hero e branding já estabelecidos no código.
- **Conteúdo**: Texto rico e CMS-like flows; público deve continuar a renderização segura e consistente (ver `prepareRichTextForRender` onde aplicável — skill `backoffice-content-regressions`).
- **Persistência**: Prisma sobre Postgres onde o modelo já existe; migrações e schema são cirúrgicas.
- **Admin / sessão**: Rotas Firebase/admin e cliente do backoffice; não quebrar boot de sessão ou contratos das APIs já usadas pela UI administrativa.

Se uma alteração parecer redesenhar o produto completo ou um subsistema maior do que o pedido, **parar** e propor um plano mínimo em vez de avançar.

## Regras de execução (obrigatórias)

1. **Um pedido, um resultado** — Implementar apenas o solicitado + testes obrigatórios (`tests-required`). Sem “drive-by refactors”, renomeações em massa, ou mover ficheiros sem necessidade estrita.
2. **Diff mínimo** — Preferir o menor conjunto de ficheiros e linhas que comprove o comportamento. Rever impacto antes de tocar em `layout`, globals, cliente partilhado ou camada Prisma global.
3. **Sem churn de deps** — Não atualizar frameworks, ESLint majors, Tailwind presets, nem adicionar bibliotecas por conveniência cosmética, salvo pedido explícito ou bugs de segurança documentados — e mesmo assim: uma dependência por decisão com justificação curta no PR/commit.
4. **Preservar contratos externos** — URLs públicas exportadas ou links partilhados, contratos das rotas `/api/**` consumidas pela app, payloads Prisma já em produção/staging não mudam formato sem migração e testes.
5. **UI coerente com o projeto** — Reutilizar padrões, componentes e tokens existentes antes de criar novo design system. Evitar páginas “template genéricos” ou copy em inglês no site público se o projeto estiver PT-first.
6. **Risco alto = confirmação** — Mudanças em auth/session admin, sanitização/HTML público, modelos Prisma ou env vars obrigam leitura do código atual e regressão dirigida antes de propor alternativas arquiteturais.

## Sinais de alerta (“não extrapolar”)

Para **não fazer** salvo pedido explícito do utilizador:

- Reescrever arquitetura de pastas, “modernizar todo o app”, ou alinhar a um starter diferente do que o repo já é.
- Trocar o editor/CMS strategy, estratégia de auth ou base de dados “para simplificar”.
- Desligar validações ou testes falhados para “passar o build”.
- Introduzir feature flags globais ou camadas infra sem necessidade do trabalho atual.
- Alterar comportamento não relacionado apenas porque aparece nos mesmos ficheiros.

Quando aparecer uma destas inclinações, **reduzir o plano**, listar apenas passos indispensáveis, e perguntar se o utilizador quer alargar objetivos.

## Checklist rápido antes de editar

- O pedido do utilizador fica verdadeiro com **menos** ficheiros do que inicialmente imaginado?
- Isto preserva público/backoffice atual e evita regressões óbvias (links, SSR, formulários)?
- Tests existentes continuam válidos ou foram atualizados de forma proporcional?

## Harmonização com o repositório

- `AGENTS.md` — obrigações de teste e fluxo esperado do agent.
- Skill `tests-required` — sempre que o código muda comportamento ou estruturas críticas.
- Skill `backoffice-content-regressions` quando o assunto envolve sessão admin ou rich text público.

Se o trabalho ficar incompleto sem violar estas regras, preferir declarar lacuna e o teste mais próximo em vez de improvisar grandes refactors.
