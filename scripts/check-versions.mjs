#!/usr/bin/env node
/**
 * Verifică regula de versionare a proiectului.
 *
 * Fiecare componentă livrabilă are un număr de versiune propriu, semantic, în
 * locul canonic al ecosistemului ei. Regula nu e cosmetică: fără ea nu se poate
 * spune ce versiune de client vorbește cu ce versiune de server, iar un raport
 * de eroare de la un jucător devine imposibil de localizat în timp.
 *
 * Rulează în CI. Un manifest fără versiune, sau cu una care nu e semver,
 * oprește build-ul.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Componentele livrabile și unde își țin versiunea. */
const COMPONENTS = [
  { name: "server-core (api)", file: "backend/api/package.json", kind: "npm" },
  { name: "server-core (realtime)", file: "backend/realtime/package.json", kind: "npm" },
  { name: "shared", file: "shared/package.json", kind: "npm" },
  { name: "web", file: "web/package.json", kind: "npm" },
  { name: "admin", file: "admin/package.json", kind: "npm" },
  { name: "app (Flutter)", file: "mobile/pubspec.yaml", kind: "pubspec" },
];

/** `1.4.0` sau `1.4.0+2008` — Flutter adaugă numărul de build după `+`. */
const SEMVER = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;

function readVersion({ file, kind }) {
  const raw = readFileSync(join(root, file), "utf8");
  if (kind === "npm") return JSON.parse(raw).version;
  const match = raw.match(/^version:\s*(\S+)\s*$/m);
  return match?.[1];
}

let failed = false;
const rows = [];

for (const component of COMPONENTS) {
  let version;
  try {
    version = readVersion(component);
  } catch (cause) {
    rows.push([component.name, component.file, `EROARE: ${cause.message}`]);
    failed = true;
    continue;
  }

  if (!version) {
    rows.push([component.name, component.file, "LIPSĂ"]);
    failed = true;
  } else if (!SEMVER.test(version)) {
    rows.push([component.name, component.file, `INVALID: ${version}`]);
    failed = true;
  } else {
    rows.push([component.name, component.file, version]);
  }
}

const width = Math.max(...rows.map((row) => row[0].length));
for (const [name, file, version] of rows) {
  console.log(`${name.padEnd(width)}  ${version.padEnd(14)}  ${file}`);
}

if (failed) {
  console.error(
    "\nRegula de versionare nu e respectată. Fiecare componentă livrabilă trebuie" +
      "\nsă aibă o versiune semantică proprie. Vezi agents.md, secțiunea Versionare.",
  );
  process.exit(1);
}

console.log("\nToate componentele au versiune validă.");
