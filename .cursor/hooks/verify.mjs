#!/usr/bin/env node
/**
 * Cross-platform verification runner for Cursor.
 *
 * Two modes:
 *   1. Hook mode  (`node .cursor/hooks/verify.mjs --hook`)
 *      Wired to the `stop` event in .cursor/hooks.json. Reads the hook JSON
 *      from stdin, runs the enabled checks in .cursor/verify.json, and — if any
 *      fail — returns a `followup_message` so the agent auto-iterates until the
 *      checks pass (bounded by `loop_limit` in hooks.json). On success prints {}.
 *
 *   2. Manual mode (`node .cursor/hooks/verify.mjs`)
 *      Runs the same checks and prints a human-readable report. Exits non-zero
 *      if any check fails. Used by the /verify command and by CI.
 *
 * Works on Windows (PowerShell/cmd), macOS and Linux. No external deps.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const CONFIG_PATH = join(PROJECT_ROOT, ".cursor", "verify.json");
const SKIP_FILE = join(PROJECT_ROOT, ".cursor", "skip-verify");

const isHookMode = process.argv.includes("--hook");

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return null;
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch (err) {
    return { __error: `Could not parse .cursor/verify.json: ${err.message}` };
  }
}

function gitIsDirty() {
  const res = spawnSync("git", ["status", "--porcelain"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    shell: false,
  });
  if (res.status !== 0) return true; // not a git repo / git missing -> don't skip
  return res.stdout.trim().length > 0;
}

function runCheck(check) {
  const started = Date.now();
  const res = spawnSync(check.command, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    shell: true, // lets us use plain command strings cross-platform
    windowsHide: true,
  });
  const output = `${res.stdout || ""}${res.stderr || ""}`.trim();
  return {
    name: check.name,
    command: check.command,
    ok: res.status === 0,
    code: res.status,
    ms: Date.now() - started,
    output,
  };
}

function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function emitHook(obj) {
  process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function main() {
  const config = readConfig();

  // --- Hook mode ------------------------------------------------------------
  if (isHookMode) {
    let payload = {};
    try {
      payload = JSON.parse(readStdin() || "{}");
    } catch {
      payload = {};
    }

    // Only act when the turn finished cleanly.
    if (payload.status && payload.status !== "completed") emitHook({});

    // Escape hatch: `touch .cursor/skip-verify` to disable for one turn.
    if (existsSync(SKIP_FILE)) emitHook({});

    if (!config || config.__error) emitHook({});

    const enabled = (config.checks || []).filter(
      (c) => c.enabled && c.command && c.command.trim()
    );
    if (enabled.length === 0) emitHook({}); // nothing configured yet (fresh fork)

    if (config.onlyRunWhenDirty !== false && !gitIsDirty()) emitHook({});

    const results = enabled.map(runCheck);
    const failed = results.filter((r) => !r.ok);
    if (failed.length === 0) emitHook({});

    const budget = config.maxOutputChars || 4000;
    const perCheck = Math.max(400, Math.floor(budget / failed.length));
    const details = failed
      .map((r) => {
        const out = r.output.length > perCheck
          ? r.output.slice(-perCheck)
          : r.output;
        return `### ${r.name} FAILED (exit ${r.code})\n$ ${r.command}\n\n${out}`;
      })
      .join("\n\n");

    emitHook({
      followup_message:
        `Verification gate failed after your changes (loop ${payload.loop_count ?? "?"}). ` +
        `Do NOT consider the task done. Read the output below, fix the ROOT CAUSE ` +
        `(not the test), then stop so the checks run again. If a failure is clearly ` +
        `unrelated to your edits, explain why and \`touch .cursor/skip-verify\`.\n\n` +
        `${details}`,
    });
  }

  // --- Manual mode ----------------------------------------------------------
  if (!config) {
    console.log("No .cursor/verify.json found. Nothing to verify.");
    process.exit(0);
  }
  if (config.__error) {
    console.error(config.__error);
    process.exit(1);
  }

  const enabled = (config.checks || []).filter(
    (c) => c.enabled && c.command && c.command.trim()
  );
  if (enabled.length === 0) {
    console.log(
      "No enabled checks in .cursor/verify.json. Configure `checks` for this project's stack."
    );
    process.exit(0);
  }

  console.log(`Running ${enabled.length} verification check(s)...\n`);
  const results = enabled.map((c) => {
    process.stdout.write(`- ${c.name}: `);
    const r = runCheck(c);
    console.log(r.ok ? `PASS (${r.ms}ms)` : `FAIL (exit ${r.code}, ${r.ms}ms)`);
    return r;
  });

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n${failed.length} check(s) failed:\n`);
    for (const r of failed) {
      console.error(`==== ${r.name} ($ ${r.command}) ====`);
      console.error(r.output || "(no output)");
      console.error("");
    }
    process.exit(1);
  }

  console.log("\nAll checks passed.");
  process.exit(0);
}

main();
