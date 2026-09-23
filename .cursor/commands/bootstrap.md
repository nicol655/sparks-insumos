# Bootstrap a new project

Turn this freshly-forked scaffolding into a real project. The user will provide
a target stack and base requirements after the command (e.g.
`/bootstrap a REST API in Go with Postgres, JWT auth`).

Do this in order:

1. **Clarify only what blocks you.** If stack, primary language, or the core
   requirement is missing or ambiguous, ask concise questions first. Otherwise
   proceed with sensible defaults and state them.

2. **Fill the memory bank** in `.ai/` (replace every `_TBD_`):
   - `project.md` — what/why, goals, non-goals, success criteria.
   - `business-model.md` — if the user shares business context now, capture it
     (or run `/business-model` right after). It should drive product priorities.
   - `constitution.md` — add project-specific hard constraints.
   - `stack.md` — the chosen stack and the real install/dev/typecheck/lint/test/build commands.
   - `architecture.md` — the initial design and main components.
   - `conventions.md` — folder layout and patterns for this stack.

3. **Wire the verification gate.** Edit `.cursor/verify.json`: set the real
   commands for typecheck/lint/test/build that exist for this stack and set
   `enabled: true` only for the ones that apply. Keep it in sync with `stack.md`.
   Delete checks that don't apply.

4. **Scaffold the project.** Create the initial project structure and dependency
   manifest for the chosen stack (use the ecosystem's official initializer when
   there is one). Add at least one trivial passing test so the gate is real.

5. **Verify.** Run `/verify` (or the checks directly) and make them pass.

6. **Record & hand off.** Add an ADR for the stack choice in `.ai/decisions/`,
   update `.ai/progress.md` with what exists and the next step, and give the user
   a short summary of how to run and test the project.

7. **Integrations (optional).** If the project needs external tools (Jira, design,
   etc.), run `/add-mcp <service>` to wire them.

Do NOT write application features yet unless asked — bootstrap sets the
foundation. For features, continue with `/spec`.
