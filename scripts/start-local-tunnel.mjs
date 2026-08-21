#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "infra", ".env");

function readEnvironment(path) {
  const values = new Map();

  for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values.set(key, value);
  }

  return values;
}

function requireHttps(values, key) {
  const value = values.get(key);
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} lipsește sau nu este un URL valid.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${key} trebuie să folosească HTTPS pentru tunelul public.`);
  }
}

let values;
try {
  values = readEnvironment(envPath);
} catch (cause) {
  console.error(`Nu pot citi infra/.env: ${cause.message}`);
  process.exit(1);
}

for (const key of [
  "CLOUDFLARE_TUNNEL_TOKEN",
  "WEB_API_URL",
  "WEB_SOCKET_URL",
  "WEB_APP_ORIGINS",
]) {
  if (process.env[key]) values.set(key, process.env[key]);
}

const token = values.get("CLOUDFLARE_TUNNEL_TOKEN");
if (!token || token.includes("replace_with") || token.length < 40) {
  console.error(
    "CLOUDFLARE_TUNNEL_TOKEN lipsește din infra/.env. Folosește tokenul unui tunel local nou, nu tokenul VPS.",
  );
  process.exit(1);
}

try {
  requireHttps(values, "WEB_API_URL");
  requireHttps(values, "WEB_SOCKET_URL");
} catch (cause) {
  console.error(cause.message);
  process.exit(1);
}

const origins = (values.get("WEB_APP_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!origins.some((origin) => origin.startsWith("https://"))) {
  console.error(
    "WEB_APP_ORIGINS trebuie să includă hostname-ul HTTPS al site-ului public.",
  );
  process.exit(1);
}

if (process.argv.includes("--check")) {
  console.log("Configurația tunelului local este validă.");
  process.exit(0);
}

const result = spawnSync(
  "docker",
  [
    "compose",
    "-f",
    "infra/docker-compose.yml",
    "--env-file",
    "infra/.env",
    "--profile",
    "full",
    "--profile",
    "tunnel",
    "up",
    "-d",
    "--build",
  ],
  { cwd: root, stdio: "inherit" },
);

if (result.error) {
  console.error(`Nu am putut porni Docker Compose: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
