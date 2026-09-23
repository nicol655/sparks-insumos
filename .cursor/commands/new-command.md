# Create a new instruction (command or rule)

Add a new reusable instruction to the project so the whole team gets it. Use this
when the user describes a workflow they want to repeat, or a standard to enforce.

First decide which kind it is:

- **Command** (`/name`, run on demand) — a workflow the user *triggers* explicitly
  (e.g. "review this PR", "generate a migration"). Goes in `.cursor/commands/<name>.md`.
- **Rule** (always/auto-applied) — a standard the agent should *always* follow
  (e.g. "never use `any`", "all endpoints return a typed error"). Goes in
  `.cursor/rules/<name>.mdc`.

## To create a command
1. Create `.cursor/commands/<verb-name>.md` (lowercase, hyphenated).
2. Write it as a clear prompt: the goal, the steps in order, and how to report the
   result. Keep it focused on one job.
3. Tell the user it's now available by typing `/<verb-name>`.

## To create a rule
1. Create `.cursor/rules/<name>.mdc` with frontmatter:
   ```
   ---
   description: <what it enforces>
   globs: <glob or omit>        # scope to file types, e.g. **/*.ts
   alwaysApply: <true|false>    # true = every chat; use sparingly
   ---
   ```
2. Keep it under ~50 lines, actionable, with a concrete good/bad example.
3. Choose scope deliberately: `alwaysApply: true` for universal standards, `globs`
   for file-type-specific ones, description-only for "apply when relevant".

## Always
- Confirm scope with the user if it's ambiguous (on-demand vs always-on).
- Commit the new file so every contributor gets it.
- Add it to the command/skill table in `README.md` if it's a command.
