export interface DonutSlice {
  label: string;
  value: number;
  colour: string;
}

const SIZE = 120;
const RADIUS = 46;
const STROKE = 15;

/// Inelul cu distribuția, desenat din arce de cerc.
///
/// Când totalul e zero desenează doar inelul gol: un cerc plin de o singură
/// culoare ar arăta ca „totul într-o categorie", nu ca „nu există date".
export default function DonutChart({ slices, centreLabel }: { slices: DonutSlice[]; centreLabel: string }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const circumference = 2 * Math.PI * RADIUS;

  let offset = 0;
  const arcs = slices.map((slice) => {
    const length = total === 0 ? 0 : (slice.value / total) * circumference;
    const arc = { ...slice, length, offset };
    offset += length;
    return arc;
  });

  return (
    <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full -rotate-90" role="img" aria-label="Distribuție">
        <circle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={STROKE}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
            fill="none" stroke={arc.colour} strokeWidth={STROKE}
            strokeDasharray={`${arc.length} ${circumference - arc.length}`}
            strokeDashoffset={-arc.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="block text-[8px] uppercase tracking-[.14em] text-[var(--admin-dim)]">Total</span>
        <span className="block text-[17px] font-bold leading-tight text-[#efe7ff]">{centreLabel}</span>
      </div>
    </div>
  );
}
