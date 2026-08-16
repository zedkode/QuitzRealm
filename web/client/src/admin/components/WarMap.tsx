/// Silueta simplificată a României, în coordonate proiectate din longitudine și
/// latitudine. Nu e o hartă exactă și nu pretinde să fie: rolul ei e să dea
/// formă recunoscibilă panoului de campanie până când există teritorii reale.
const OUTLINE =
  "M57,9 L80,10 L135,1 L156,35 L164,87 L199,96 L178,126 L177,137 L143,131 " +
  "L101,141 L57,131 L25,111 L2,85 L17,64 L23,40 Z";

/// Nodurile: orașele mari, așezate după coordonatele lor reale. Când apar
/// județele în backend, acestea devin teritoriile cucerite.
const NODES = [
  { id: "baia-mare", x: 71, y: 19 },
  { id: "suceava", x: 127, y: 20 },
  { id: "iasi", x: 156, y: 35 },
  { id: "oradea", x: 36, y: 38 },
  { id: "cluj", x: 72, y: 47 },
  { id: "bacau", x: 141, y: 53 },
  { id: "targu-mures", x: 92, y: 54 },
  { id: "arad", x: 23, y: 65 },
  { id: "sibiu", x: 83, y: 76 },
  { id: "timisoara", x: 21, y: 78 },
  { id: "brasov", x: 114, y: 81 },
  { id: "galati", x: 164, y: 87 },
  { id: "ploiesti", x: 123, y: 102 },
  { id: "bucuresti", x: 124, y: 118 },
  { id: "craiova", x: 76, y: 121 },
  { id: "constanta", x: 178, y: 126 },
];

const LINKS: Array<[string, string]> = [
  ["baia-mare", "cluj"], ["baia-mare", "suceava"], ["suceava", "iasi"],
  ["iasi", "bacau"], ["bacau", "galati"], ["oradea", "cluj"], ["oradea", "arad"],
  ["cluj", "targu-mures"], ["targu-mures", "brasov"], ["targu-mures", "bacau"],
  ["arad", "timisoara"], ["timisoara", "craiova"], ["sibiu", "cluj"],
  ["sibiu", "brasov"], ["sibiu", "craiova"], ["brasov", "ploiesti"],
  ["ploiesti", "bucuresti"], ["bucuresti", "craiova"], ["bucuresti", "constanta"],
  ["galati", "constanta"], ["galati", "ploiesti"],
];

export type TerritoryState = "controlled" | "contested" | "locked";

const TONE: Record<TerritoryState, { fill: string; glow: string }> = {
  controlled: { fill: "#34d399", glow: "rgba(52,211,153,.55)" },
  contested: { fill: "#e0ba58", glow: "rgba(224,186,88,.5)" },
  locked: { fill: "#5b5280", glow: "rgba(124,92,255,.25)" },
};

const BY_ID = new Map(NODES.map((node) => [node.id, node]));

export default function WarMap({ states }: { states?: Record<string, TerritoryState> }) {
  return (
    <svg viewBox="0 0 201 145" className="h-auto w-full" role="img" aria-label="Harta campaniei">
      <path d={OUTLINE} fill="rgba(124,92,255,.07)" stroke="rgba(124,92,255,.28)" strokeWidth="1" strokeLinejoin="round" />

      {LINKS.map(([from, to]) => {
        const a = BY_ID.get(from);
        const b = BY_ID.get(to);
        if (!a || !b) return null;
        return (
          <line
            key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="rgba(160,130,255,.16)" strokeWidth=".6"
          />
        );
      })}

      {NODES.map((node) => {
        const tone = TONE[states?.[node.id] ?? "locked"];
        return (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="4" fill={tone.glow} opacity=".45" />
            <circle cx={node.x} cy={node.y} r="1.9" fill={tone.fill} />
          </g>
        );
      })}
    </svg>
  );
}
