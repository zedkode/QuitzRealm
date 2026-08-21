#!/usr/bin/env node
/**
 * Raportul de actualizări al proiectului.
 *
 * Regula din `agents.md` §5: se stă pe versiunile curente, nu se lasă proiectul
 * să ruginească. Scriptul spune ce a rămas în urmă, pe toate ecosistemele
 * deodată — pnpm pentru workspace-ul frontend, npm pentru cele două servere,
 * pub pentru aplicația Flutter.
 *
 * Implicit e **informativ** și iese cu 0. Motivul e practic: dacă ar cădea de
 * fiecare dată când o dependință publică o versiune nouă, ar cădea zilnic, iar
 * un semnal care se aprinde zilnic e un semnal pe care nimeni nu-l mai citește.
 * Ce blochează build-ul sunt vulnerabilitățile, verificate separat cu
 * `pnpm audit`.
 *
 *   node scripts/check-updates.mjs            → raport
 *   node scripts/check-updates.mjs --strict   → iese cu 1 dacă există major-uri
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const strict = process.argv.includes("--strict");

const ECOSYSTEMS = [
  { name: "frontend (pnpm workspace)", dir: ".", cmd: "pnpm", args: ["outdated", "-r", "--format", "json"] },
  { name: "server-core / api", dir: "backend/api", cmd: "npm", args: ["outdated", "--json"] },
  { name: "server-core / realtime", dir: "backend/realtime", cmd: "npm", args: ["outdated", "--json"] },
  { name: "app (Flutter)", dir: "mobile", cmd: "flutter", args: ["pub", "outdated", "--json"], optional: true },
];

/** `outdated` iese cu cod diferit de zero când găsește ceva. Nu e o eroare. */
function run(cmd, args, cwd) {
  // Comanda se compune ca șir, nu ca `execFileSync` cu `shell: true`: pe Windows
  // `pnpm`, `npm` și `flutter` sunt fișiere `.cmd` și au nevoie de shell, iar
  // combinația argumente-plus-shell emite un avertisment de depreciere. Toate
  // argumentele de aici sunt constante din acest fișier, deci nu există nimic de
  // escapat.
  try {
    return execSync([cmd, ...args].join(" "), { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (error) {
    if (typeof error.stdout === "string" && error.stdout.trim()) return error.stdout;
    return null;
  }
}

/** Aduce fiecare ecosistem la aceeași formă: nume, versiune curentă, ultima. */
function normalise(name, raw) {
  if (!raw?.trim()) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  // Flutter: { packages: [{ package, current: {version}, latest: {version} }] }
  if (Array.isArray(parsed.packages)) {
    return parsed.packages
      .filter((p) => p.current?.version && p.latest?.version && p.current.version !== p.latest.version)
      .map((p) => ({ name: p.package, current: p.current.version, latest: p.latest.version }));
  }

  // pnpm și npm: { "pachet": { current, latest, ... } }
  return Object.entries(parsed)
    .map(([pkg, info]) => ({
      name: pkg,
      current: info.current ?? info.wanted ?? "?",
      latest: info.latest ?? "?",
    }))
    .filter((row) => row.current !== row.latest);
}

const majorOf = (version) => Number.parseInt(String(version).replace(/^\D*/, ""), 10);

let majors = 0;
let total = 0;

for (const eco of ECOSYSTEMS) {
  const cwd = join(root, eco.dir);
  if (!existsSync(cwd)) continue;

  const raw = run(eco.cmd, eco.args, cwd);
  if (raw === null && eco.optional) {
    console.log(`\n${eco.name}\n  (${eco.cmd} nu e disponibil aici — sărit)`);
    continue;
  }

  const rows = normalise(eco.name, raw);
  total += rows.length;

  console.log(`\n${eco.name}`);
  if (rows.length === 0) {
    console.log("  totul la zi");
    continue;
  }

  const width = Math.max(...rows.map((row) => row.name.length));
  for (const row of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    const isMajor = majorOf(row.current) !== majorOf(row.latest);
    if (isMajor) majors += 1;
    const mark = isMajor ? "MAJOR" : "     ";
    console.log(`  ${mark} ${row.name.padEnd(width)}  ${row.current}  →  ${row.latest}`);
  }
}

console.log(
  `\n${total} dependențe în urmă, dintre care ${majors} salturi majore.` +
    "\n\nRegula (agents.md §5): actualizările se fac în loturi mici, cu o compilare" +
    "\nreală după fiecare lot. Pe Flutter, `flutter analyze` trece cu un graf de" +
    "\ndependențe rupt — nu intră în pub-cache — deci analiza singură nu e dovadă." +
    "\nO versiune ținută pe loc are nevoie de motiv scris lângă ea și de o dată de" +
    "\nrevizuire.",
);

/* --- pin-urile și datele lor de revizuire --- */

const pinsFile = join(root, "scripts/dependency-pins.json");
const pins = existsSync(pinsFile) ? JSON.parse(readFileSync(pinsFile, "utf8")).pins : [];
const today = new Date().toISOString().slice(0, 10);
const expired = pins.filter((pin) => pin.revisitAfter && pin.revisitAfter <= today);

if (pins.length > 0) {
  console.log(`\nVersiuni ținute pe loc (${pins.length}):`);
  for (const pin of pins) {
    const late = pin.revisitAfter <= today ? "  ⚠ DE REVIZUIT" : "";
    console.log(`  ${pin.package} @ ${pin.pinnedTo}  (blocat de ${pin.blockedFrom}, revizuire după ${pin.revisitAfter})${late}`);
  }
}

if (expired.length > 0) {
  console.log(
    `\n${expired.length} pin-uri și-au depășit data de revizuire. Se reîncearcă` +
      "\nactualizarea și, dacă tot nu merge, se mută data cu un motiv actualizat" +
      "\nîn scripts/dependency-pins.json — nu se lasă nedatate.",
  );
}

if (strict && majors > 0) {
  console.error(`\n--strict: ${majors} salturi majore neluate în seamă.`);
  process.exit(1);
}
