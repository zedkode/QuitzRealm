import type { PlayerStatus } from "@/lib/playerTypes";

export const STATUS_TONES: Record<PlayerStatus, { label: string; colour: string }> = {
  ACTIVE: { label: "Active", colour: "#34d399" },
  IDLE: { label: "Idle", colour: "#e0ba58" },
  OFFLINE: { label: "Offline", colour: "#6b6484" },
  SUSPENDED: { label: "Suspended", colour: "#f87171" },
};

export function statusTone(status: PlayerStatus) {
  return STATUS_TONES[status] ?? STATUS_TONES.OFFLINE;
}

/// Unitățile, de la cea mai mare la cea mai mică, cu sufixul scurt.
const UNITS: Array<[string, number]> = [
  ["y", 31_536_000_000],
  ["mo", 2_592_000_000],
  ["d", 86_400_000],
  ["h", 3_600_000],
  ["m", 60_000],
];

/// „15m ago" în loc de un timestamp.
///
/// Pe o listă de conturi, distanța în timp se citește dintr-o privire; ora
/// exactă cere o scădere în cap. Forma scurtă e și singura care încape într-o
/// coloană de tabel fără să rupă rândul.
export function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  if (delta < 60_000) return "just now";
  for (const [suffix, ms] of UNITS) {
    if (delta >= ms) return `${Math.floor(delta / ms)}${suffix} ago`;
  }
  return "just now";
}

/// Restul panoului e în engleză, după referința de design, deci și datele:
/// „18 iul. 2026" lângă un antet „Join Date" ar fi două limbi pe același rând.
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

/// Numele țării din codul ISO, prin `Intl.DisplayNames`.
///
/// Browserul are deja tabelul complet, tradus și actualizat. A-l copia în
/// bundle ar însemna două sute de nume care se pot dezacorda în tăcere.
const REGION_NAMES = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

export function countryName(code: string | null): string | null {
  if (!code) return null;
  try {
    return REGION_NAMES?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/// Culoarea insignei de nivel. Pragurile urmează treptele vizibile din joc, ca
/// un nivel mare să se distingă fără să fie nevoie să citești cifra.
export function levelTone(level: number): string {
  if (level >= 70) return "#f0cf7a";
  if (level >= 50) return "#b9a3ff";
  if (level >= 30) return "#5eead4";
  return "#8b83a3";
}
