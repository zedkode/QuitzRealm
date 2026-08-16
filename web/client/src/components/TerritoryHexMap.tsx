import { useMemo } from "react";
import {
  FREE_COLOUR,
  hexPoints,
  layoutMap,
  playerColour,
  type TerritoryMap,
  type TerritoryOwnership,
} from "@/lib/territory";

interface TerritoryHexMapProps {
  map: TerritoryMap;
  ownership: TerritoryOwnership;
  contestedTerritoryId: string | null;
  myUserId: string | null;
  playerOrder: readonly string[];
  attackable: readonly string[];
  selectedTargetId: string | null;
  onSelectTarget?: (territoryId: string) => void;
  className?: string;
}

/**
 * Harta teritoriilor, desenată din `territoryMap`-ul trimis de server.
 *
 * Nu inventează nimic: fiecare hexagon vine din `map.territories`, iar culoarea
 * din `ownership`. O celulă fără proprietar rămâne liberă, nu primește o culoare
 * decorativă — altfel harta ar minți despre cine cât deține.
 */
export default function TerritoryHexMap({
  map,
  ownership,
  contestedTerritoryId,
  myUserId,
  playerOrder,
  attackable,
  selectedTargetId,
  onSelectTarget,
  className,
}: TerritoryHexMapProps) {
  const layout = useMemo(() => layoutMap(map), [map]);
  const attackableSet = useMemo(() => new Set(attackable), [attackable]);

  return (
    <svg
      viewBox={layout.viewBox}
      className={className}
      role="img"
      aria-label={`Harta partidei, ${map.territories.length} teritorii`}
    >
      <defs>
        <filter id="territory-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {map.territories.map((territory) => {
        const centre = layout.centres[territory.id];
        const owner = ownership[territory.id] ?? null;
        const colour = playerColour(owner, playerOrder, myUserId);
        const isContested = territory.id === contestedTerritoryId;
        const isTarget = territory.id === selectedTargetId;
        const isAttackable = attackableSet.has(territory.id);
        const interactive = isAttackable && onSelectTarget != null;

        const stroke = isTarget
          ? "#ff8a9b"
          : isContested
            ? "#f7e7b0"
            : isAttackable
              ? "#2bc7b4"
              : "rgba(224,186,88,.34)";

        return (
          <g
            key={territory.id}
            onClick={interactive ? () => onSelectTarget(territory.id) : undefined}
            className={interactive ? "cursor-pointer" : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? `Atacă teritoriul ${territory.id}` : undefined}
          >
            <polygon
              points={hexPoints(centre, layout.radius)}
              fill={owner == null ? FREE_COLOUR : colour}
              fillOpacity={owner == null ? 0.5 : 0.82}
              stroke={stroke}
              strokeWidth={isTarget || isContested ? 1.1 : 0.42}
              filter={isContested || isTarget ? "url(#territory-glow)" : undefined}
            />
            {isContested && (
              <circle
                cx={centre.x}
                cy={centre.y}
                r={layout.radius * 0.22}
                fill="#f7e7b0"
                fillOpacity={0.9}
              >
                <animate
                  attributeName="fill-opacity"
                  values="0.9;0.25;0.9"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            )}
            {isTarget && (
              <circle cx={centre.x} cy={centre.y} r={layout.radius * 0.28} fill="#ff8a9b" fillOpacity={0.85} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
