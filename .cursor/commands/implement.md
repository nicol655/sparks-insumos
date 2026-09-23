# Implement the next task(s)

Execute the feature's `tasks.md`, respecting the whole workflow.

1. Read the feature's `spec.md`, `plan.md`, `tasks.md`, and the top of
   `.ai/progress.md`.
2. Work the next unchecked task (or the range the user names). One task at a time,
   smallest reversible diff. Follow `.ai/conventions.md` and the engineering rules.
3. Add/update tests for the behavior you change.
4. Run `/verify` (or the checks in `.cursor/verify.json`). Fix failures at the
   root cause — never disable a test to pass.
5. Check off completed tasks in `tasks.md`.
6. Before stopping, update `.ai/progress.md` (state + next step) and record any
   decision (ADR) or gotcha (`lessons.md`).

Stop and ask if you hit an ambiguity or a decision with real trade-offs.
