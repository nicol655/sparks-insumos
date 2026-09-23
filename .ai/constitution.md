# Constitution

Non-negotiable principles that govern all development. Every plan and
implementation is checked against these. Change them deliberately, not casually.

## Default principles (edit per project)

1. **Context first.** Read `.ai/` before acting; persist changes after. Never let
   knowledge live only in a chat.
2. **Verify before done.** No iteration is complete until `.cursor/verify.json`
   checks pass. Fix root causes, never disable tests to go green.
3. **Small, reversible steps.** Prefer incremental, reviewable changes.
4. **Simplicity.** Choose the simplest design that meets the requirement. Justify
   added complexity or new dependencies in an ADR.
5. **Traceability.** Every technical choice traces to a requirement (`specs/`) and,
   when non-obvious, to a decision (`decisions/`).
6. **Security & privacy by default.** No secrets in source; validate all external
   input; least privilege.
7. **Consistency over novelty.** Match existing patterns; don't reinvent.

## Project-specific principles
<!-- Add hard constraints unique to this project (compliance, performance budgets,
platform limits, etc.). -->
- _TBD_
