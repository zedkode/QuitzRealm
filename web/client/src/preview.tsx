// FIȘIER TEMPORAR — doar pentru verificarea vizuală a ecranului de bătălie.
// Se șterge după captură. Datele imită exact forma trimisă de server.
import { createRoot } from "react-dom/client";
import { Battle } from "./pages/Game";
import type { Territory, TerritoryMap } from "./lib/territory";
import "./index.css";

const HEX_DIRECTIONS = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];

/** Aceeași spirală ca `spiralCells` din realtime. */
function spiralCells(count: number) {
  const cells = [{ q: 0, r: 0 }];
  let ring = 1;
  while (cells.length < count) {
    let current = { q: -ring, r: ring };
    for (const direction of HEX_DIRECTIONS) {
      for (let step = 0; step < ring && cells.length < count; step += 1) {
        cells.push(current);
        current = { q: current.q + direction.q, r: current.r + direction.r };
      }
      if (cells.length >= count) break;
    }
    ring += 1;
  }
  return cells;
}

function buildMap(total: number): TerritoryMap {
  const cells = spiralCells(total);
  const key = (c: { q: number; r: number }) => `${c.q},${c.r}`;
  const byKey = new Map<string, string>();
  cells.forEach((c, i) => byKey.set(key(c), `t${i}`));
  const territories: Territory[] = cells.map((coordinates, index) => ({
    id: `t${index}`,
    coordinates,
    neighbourIds: HEX_DIRECTIONS
      .map(d => byKey.get(key({ q: coordinates.q + d.q, r: coordinates.r + d.r })))
      .filter((id): id is string => id !== undefined),
  }));
  return { playerCount: 4, territories, bases: {} };
}

const ME = "me-0001";
const RIVALS = ["riv-0002", "riv-0003", "riv-0004"];
const map = buildMap(30);

const scenario = new URLSearchParams(window.location.search).get("scenario") ?? "capture";

const ownership: Record<string, string | null> = {};
map.territories.forEach((territory, index) => {
  // Faza de luptă: harta e plină, deci nu mai există teritorii libere.
  if (scenario !== "battle" && (index % 7 === 3 || index > 25)) ownership[territory.id] = null;
  else if (index % 4 === 0) ownership[territory.id] = ME;
  else ownership[territory.id] = RIVALS[index % 3];
});
const contestedTerritoryId = scenario === "battle" ? null : "t26";
const noMap = scenario === "nomap";

const players = [ME, ...RIVALS].map((userId, index) => ({
  userId,
  score: 1840 - index * 120,
  territoriesWon: Object.values(ownership).filter(o => o === userId).length,
  hasAnswered: index === 1,
  connected: index !== 3,
}));

createRoot(document.getElementById("root")!).render(
  <Battle
    snapshot={{
      matchId: "preview",
      mode: "classic",
      playerCountTarget: 4,
      status: "active",
      roundNumber: 7,
      totalRounds: 12,
      deadlineAt: new Date(Date.now() + 18_000).toISOString(),
      question: {
        id: "q1",
        categoryId: "Istoria tărâmului",
        text: "Care dintre aceste orașe a fost prima capitală a Țării Românești?",
        options: ["Câmpulung", "Curtea de Argeș", "Târgoviște", "București"],
      },
      players,
      territoryMap: noMap ? undefined : map,
      territory: noMap ? undefined : { ownership, contestedTerritoryId },
    }}
    matchStatus="active"
    notice=""
    myUserId={ME}
    playerOrder={[ME, ...RIVALS]}
    territoryMap={noMap ? null : map}
    territory={noMap ? null : { ownership, contestedTerritoryId }}
    events={[
      { id: "1", text: "Teritoriul t18 a fost cucerit", colour: "#e0ba58", round: 6 },
      { id: "2", text: "Teritoriul t12 a fost revendicat", colour: "#e0ba58", round: 6 },
      { id: "3", text: "Un stindard a fost eliminat", colour: "#e05563", round: 5 },
    ]}
    selected="Curtea de Argeș"
    onSelect={() => {}}
    answerSubmitted={false}
    roundResult={null}
    attackTarget={null}
    onDeclareAttack={() => {}}
    onAnswer={() => {}}
    onLeave={() => {}}
  />
);
