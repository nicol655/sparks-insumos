# Verify (run the quality gate)

Run the project's quality checks and report the result. This is the same gate the
`stop` hook enforces automatically.

1. Read `.cursor/verify.json`.
2. Run every check where `enabled` is `true` and `command` is non-empty, in order
   (typecheck → lint → test → build is a good default order).
   - Preferred: run each `command` directly in the terminal (works regardless of
     which runtimes are installed).
   - If `node` is available, `node .cursor/hooks/verify.mjs` runs them all and
     exits non-zero on failure.
3. If everything passes: say so clearly.
4. If anything fails: show the failing command and output, then fix the **root
   cause** and re-run until green. Do not weaken or skip tests.

If no checks are enabled yet, tell the user to run `/bootstrap` (or configure
`.cursor/verify.json` for the current stack).
