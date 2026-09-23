# Continue (resume work after time away)

Use this when returning to a project you haven't touched in a while, or at the
start of any working session. It reloads shared context, checks reality against
it, and proposes the next step.

Do this:

1. **Reload context** — read `.ai/README.md`, `progress.md` (top entry),
   `project.md`, `business-model.md`, `architecture.md`, `stack.md`,
   `conventions.md`, and any in-flight `specs/`. Skim `decisions/` and `lessons.md`.
2. **Detect drift** — compare `.ai/` with the actual code and git state:
   - Run `git log --oneline -10` and `git status` to see what happened since.
   - Note anything in `.ai/` that is now stale or contradicted by the code.
3. **Health check** — run `/verify` to confirm the project is currently green
   before building on top of it. If red, flag it as the first thing to fix.
4. **Report back**, briefly:
   - Where the project stands and what changed since the last `progress.md` entry.
   - Any drift or broken checks found.
   - The recommended next step (from `progress.md`, or your suggestion if done).
5. **Wait for direction** unless the next step is unambiguous and already agreed.

Do not start large changes during resume — orient first, then act.
