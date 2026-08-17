import { useId, useMemo, useState } from "react";

const WIDTH = 420;
const HEIGHT = 100;
const PADDING = { top: 8, right: 8, bottom: 16, left: 32 };

export interface AreaPoint {
  day: string;
  value: number;
}

/// Curba cumulată, cu suprafață sub linie și citire la trecerea cu mouse-ul.
///
/// Punctul de sub cursor se află din poziția pe axa X, nu dintr-un ascultător
/// pe fiecare punct: la treizeci de zile ar însemna treizeci de zone de
/// captare, iar între ele cifra ar dispărea.
export default function AreaChart({ points, colour = "#8b5cf6" }: { points: AreaPoint[]; colour?: string }) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (points.length < 2) return null;

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Scara nu pornește de la zero când toate valorile sunt mari și apropiate:
    // altfel o creștere reală de câteva procente arată ca o linie perfect
    // plată. Se lasă o margine de 12% sub minim.
    const floor = min === max ? Math.max(0, min - 1) : Math.max(0, min - (max - min) * 0.12);
    const top = min === max ? min + 1 : max + (max - min) * 0.08;

    const innerW = WIDTH - PADDING.left - PADDING.right;
    const innerH = HEIGHT - PADDING.top - PADDING.bottom;
    const x = (index: number) => PADDING.left + (index / (points.length - 1)) * innerW;
    const y = (value: number) => PADDING.top + innerH - ((value - floor) / (top - floor)) * innerH;

    const line = points
      .map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.value).toFixed(1)}`)
      .join(" ");

    return {
      line,
      area: `${line} L${x(points.length - 1).toFixed(1)},${HEIGHT - PADDING.bottom} L${PADDING.left},${HEIGHT - PADDING.bottom} Z`,
      x, y,
      ticks: [0, 0.5, 1].map((ratio) => ({
        value: Math.round(floor + (top - floor) * ratio),
        y: PADDING.top + innerH - ratio * innerH,
      })),
      labels: [0, 0.5, 1].map((ratio) => {
        const index = Math.round(ratio * (points.length - 1));
        return {
          x: x(index),
          text: new Date(points[index].day).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        };
      }),
    };
  }, [points]);

  if (chart === null) {
    return (
      <div className="admin-empty h-[100px]">
        Nu există încă destule zile de istoric pentru a desena curba.
      </div>
    );
  }

  const onMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    const raw = (ratio * WIDTH - PADDING.left) / (WIDTH - PADDING.left - PADDING.right);
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(raw * (points.length - 1)))));
  };

  const active = hover === null ? null : points[hover];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Evoluția numărului de jucători"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colour} stopOpacity=".34" />
            <stop offset="100%" stopColor={colour} stopOpacity="0" />
          </linearGradient>
        </defs>

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

        <path d={chart.area} fill={`url(#${gradientId})`} />
        <path
          className="admin-chart-line"
          d={chart.line} fill="none" stroke={colour}
          strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
        />

        {hover !== null && (
          <g>
            <line
              x1={chart.x(hover)} x2={chart.x(hover)} y1={PADDING.top} y2={HEIGHT - PADDING.bottom}
              stroke="rgba(255,255,255,.18)" strokeWidth="1" strokeDasharray="2 2"
            />
            <circle cx={chart.x(hover)} cy={chart.y(points[hover].value)} r="3" fill={colour} stroke="#0a0812" strokeWidth="1.5" />
          </g>
        )}

        {chart.labels.map((label, index) => (
          <text key={index} x={label.x} y={HEIGHT - 3} textAnchor="middle" fontSize="7" fill="#4d4661">
            {label.text}
          </text>
        ))}
      </svg>

      {active && (
        <div className="admin-chart-readout">
          <span className="text-[var(--admin-dim)]">
            {new Date(active.day).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
          <b className="text-[#efe7ff]">{active.value.toLocaleString("en-US")}</b>
        </div>
      )}
    </div>
  );
}

function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}
