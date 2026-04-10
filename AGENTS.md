# Agent Instructions

## Test Discipline

- Every new feature, bug fix, refactor, or behavior change must include automated tests created or updated in the same change.
- Prefer the smallest realistic test mix that proves the behavior end-to-end: unit tests for helpers, component tests for UI state, and route or integration tests for server logic.
- If a change cannot be covered automatically, the agent must state why, identify the gap explicitly, and add the nearest practical test around the risky behavior.
- A task is not complete until the relevant tests exist and are intended to pass with the implementation.

## Expected Workflow

- Implement the change.
- Add or update tests immediately after the implementation.
- Run the relevant test command when the environment supports it.
- Report any remaining uncovered risk clearly.
