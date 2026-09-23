# Add / configure an MCP server

Integrate an external tool (Jira, Stitch, GitHub, a database, etc.) via MCP so the
agent can use it. The user names the service after the command
(e.g. `/add-mcp Jira`).

Do this:

1. **Check if it's already available.** Some servers are configured at the user
   level. Inspect available MCP tools first; if the service is already usable,
   tell the user and stop — no config needed to *use* it.
2. **Find the correct server config.** Determine the transport:
   - **Remote**: a hosted server with a `url` (Cursor handles OAuth). Preferred for
     SaaS like Atlassian/Jira.
   - **Local**: a `command` + `args` Cursor spawns (often `npx -y <package>`), with
     secrets passed through `env`.
   If unsure of the exact endpoint/package, ask the user or check the vendor's
   MCP docs — do not invent package names or URLs.
3. **Write project config.** If `.cursor/mcp.json` doesn't exist, copy it from
   `.cursor/mcp.example.json`. Add the server under `mcpServers`. Use
   `${env:VAR}` for every secret; never hardcode tokens.
4. **Secrets & sharing.** Keep server *definitions* in git so the team shares them,
   but ensure no secret values are committed (they live in each dev's environment).
5. **Verify.** Ask the user to check Cursor → Settings → MCP that the server is
   connected (may require an auth step), then confirm the tools are listed.
6. Note the integration in `.ai/stack.md` (Integrations) so it's part of the
   shared context.

Common services:
- **Jira / Confluence** → Atlassian Rovo MCP (remote, `url`).
- **Stitch (design)** → Stitch MCP (local `command`, key via `env`).
