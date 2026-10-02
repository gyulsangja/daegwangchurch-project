import { verifyWorshipHttp } from "./verify-worship-http.mjs";
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import pg from "pg";

// Never load .env or use DATABASE_URL: all writes target this disposable container.
const name = `daegwang-worship-test-${randomUUID()}`;
const password = randomUUID();
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
let container;
let client;
try {
  container = docker("run", "--detach", "--rm", "--name", name,
    "--label", "daegwang.test=worship", "--publish", "127.0.0.1::5432",
    "--env", "POSTGRES_DB=daegwang_worship_test", "--env", `POSTGRES_PASSWORD=${password}`,
    "postgres:17-alpine");
  const binding = JSON.parse(docker("inspect", "--format", '{{json .NetworkSettings.Ports}}', container))["5432/tcp"][0];
  const url = `postgresql://postgres:${password}@127.0.0.1:${binding.HostPort}/daegwang_worship_test`;
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { docker("exec", container, "pg_isready", "-U", "postgres"); ready = true; break; }
    catch { await setTimeout(500); }
  }
  if (!ready) throw new Error("Disposable PostgreSQL did not become ready");
  client = new pg.Client({ connectionString: url });
  await client.connect();
  for (const entry of readdirSync(resolve("packages/database/prisma/migrations"), { withFileTypes: true }).filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await client.query(readFileSync(resolve("packages/database/prisma/migrations", entry.name, "migration.sql"), "utf8"));
  }
  await client.end();
  client = undefined;
  console.log("Existing SQL migrations applied to disposable PostgreSQL.");
  const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "tests/integration/worship.test.ts"], {
    stdio: "inherit",
    env: { ...process.env, TEST_DATABASE_URL: url, DATABASE_URL: "", DIRECT_URL: "" },
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
  if (result.status === 0 && process.argv.includes("--http")) await verifyWorshipHttp(url);
} catch (error) {
  // Do not print connection URLs, subprocess arguments, or credentials.
  console.error("Disposable database test failed:", error instanceof Error ? error.name : "Unknown error");
  process.exitCode = 1;
} finally {
  if (client) await client.end();
  if (container) {
    docker("stop", container);
    console.log("Disposable PostgreSQL removed.");
  }
}
