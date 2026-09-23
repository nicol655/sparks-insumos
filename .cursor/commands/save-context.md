# Save context (persist the memory bank)

Write the current state of the work back into `.ai/` so any contributor or agent
can continue. Run this before ending a work session or handing off.

Update whatever changed:

1. `.ai/progress.md` — **always.** Add a top entry: what changed, current state,
   the exact next step, and any blockers/links. Keep it short.
2. `.ai/architecture.md`, `stack.md`, `conventions.md` — if design, tooling, or
   patterns changed.
3. `.ai/decisions/NNNN-*.md` — one ADR per non-obvious decision made this session.
4. `.ai/lessons.md` — if you hit a non-obvious bug/gotcha worth remembering.
5. The active feature's `tasks.md` — check off completed tasks.

Prefer deleting stale statements over stacking caveats. Reference files instead
of pasting code. Then summarize what you saved.
