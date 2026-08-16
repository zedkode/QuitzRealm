import { useMemo } from "react";
import type { GrowthPoint } from "@/lib/adminTypes";

const SERIES = [
  { key: "newPlayers", label: "New Players", colour: "#8b5cf6" },
  { key: "returningPlayers", label: "Returning Players", colour: "#2bc7b4" },
  { key: "totalPlayers", label: "Total Players", colour: "#e0ba58" },
] as const;

const WIDTH = 460;
const HEIGHT = 150;
const PADDING = { top: 8, right: 8, bottom: 18, left: 30 };

/// Graficul de creștere, desenat direct în SVG.
///
/// Fără bibliotecă de grafice: trei linii pe o grilă fixă nu justifică încă
/// o sută de kilobytes în bundle, iar controlul exact al grosimilor și
/// culorilor contează aici mai mult decât configurabilitatea.
export default function GrowthChart({ series }: { series: GrowthPoint[] }) {
  const chart = useMemo(() => {
    if (series.length < 2) return null;

    const peak = Math.max(1, ...series.flatMap((point) => SERIES.map((entry) => point[entry.key])));
    // Scara urcă la un număr rotund, ca eticheta de sus să fie citibilă.
    const step = Math.pow(10, Math.max(0, String(Math.floor(peak)).length - 1));
    const top = Math.ceil(peak / step) * step;

    const innerW = WIDTH - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const x = (index: number) => PADDING.left + (index / (series.length - 1)) * innerW;
    const y = (value: number) => PADDING.top + innerH - (value / top) * innerH;

    return {
      paths: SERIES.map((entry) => ({
        colour: entry.colour,
        d: series
          .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point[entry.key]).toFixed(1)}`)
          .join(" "),
      })),
      ticks: [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
        value: Math.round(top * ratio),
        y: PADDING.top + innerH - ratio * innerH,
      })),
      // Cinci etichete pe axa timpului: mai multe se suprapun la lățimea asta.
      labels: [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const index = Math.round(ratio * (series.length - 1));
        return {
          x: x(index),
          text: new Date(series[index].day).toLocaleDateString("ro-RO", { day: "numeric", month: "short" }),
        };
      }),
    };
  }, [series]);

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        {SERIES.map((entry) => (
          <span key={entry.key} className="flex items-center gap-1 text-[8.5px] text-[var(--admin-muted)]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.colour }} />
            {entry.label}
          </span>
        ))}
      </div>

      {chart === null ? (
        <div className="admin-empty h-[150px]">
          Nu există încă suficiente zile de istoric pentru a desena curba de creștere.
        </div>
      ) : (
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-auto w-full" role="img" aria-label="Creșterea numărului de jucători">
          {chart.ticks.map((tick) => (
            <g key={tick.value}>
              <line
                x1={PADDING.left} x2={WIDTH - PADDING.right} y1={tick.y} y2={tick.y}
                stroke="rgba(255,255,255,.05)" strokeWidth="1"
              />
              <text x={PADDING.left - 5} y={tick.y + 2.5} textAnchor="end" fontSize="7" fill="#4d4661">
                {compact(tick.value)}
              </text>
            </g>
          ))}

          {chart.paths.map((path) => (
            <path
              key={path.colour} d={path.d} fill="none" stroke={path.colour}
              strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
            />
          ))}

          {chart.labels.map((label, index) => (
            <text key={index} x={label.x} y={HEIGHT - 4} textAnchor="middle" fontSize="7" fill="#4d4661">
              {label.text}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

function compact(value: number): string {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}
