---
name: deploy-gate
description: >-
  Run the AS-62 production deploy preflight gate (git clean/master checks,
  pytest + vitest + Playwright smoke, npm/pip audits, markdown report). Use when
  the user asks to deploy to PRO, run deploy gate, preflight deploy, or
  Invoke-DeployGate before README_DEPLOY publish steps.
---

# Deploy gate (AS-62)

## When to use

Before any production publish described in `README_DEPLOY.md` (web / backoffice / backend).

This skill does **not** run AWS `s3 sync`, CloudFront invalidation, or EC2 compose. A green gate means **ALLOW_DEPLOY** — then point the operator at `README_DEPLOY.md` recurring publish.

## Steps

1. Confirm the operator intends a PRO deploy and has read `README_DEPLOY.md`.
2. From the umbrella repo root (`ads-cloud-system`), run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-gate/Invoke-DeployGate.ps1
```

3. **Dirty tree** (uncommitted changes in umbrella, `backend`, `frontend-web`, or `frontend-backoffice`): gate **cancels**. Tell the user to commit/stash; do not invent an override.
4. **Not on `master`**: warn that branches do not match. Continue only if the user explicitly confirms. Then re-run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/deploy-gate/Invoke-DeployGate.ps1 -AllowNonMaster -ConfirmToken DEPLOY
```

5. Ensure Docker is running. e2e defaults to `host.docker.internal:8000` / `:3000` — bring up `docker/docker-compose.yml` (or set `E2E_API_URL` / `E2E_WEB_URL`). Tests always run **inside** containers (compose `run` for pytest/vitest; Playwright image for e2e).
6. Optional emergency flags (must appear in the report): `-SkipAudit`, `-SkipE2E`, `-SkipTests` — discourage; only if the user insists.
7. Read the report path printed by the script (`reports/deploys/deploy_report_DD_MM_YYYY_HH-MM.md`).
8. If verdict is **CANCEL**: stop; summarize failures from the report; do not publish.
9. If verdict is **ALLOW_DEPLOY**: link `README_DEPLOY.md` sections for Backoffice / Web / Backend publish. Do not auto-run AWS unless the user separately asks.

## References

- Spec/plan: `.ai/specs/as-62-deploy-gate/`
- ADR: `.ai/decisions/0013-deploy-preflight-gate.md`
- Script: `scripts/deploy-gate/Invoke-DeployGate.ps1`
