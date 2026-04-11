---
name: backoffice-content-regressions
description: Use when fixing backoffice auth/session failures or public rich-text rendering regressions in this repository. It reinforces restoring affected API routes, checking Firebase-backed admin flows, and adding route plus rendering tests in the same change.
---

# Backoffice And Content Regression Workflow

Use this skill when changes touch:

- `app/api/admin/session/route.ts`
- Firebase-backed backoffice auth/session flows
- Public detail or listing pages that render CMS rich text

## Required checks

- Restore or update the runtime route before touching client auth assumptions.
- Confirm the backoffice no longer blocks forever on session bootstrap.
- Ensure public CMS HTML is rendered with `prepareRichTextForRender(...)` instead of raw text output.

## Required tests

- Route or integration coverage for `app/api/admin/session/route.ts`
- Source or component coverage for public pages that should render rich text
- Run the narrowest relevant `vitest` command first, then run `pnpm build`
