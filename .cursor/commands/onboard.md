# Onboard: load full project context

Use this at the start of a session or when a new contributor/agent picks up the
project. Goal: reach the same understanding as everyone else, from the repo alone.

Do this:

1. Read `.ai/README.md`, then `project.md`, `business-model.md`, `constitution.md`,
   `architecture.md`, `stack.md`, `conventions.md`, `glossary.md`.
2. Read `.ai/progress.md` (top entry = current state and next step).
3. Skim `.ai/decisions/` and `.ai/lessons.md`.
4. Look at any in-flight feature under `.ai/specs/`.
5. Confirm the verification gate: read `.cursor/verify.json`.

Then report back, briefly:
- What the project is and its current state.
- The immediate next step (from `progress.md`).
- Anything stale or contradictory between `.ai/` and the actual code.

Do not change code during onboarding.
