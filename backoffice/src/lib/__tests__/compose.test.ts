import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

function readStack(name: string): string {
  const sibling = path.resolve(process.cwd(), "..", "docker", name);
  if (existsSync(sibling)) return readFileSync(sibling, "utf8");
  return readFileSync(path.join("/stack", name), "utf8");
}

describe("compose", () => {
  const service = readFileSync(path.resolve(process.cwd(), "docker-compose.yml"), "utf8");
  const root = readStack("docker-compose.yml");
  const envExample = readStack(".env.example");

  it("names the container sparks-backoffice and publishes BACKOFFICE_PORT", () => {
    expect(service).toContain("container_name: sparks-backoffice");
    expect(service).toContain("${BACKOFFICE_PORT:-3200}:3000");
  });

  it("is included from the root stack and documented in docker/.env.example", () => {
    expect(root).toContain("../backoffice/docker-compose.yml");
    expect(envExample).toContain("BACKOFFICE_PORT=3200");
  });
});
