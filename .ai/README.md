# .ai — Shared Project Memory

This folder is the **single source of truth** for what this project is, why it
exists, how it's built, and where it stands. It is committed to git so every
contributor and every AI agent shares the exact same context.

> Agents: read this at the start of a task; update it before you finish.
> See `.cursor/rules/10-context.mdc`.

## Map

| File | Purpose | Update when |
|------|---------|-------------|
| `project.md` | What we're building and for whom | Scope/goals change |
| `business-model.md` | The business context (value, customers, revenue, metrics) | Business changes |
| `constitution.md` | Non-negotiable principles & guardrails | Rarely; deliberate change |
| `architecture.md` | System design, boundaries, key flows | Design changes |
| `stack.md` | Tech stack + how to run/build/test | Tooling changes |
| `conventions.md` | Project-specific coding conventions | New patterns adopted |
| `glossary.md` | Domain terms and their meaning | New domain concepts |
| `progress.md` | Current state + next step (handoff log) | Every session |
| `lessons.md` | Post-mortems, gotchas, hard-won knowledge | After a tricky bug |
| `decisions/` | Architecture Decision Records (ADRs) | Any non-obvious choice |
| `specs/` | One folder per feature: spec → plan → tasks | Per feature |

## How it's used

The `.ai/` docs + `.cursor/rules/` + `.cursor/commands/` + `.cursor/verify.json`
together let a fresh agent run `/onboard`, understand the whole project, and
continue work consistently — no private chat history required.
