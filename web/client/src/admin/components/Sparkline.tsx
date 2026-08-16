const WIDTH = 100;
const HEIGHT = 26;

/// Linia mică de sub fiecare indicator.
///
/// Când nu există serie, nu desenează nimic: spațiul rămâne rezervat, ca
/// rândul de carduri să nu-și schimbe înălțimea, dar o linie plată inventată
/// ar sugera „constant" acolo unde adevărul e „nu se măsoară".
export default function Sparkline({ points, colour }: { points?: number[]; colour: string }) {
  if (!points || points.length < 2) {
    return <div className="h-[26px]" aria-hidden />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const x = (index: number) => (index / (points.length - 1)) * WIDTH;
  const y = (value: number) => HEIGHT - 2 - ((value - min) / span) * (HEIGHT - 4);

  const line = points.map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;
  const gradientId = `spark-${colour.replace("#", "")}`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-[26px] w-full" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colour} stopOpacity=".26" />
          <stop offset="100%" stopColor={colour} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={colour} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
