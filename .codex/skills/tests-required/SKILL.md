---
name: tests-required
description: Use when implementing or modifying any feature, fix, refactor, UI behavior, API flow, or data logic in this repository. This skill enforces that automated tests must be added or updated in the same change and that work is not considered complete without relevant test coverage or an explicit explanation of the remaining gap.
---

# Tests Required

For every code change in this repository, treat tests as part of the implementation.

## Required behavior

- Add or update automated tests in the same task whenever behavior changes.
- Match the test type to the change:
  - Unit tests for pure helpers and formatters.
  - Component tests for UI states, rendering, and interactions.
  - Route or integration tests for API/session logic.
- Keep tests focused on observable behavior instead of implementation details.

## Completion rule

Do not consider the task finished until one of these is true:

- Relevant tests were created or updated for the change.
- You explicitly document why automated coverage is currently blocked and add the closest practical test around the risk.

## Validation

- Run the narrowest relevant test command first.
- If the environment cannot run tests, say that clearly and still leave the test files in place.
- When fixing a bug, include at least one test that would fail without the fix.
