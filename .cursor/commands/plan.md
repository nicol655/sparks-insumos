# Plan a feature

Produce the technical plan for the feature whose `spec.md` is approved.

1. Read the feature's `spec.md`, plus `.ai/architecture.md`, `stack.md`,
   `conventions.md`, and `constitution.md`.
2. Write `plan.md` in the same `.ai/specs/<id>/` folder from the TEMPLATE:
   approach, affected files/modules, data/API changes, trade-offs, risks, and a
   test strategy that proves the acceptance criteria.
3. Every technical choice must trace to a requirement and comply with the
   constitution. For non-obvious choices, add an ADR in `.ai/decisions/` and link it.
4. Do not write code yet.

End by summarizing the plan and any risks, then hand off to `/tasks`.
