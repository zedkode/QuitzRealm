/// Avatarul unui jucător.
///
/// Conturile n-au poză în baza de date, iar o cerere către un serviciu extern
/// de avatare ar scurge numele fiecărui jucător afișat în panou către un terț.
/// Aici culoarea și inițialele se derivă din id: același cont arată la fel de
/// fiecare dată, fără nicio cerere în rețea.

const PALETTES: Array<[string, string]> = [
  ["#7c5cff", "#2a1c4d"],
  ["#2bc7b4", "#10322f"],
  ["#e0ba58", "#3a2c10"],
  ["#ec4899", "#3d1329"],
  ["#3b82f6", "#122344"],
  ["#34d399", "#0f3226"],
  ["#f97316", "#3a1e08"],
  ["#a78bfa", "#241a44"],
];

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) >>> 0;
  }
  return total;
}

export function initials(name: string): string {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Avatar({
  name, id, size = 26, ring,
}: {
  name: string;
  id: string;
  size?: number;
  /// Inelul de stare din jurul avatarului, când e cerut.
  ring?: string;
}) {
  const [from, to] = PALETTES[hash(id) % PALETTES.length];
  return (
    <span
      aria-hidden
      className="admin-avatar-mark"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(140deg, ${from}, ${to})`,
        fontSize: Math.max(8, Math.round(size * 0.36)),
        boxShadow: ring ? `0 0 0 1.5px ${ring}, 0 0 0 3px var(--admin-panel)` : undefined,
      }}
    >
      {initials(name)}
    </span>
  );
}
