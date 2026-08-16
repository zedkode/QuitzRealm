import { useMemo } from "react";
import type { ActivityPoint } from "@/lib/adminTypes";

const SERIES = [
  { key: "activePlayers", colour: "#8b5cf6" },
  { key: "newPlayers", colour: "#2bc7b4" },
  { key: "matchesPlayed", colour: "#e0ba58" },
  { key: "questionsAnswered", colour: "#a78bfa" },
] as const;

const WIDTH = 560;
const HEIGHT = 205;
const PADDING = { top: 8, right: 6, bottom: 20, left: 30 };

/// Graficul de activitate, desenat direct în SVG.
///
/// Fără bibliotecă de grafice: patru linii pe o grilă fixă nu justifică încă
/// 100 kB în bundle, iar controlul exact al grosimilor și culorilor contează
/// mai mult aici decât configurabilitatea.
export default function ActivityChart({ series }: { series: ActivityPoint[] }) {
  const { paths, ticks, labels, max } = useMemo(() => {
    if (series.length === 0) {
      return { paths: [], ticks: [], labels: [], max: 0 };
    }

    const peak = Math.max(
      1,
      ...series.flatMap((point) => SERIES.map((entry) => point[entry.key])),
    );
    // Scara urcă la un număr rotund, ca eticheta de sus să fie citibilă.
    const step = Math.pow(10, Math.max(0, String(Math.floor(peak)).length - 1));
    const top = Math.ceil(peak / step) * step;

    const innerW = WIDTH - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const x = (index: number) =>
      PADDING.left + (series.length === 1 ? innerW / 2 : (index / (series.length - 1)) * innerW);
    const y = (value: number) => PADDING.top + innerH - (value / top) * innerH;

    return {
      max: top,
      paths: SERIES.map((entry) => ({
        colour: entry.colour,
        d: series
          .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point[entry.key]).toFixed(1)}`)
          .join(" "),
        dots: series.map((point, index) => ({ cx: x(index), cy: y(point[entry.key]) })),
      })),
      ticks: [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
        value: Math.round(top * ratio),
        y: PADDING.top + innerH - ratio * innerH,
      })),
      labels: series.map((point, index) => ({
        x: x(index),
        text: new Date(point.day).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
      })),
    };
  }, [series]);

  if (series.length === 0) {
    return (
      <div className="grid h-[205px] place-items-center text-[10.5px] text-[var(--admin-dim)]">
        Fără date de activitate în perioada selectată.
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Activitatea jucătorilor">
      {ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={PADDING.left} x2={WIDTH - PADDING.right} y1={tick.y} y2={tick.y}
            stroke="rgba(255,255,255,.05)" strokeWidth="1"
          />
          <text x={PADDING.left - 6} y={tick.y + 3} textAnchor="end" fontSize="8" fill="#5f5a70">
            {compact(tick.value)}
          </text>
        </g>
      ))}

      {paths.map((path) => (
        <g key={path.colour}>
          <path d={path.d} fill="none" stroke={path.colour} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
          {path.dots.map((dot, index) => (
            <circle key={index} cx={dot.cx} cy={dot.cy} r="2.2" fill={path.colour} />
          ))}
        </g>
      ))}

      {labels.map((label, index) => (
        <text key={index} x={label.x} y={HEIGHT - 5} textAnchor="middle" fontSize="8" fill="#5f5a70">
          {label.text}
        </text>
      ))}
      <title>{`Maxim pe scară: ${max}`}</title>
    </svg>
  );
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}
