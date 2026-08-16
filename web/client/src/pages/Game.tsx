import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Check, Clock3, Crosshair, Flame, Hourglass, Radio,
  Shield, Swords, Users, Zap,
} from "lucide-react";
import { connectQuizRealmSocket, quizRealmApi, type UserIdentity } from "@/lib/quizrealm";
import {
  attackableBy, freeTerritoryIds, phaseOf, playerColour, playerLabel, territoriesOf,
  type TerritoryMap, type TerritoryOwnership, type TerritorySnapshot,
} from "@/lib/territory";
import TerritoryHexMap from "@/components/TerritoryHexMap";
import { AvatarRuneRing, CornerFiligree, HeraldicAvatar, RealmCrest, RuneDivider, TerritoryMapSvg } from "@/components/MedievalSvg";

const modes = [
  { id: "duo", name: "Duo", subtitle: "Rite of two banners", players: "1 · 1", color: "#8d6bda", icon: Swords },
  { id: "classic", name: "Classic", subtitle: "Grand province campaign", players: "4 · 8", color: "#e0ba58", icon: Shield },
  { id: "blitz", name: "Blitz", subtitle: "Lightning lore siege", players: "90 sec", color: "#2bc7b4", icon: Flame },
] as const;

type Mode = (typeof modes)[number]["id"];
type MatchStatus = "active" | "paused" | "finished";

type MatchPlayer = {
  userId: string;
  score: number;
  territoriesWon: number;
  hasAnswered: boolean;
  connected: boolean;
};

type MatchSnapshot = {
  matchId: string;
  mode: Mode;
  playerCountTarget: number;
  status: "active" | "paused";
  roundNumber: number;
  totalRounds: number;
  deadlineAt: string;
  question: { id: string; categoryId: string; text: string; options: string[] | null };
  players: MatchPlayer[];
  /** Trimisă la începutul partidei și la reconectare, nu în fiecare snapshot. */
  territoryMap?: TerritoryMap;
  /** Absentă la Duo, care nu are hartă de disputat. */
  territory?: TerritorySnapshot;
};

type Conquest = { territoryId: string; winnerId: string; previousOwnerId: string | null };

type RoundResult = {
  matchId: string;
  roundNumber: number;
  totalRounds: number;
  correctAnswer: string;
  territory?: TerritorySnapshot;
  conquests?: Conquest[];
  eliminatedUserIds?: string[];
};

/** O intrare din cronica partidei: exact ce a raportat serverul, nimic inventat. */
type RealmEvent = { id: string; text: string; colour: string; round: number };

export default function Game() {
  const [mode, setMode] = useState<Mode>("duo");
  const [queued, setQueued] = useState(false);
  const [battle, setBattle] = useState(false);
  const [connection, setConnection] = useState<"connecting" | "connected" | "offline">("connecting");
  const [notice, setNotice] = useState("");
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("active");
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [me, setMe] = useState<UserIdentity | null>(null);

  // Harta vine o dată; proprietatea se schimbă la fiecare rundă. Ținute separat,
  // ca un snapshot fără hartă să nu șteargă tabla de joc de pe ecran.
  const [territoryMap, setTerritoryMap] = useState<TerritoryMap | null>(null);
  const [territory, setTerritory] = useState<TerritorySnapshot | null>(null);
  const [attackTarget, setAttackTarget] = useState<string | null>(null);
  const [events, setEvents] = useState<RealmEvent[]>([]);

  const socketRef = useRef<ReturnType<typeof connectQuizRealmSocket> | null>(null);
  // Ordinea jucătorilor fixează culorile. Trebuie să rămână stabilă pe toată
  // partida: altfel un rival și-ar schimba culoarea între runde.
  const playerOrderRef = useRef<string[]>([]);
  const [playerOrder, setPlayerOrder] = useState<string[]>([]);
  // Id-ul propriu se citește din handlere printr-un ref, nu din dependențe:
  // dacă efectul socket s-ar reface când se încarcă identitatea, conexiunea
  // s-ar rupe și s-ar relua în mijlocul unei partide.
  const myUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    quizRealmApi.me()
      .then(identity => { myUserIdRef.current = identity.id; setMe(identity); })
      .catch(() => { myUserIdRef.current = null; setMe(null); });
  }, []);

  useEffect(() => {
    const socket = connectQuizRealmSocket();
    socketRef.current = socket;

    const rememberPlayers = (players: MatchPlayer[]) => {
      const known = playerOrderRef.current;
      const added = players.map(p => p.userId).filter(id => !known.includes(id));
      if (added.length === 0) return;
      playerOrderRef.current = [...known, ...added];
      setPlayerOrder(playerOrderRef.current);
    };

    socket.on("connect", () => { setConnection("connected"); setNotice(""); });
    socket.on("disconnect", () => { setConnection("offline"); setQueued(false); setNotice("Semnal pierdut. Se reia legătura cu masa de război…"); });
    socket.io.on("reconnect_attempt", () => setConnection("connecting"));
    socket.io.on("reconnect", () => { setConnection("connected"); setNotice("Semnalul tărâmului a revenit."); });
    socket.on("connect_error", () => { setConnection("offline"); setNotice("Autentifică-te ca să ridici stindardul de matchmaking."); });
    socket.on("server:error", (payload: { message?: string }) => setNotice(payload.message ?? "Tărâmul a întors o eroare."));

    socket.on("matchmaking:queued", () => { setQueued(true); setNotice("Sigiliul tău a intrat în așteptare."); });
    socket.on("matchmaking:left", () => setQueued(false));
    socket.on("matchmaking:rejected", (payload: { reason?: string }) => {
      setQueued(false);
      setNotice(payload.reason === "email_not_verified"
        ? "Verifică-ți adresa de email înainte de campania clasată."
        : "Matchmaking-ul a respins stindardul.");
    });
    socket.on("match:found", () => { setQueued(false); setBattle(true); setMatchStatus("active"); setEvents([]); setNotice("Campanie găsită. Citește harta."); });
    socket.on("session:ready", (payload: { activeMatchId?: string | null }) => {
      if (payload.activeMatchId) setNotice("Se reia campania activă…");
    });

    socket.on("match:state", (payload: MatchSnapshot) => {
      setSnapshot(payload);
      rememberPlayers(payload.players);
      if (payload.territoryMap) setTerritoryMap(payload.territoryMap);
      if (payload.territory) setTerritory(payload.territory);
      setRoundResult(null);
      setSelected(null);
      setAttackTarget(null);
      setAnswerSubmitted(payload.players.some(player => player.hasAnswered && player.userId === myUserIdRef.current));
      setBattle(true);
      setMatchStatus(payload.status);
    });

    socket.on("match:paused", () => { setMatchStatus("paused"); setNotice("Masa de joc e în pauză cât se stabilizează tărâmul."); });
    socket.on("match:resumed", () => { setMatchStatus("active"); setNotice("Campanie reluată."); });
    socket.on("match:finished", () => { setMatchStatus("finished"); setNotice("Campanie sigilată. Rezultatul se gravează."); });

    socket.on("round:answer-accepted", () => {
      setAnswerSubmitted(true);
      setNotice("Răspuns sigilat. Se așteaptă rezolvarea rundei.");
    });
    socket.on("battle:attack-declared", (payload: { territoryId: string }) => {
      setAttackTarget(payload.territoryId);
      setNotice(`Atac declarat asupra teritoriului ${payload.territoryId}.`);
    });

    socket.on("round:result", (payload: RoundResult) => {
      setRoundResult(payload);
      setAnswerSubmitted(false);
      if (payload.territory) setTerritory(payload.territory);
      setEvents(previous => [...buildEvents(payload), ...previous].slice(0, 12));
      setNotice(`Runda ${payload.roundNumber} s-a rezolvat.`);
    });

    return () => { socket.disconnect(); };
  }, []);

  const current = modes.find(item => item.id === mode)!;

  const toggleQueue = () => {
    if (queued) {
      socketRef.current?.emit("matchmaking:leave");
      setQueued(false);
      return;
    }
    socketRef.current?.emit("matchmaking:join", {
      mode: current.id,
      playerCount: current.id === "classic" ? 4 : 2,
      categoryCodes: [],
    });
    setQueued(true);
  };

  if (battle) {
    return (
      <Battle
        snapshot={snapshot}
        matchStatus={matchStatus}
        notice={notice}
        myUserId={me?.id ?? null}
        playerOrder={playerOrder}
        territoryMap={territoryMap}
        territory={territory}
        events={events}
        selected={selected}
        onSelect={setSelected}
        answerSubmitted={answerSubmitted}
        roundResult={roundResult}
        attackTarget={attackTarget}
        onDeclareAttack={(territoryId) => {
          if (!snapshot) return;
          socketRef.current?.emit("battle:declare-attack", { matchId: snapshot.matchId, territoryId });
          setAttackTarget(territoryId);
        }}
        onAnswer={(answer) => {
          if (!snapshot || answerSubmitted) return;
          socketRef.current?.emit("round:answer", { matchId: snapshot.matchId, answer });
        }}
        onLeave={() => setBattle(false)}
      />
    );
  }

  return <div className="realm-surface min-h-[calc(100vh-72px)]">
    <div className="mx-auto max-w-[1280px] px-5 py-12 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><div className="eyebrow">War table / matchmaking</div><h1 className="mt-3 font-display text-4xl text-[#f7e7b0]">Raise your banner.</h1><p className="mt-3 text-sm text-[#aaa0ad]">Choose a rite. The realm will pair your sigil with worthy opposition.</p></div>
        <ConnectionBadge state={connection} />
      </div>
      <RuneDivider className="mt-7 h-7 w-full text-[#e0ba58]" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_335px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            {modes.map(({ id, name, subtitle, players, color, icon: Icon }) => <button key={id} onClick={() => setMode(id)} className={`engraved-frame relative min-h-52 overflow-hidden rounded-2xl p-5 text-left transition ${mode === id ? "ring-1 ring-[#e0ba58]/60" : "opacity-80 hover:opacity-100"}`}>
              <CornerFiligree className="absolute -left-3 -top-3 h-24 w-24" style={{ color }} />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/20" style={{ color }}><Icon size={21} /></div><span className="rune-chip rounded-full px-2.5 py-1 text-[10px] font-bold text-[#ddd2e4]">{players}</span></div>
                <div><div className="font-display text-xl text-[#f7e7b0]">{name}</div><div className="mt-2 text-xs text-[#aaa0ad]">{subtitle}</div></div>
                {mode === id && <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#f5dda0]"><Check size={13} /> Sigil selected</div>}
              </div>
            </button>)}
          </div>
          <div className="engraved-frame rounded-2xl p-6">
            <div className="flex items-start justify-between"><div><div className="eyebrow">Summoning rite</div><h2 className="mt-2 text-xl font-bold text-[#f7e7b0]">{queued ? "Reading the constellations…" : "Your war table awaits."}</h2></div><div className={`grid h-12 w-12 place-items-center rounded-xl ${queued ? "animate-pulse bg-[#8d6bda]/20 text-[#d3c0ff]" : "bg-[#e0ba58]/10 text-[#e3c36a]"}`}><Crosshair size={22} /></div></div>
            {notice && <div className="mt-4 border border-[#8d6bda]/35 bg-[#8d6bda]/10 px-4 py-3 text-xs text-[#dacbff]">{notice}</div>}
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><Info label="Rite" value={current.name} /><Info label="Prophecy" value={current.id === "blitz" ? "~12 sec" : "~24 sec"} /></div>
            <button onClick={toggleQueue} className="sigil-button mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-extrabold">{queued ? <><Clock3 size={17} /> Seeking rival…</> : <><Swords size={17} /> Begin matchmaking</>}</button>
          </div>
        </div>
        <aside className="space-y-5"><RealmPulse /></aside>
      </div>
    </div>
  </div>;
}

/** Traduce rezultatul rundei în intrări de cronică. Doar fapte raportate. */
function buildEvents(result: RoundResult): RealmEvent[] {
  const entries: RealmEvent[] = [];
  for (const conquest of result.conquests ?? []) {
    entries.push({
      id: `${result.roundNumber}-c-${conquest.territoryId}`,
      text: conquest.previousOwnerId
        ? `Teritoriul ${conquest.territoryId} a fost cucerit`
        : `Teritoriul ${conquest.territoryId} a fost revendicat`,
      colour: "#e0ba58",
      round: result.roundNumber,
    });
  }
  for (const userId of result.eliminatedUserIds ?? []) {
    entries.push({ id: `${result.roundNumber}-e-${userId}`, text: "Un stindard a fost eliminat", colour: "#e05563", round: result.roundNumber });
  }
  return entries;
}

function RealmPulse() {
  return <div className="engraved-frame relative overflow-hidden rounded-2xl p-5">
    <TerritoryMapSvg className="pointer-events-none absolute -right-20 -top-8 h-48 w-80 opacity-[.1]" />
    <div className="relative">
      <div className="flex items-center gap-2 text-sm font-bold text-[#f7e7b0]"><Users size={16} className="text-[#e3c36a]" /> Masa de război</div>
      <p className="mt-4 text-sm leading-6 text-[#aaa0ad]">Modul Clasic dispută o hartă de teritorii. Duo și Blitz se joacă pe scor: doi jucători, fără hartă.</p>
    </div>
  </div>;
}

function ConnectionBadge({ state }: { state: "connecting" | "connected" | "offline" }) {
  const text = state === "connected" ? "Realm signal live" : state === "connecting" ? "Tuning sigils…" : "Offline · sign in";
  return <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${state === "connected" ? "border-[#2bc7b4]/30 bg-[#2bc7b4]/8 text-[#a7e7de]" : "border-[#8d6bda]/35 bg-[#8d6bda]/10 text-[#dacbff]"}`}><Radio size={14} />{text}</div>;
}

function Info({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return <div className="rounded-xl border border-white/5 bg-black/20 p-3">
    <div className="text-[10px] uppercase tracking-wider text-[#897e8d]">{label}</div>
    <div className={`mt-1 text-sm font-bold ${gold ? "text-[#e3c36a]" : "text-[#e9dfea]"}`}>{value}</div>
  </div>;
}

/// Inelul preia culoarea jucătorului, care vine din paletă ca hex, nu ca o
/// clasă Tailwind — de aceea `style`, nu `className`.
function Avatar({ variant = "oracle", colour }: { variant?: "astromancer" | "runeknight" | "oracle"; colour: string }) {
  return <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
    <HeraldicAvatar variant={variant} className="h-full w-full" />
    <AvatarRuneRing className="absolute inset-0 h-full w-full" style={{ color: colour }} />
  </div>;
}

// --- Ecranul de bătălie ----------------------------------------------------

interface BattleProps {
  snapshot: MatchSnapshot | null;
  matchStatus: MatchStatus;
  notice: string;
  myUserId: string | null;
  playerOrder: string[];
  territoryMap: TerritoryMap | null;
  territory: TerritorySnapshot | null;
  events: RealmEvent[];
  selected: string | null;
  onSelect: (value: string) => void;
  answerSubmitted: boolean;
  roundResult: RoundResult | null;
  attackTarget: string | null;
  onDeclareAttack: (territoryId: string) => void;
  onAnswer: (value: string) => void;
  onLeave: () => void;
}

export function Battle(props: BattleProps) {
  const {
    snapshot, matchStatus, notice, myUserId, playerOrder, territoryMap, territory,
    events, selected, onSelect, answerSubmitted, roundResult, attackTarget,
    onDeclareAttack, onAnswer, onLeave,
  } = props;

  const secondsLeft = useCountdown(snapshot?.deadlineAt ?? null, matchStatus);
  const ownership: TerritoryOwnership = territory?.ownership ?? {};
  const hasMap = territoryMap != null && Object.keys(ownership).length > 0;
  const phase = hasMap ? phaseOf(ownership) : null;

  const attackable = useMemo(
    () => (hasMap && myUserId && phase === "battle" ? attackableBy(territoryMap, ownership, myUserId) : []),
    [hasMap, territoryMap, ownership, myUserId, phase],
  );

  const totals = useMemo(() => {
    const ids = Object.keys(ownership);
    const free = freeTerritoryIds(ownership).length;
    return { total: ids.length, free, claimed: ids.length - free };
  }, [ownership]);

  const answers = snapshot?.question.options ?? [];
  const questionText = snapshot?.question.text ?? "Se așteaptă ca tărâmul să dezvăluie următoarea întrebare…";
  const players = snapshot?.players ?? [];

  return <div className="realm-surface min-h-[calc(100vh-72px)]">
    <div className="mx-auto max-w-[1600px] px-4 py-5 lg:px-8">
      <BattleHeader
        onLeave={onLeave}
        matchStatus={matchStatus}
        mode={snapshot?.mode ?? "duo"}
        roundNumber={snapshot?.roundNumber ?? 0}
        totalRounds={snapshot?.totalRounds ?? 0}
        phase={phase}
        secondsLeft={secondsLeft}
      />

      {notice && <div className="mb-4 border border-[#8d6bda]/30 bg-[#8d6bda]/10 px-4 py-3 text-xs text-[#dacbff]">{notice}</div>}

      <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)_290px]">
        <aside className="order-2 space-y-4 xl:order-1">
          <CampaignSeal claimed={totals.claimed} total={totals.total} phase={phase} matchStatus={matchStatus} />
          <InfluencePressure players={players} ownership={ownership} playerOrder={playerOrder} myUserId={myUserId} totalTerritories={totals.total} />
          <ProvinceStrength ownership={ownership} myUserId={myUserId} totals={totals} />
        </aside>

        <section className="order-1 space-y-4 xl:order-2">
          <MapPanel
            territoryMap={territoryMap}
            ownership={ownership}
            contestedTerritoryId={territory?.contestedTerritoryId ?? null}
            myUserId={myUserId}
            playerOrder={playerOrder}
            attackable={attackable}
            selectedTargetId={attackTarget}
            onSelectTarget={phase === "battle" ? onDeclareAttack : undefined}
            phase={phase}
            claimed={totals.claimed}
            total={totals.total}
          />
          <QuestionPanel
            questionText={questionText}
            answers={answers}
            selected={selected}
            onSelect={onSelect}
            onAnswer={onAnswer}
            answerSubmitted={answerSubmitted}
            disabled={snapshot == null || matchStatus !== "active"}
            secondsLeft={secondsLeft}
            roundResult={roundResult}
            categoryId={snapshot?.question.categoryId ?? null}
            roundNumber={snapshot?.roundNumber ?? 0}
            totalRounds={snapshot?.totalRounds ?? 0}
          />
        </section>

        <aside className="order-3 space-y-4">
          <FrontlinePanel
            attackable={attackable}
            ownership={ownership}
            playerOrder={playerOrder}
            myUserId={myUserId}
            attackTarget={attackTarget}
            onDeclareAttack={onDeclareAttack}
            phase={phase}
          />
          <BannerRoster players={players} playerOrder={playerOrder} myUserId={myUserId} />
          <RealmChronicle events={events} />
        </aside>
      </div>
    </div>
  </div>;
}

/** Timpul rămas până la `deadlineAt`. Serverul e sursa; aici doar numărăm. */
function useCountdown(deadlineAt: string | null, matchStatus: MatchStatus): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (deadlineAt == null || matchStatus !== "active") return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadlineAt, matchStatus]);
  if (deadlineAt == null) return null;
  const remaining = Math.max(0, new Date(deadlineAt).getTime() - now);
  return Math.ceil(remaining / 1000);
}

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "--:--";
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function BattleHeader({ onLeave, matchStatus, mode, roundNumber, totalRounds, phase, secondsLeft }: {
  onLeave: () => void; matchStatus: MatchStatus; mode: Mode; roundNumber: number; totalRounds: number;
  phase: "capture" | "battle" | null; secondsLeft: number | null;
}) {
  const modeName = modes.find(item => item.id === mode)?.name ?? mode;
  const statusText = matchStatus === "paused" ? "Masă în pauză" : matchStatus === "finished" ? "Campanie sigilată" : `Rit activ · ${modeName}`;
  return <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-4">
      <button onClick={onLeave} className="flex items-center gap-2 text-sm text-[#aaa0ad] hover:text-[#f7e7b0]"><ArrowLeft size={16} /> Retrage stindardul</button>
      <div className="hidden h-8 w-px bg-white/10 sm:block" />
      <div className="hidden items-center gap-2 sm:flex">
        <RealmCrest className="h-7 w-7 text-[#e3c36a]" />
        <div>
          <div className="font-display text-sm tracking-wide text-[#f7e7b0]">CAMPANIE</div>
          <div className="text-[10px] uppercase tracking-widest text-[#8b8194]">
            {phase == null ? "fără hartă" : phase === "capture" ? "faza de cucerire" : "faza de luptă"}
          </div>
        </div>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="rune-chip flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-[#ddcfff]"><Radio size={13} />{statusText}</div>
      <div className="engraved-frame flex items-center gap-2 rounded-xl px-3 py-2">
        <Hourglass size={15} className="text-[#e3c36a]" />
        <span className="font-display text-lg text-[#f7e7b0]">{formatSeconds(secondsLeft)}</span>
      </div>
      <div className="engraved-frame rounded-xl px-3 py-2 text-center">
        <div className="text-[9px] uppercase tracking-widest text-[#8b8194]">Runda</div>
        <div className="font-display text-sm text-[#e3c36a]">{roundNumber || "–"} / {totalRounds || "–"}</div>
      </div>
    </div>
  </header>;
}

function CampaignSeal({ claimed, total, phase, matchStatus }: {
  claimed: number; total: number; phase: "capture" | "battle" | null; matchStatus: MatchStatus;
}) {
  const percent = total > 0 ? Math.round((claimed / total) * 100) : 0;
  return <div className="engraved-frame relative overflow-hidden rounded-2xl p-5">
    <CornerFiligree className="absolute -left-3 -top-3 h-20 w-20 text-[#e0ba58]/60" />
    <div className="relative flex items-start justify-between gap-3">
      <div>
        <div className="eyebrow">Sigiliul campaniei</div>
        <p className="mt-3 max-w-[9rem] text-xs leading-5 text-[#aaa0ad]">
          {matchStatus === "finished" ? "Campania s-a încheiat."
            : phase === null ? "Rit pe scor: câștigă cine adună mai multe răspunsuri corecte."
            : phase === "battle" ? "Harta e plină. Granițele se dispută."
            : "Tărâmul e în mișcare. Teritoriile libere se revendică."}
        </p>
      </div>
      <div className="relative grid h-16 w-16 shrink-0 rotate-45 place-items-center rounded-xl border border-[#e0ba58]/45 bg-[#1a1330]">
        <RealmCrest className="h-7 w-7 -rotate-45 text-[#e3c36a]" />
      </div>
    </div>
    <div className="mt-5">
      <div className="flex justify-between text-xs"><span className="text-[#8b8194]">Hartă revendicată</span><b className="text-[#e3c36a]">{total > 0 ? `${percent}%` : "–"}</b></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-[#8d6bda] to-[#2bc7b4] transition-[width] duration-700" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 text-[10px] text-[#6f6875]">{total > 0 ? `${claimed} din ${total} teritorii` : "Modul acesta nu dispută o hartă"}</div>
    </div>
  </div>;
}

function InfluencePressure({ players, ownership, playerOrder, myUserId, totalTerritories }: {
  players: MatchPlayer[]; ownership: TerritoryOwnership; playerOrder: string[]; myUserId: string | null; totalTerritories: number;
}) {
  const rows = players
    .map(player => {
      const held = totalTerritories > 0 ? territoriesOf(ownership, player.userId).length : player.territoriesWon;
      return {
        userId: player.userId,
        held,
        score: player.score,
        connected: player.connected,
        percent: totalTerritories > 0 ? Math.round((held / totalTerritories) * 100) : 0,
        colour: playerColour(player.userId, playerOrder, myUserId),
        label: playerLabel(player.userId, playerOrder, myUserId),
      };
    })
    .sort((a, b) => b.held - a.held || b.score - a.score);

  const freeHeld = totalTerritories > 0 ? freeTerritoryIds(ownership).length : 0;
  const freePercent = totalTerritories > 0 ? Math.round((freeHeld / totalTerritories) * 100) : 0;

  return <div className="panel rounded-2xl p-5">
    <div className="flex items-center justify-between"><span className="eyebrow">Presiunea influenței</span></div>
    <div className="mt-4 space-y-3">
      {rows.length === 0 && <div className="text-xs text-[#6f6875]">Se așteaptă stindardele.</div>}
      {rows.map(row => <div key={row.userId}>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.colour, boxShadow: `0 0 10px ${row.colour}` }} />
          <span className={`flex-1 truncate ${row.userId === myUserId ? "font-bold text-[#f7e7b0]" : "text-[#c3b8c9]"}`}>{row.label}</span>
          {!row.connected && <span className="text-[9px] uppercase tracking-wider text-[#e0919b]">deconectat</span>}
          <b className="text-[#aaa0ad]">{totalTerritories > 0 ? `${row.percent}%` : row.score}</b>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${totalTerritories > 0 ? row.percent : 0}%`, background: row.colour }} />
        </div>
      </div>)}
      {/* Teritoriile libere închid suta: fără rândul ăsta procentele de mai sus
          par să nu se adune și cititorul crede că lipsește un jucător. */}
      {totalTerritories > 0 && freePercent > 0 && <div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3a3550]" />
          <span className="flex-1 truncate text-[#8b8194]">Liber</span>
          <b className="text-[#8b8194]">{freePercent}%</b>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-[#3a3550]" style={{ width: `${freePercent}%` }} />
        </div>
      </div>}
    </div>
  </div>;
}

function ProvinceStrength({ ownership, myUserId, totals }: {
  ownership: TerritoryOwnership; myUserId: string | null; totals: { total: number; free: number; claimed: number };
}) {
  const mine = myUserId ? territoriesOf(ownership, myUserId).length : 0;
  const rivals = totals.claimed - mine;
  const share = totals.total > 0 ? Math.round((mine / totals.total) * 100) : 0;

  // Inelul e desenat din trei arce proporționale, nu dintr-o valoare fixă.
  const circumference = 2 * Math.PI * 42;
  const segments = totals.total > 0
    ? [
        { value: mine, colour: "#e0ba58" },
        { value: rivals, colour: "#8d6bda" },
        { value: totals.free, colour: "#3a3550" },
      ]
    : [];
  let offset = 0;

  return <div className="engraved-frame rounded-2xl p-5">
    <div className="eyebrow">Puterea provinciilor</div>
    {totals.total === 0
      ? <p className="mt-4 text-xs leading-5 text-[#6f6875]">Modul curent se joacă pe scor, fără hartă de teritorii.</p>
      : <div className="mt-4 flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1726" strokeWidth="11" />
              {segments.map((segment, index) => {
                const length = (segment.value / totals.total) * circumference;
                const dash = `${length} ${circumference - length}`;
                const element = <circle key={index} cx="50" cy="50" r="42" fill="none" stroke={segment.colour} strokeWidth="11" strokeDasharray={dash} strokeDashoffset={-offset} />;
                offset += length;
                return element;
              })}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-display text-xl text-[#f7e7b0]">{share}%</div>
                <div className="text-[9px] uppercase tracking-widest text-[#8b8194]">al tău</div>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2 text-xs">
            <StrengthRow colour="#e0ba58" label="Ale tale" value={mine} />
            <StrengthRow colour="#8d6bda" label="Ale rivalilor" value={rivals} />
            <StrengthRow colour="#3a3550" label="Libere" value={totals.free} />
          </div>
        </div>}
  </div>;
}

function StrengthRow({ colour, label, value }: { colour: string; label: string; value: number }) {
  return <div className="flex items-center gap-2">
    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: colour }} />
    <span className="flex-1 truncate text-[#a197a5]">{label}</span>
    <b className="text-[#e9dfea]">{value}</b>
  </div>;
}

function MapPanel({ territoryMap, ownership, contestedTerritoryId, myUserId, playerOrder, attackable, selectedTargetId, onSelectTarget, phase, claimed, total }: {
  territoryMap: TerritoryMap | null; ownership: TerritoryOwnership; contestedTerritoryId: string | null;
  myUserId: string | null; playerOrder: string[]; attackable: string[]; selectedTargetId: string | null;
  onSelectTarget?: (territoryId: string) => void; phase: "capture" | "battle" | null; claimed: number; total: number;
}) {
  return <section className="engraved-frame tactical-grid relative overflow-hidden rounded-2xl p-4">
    <div className="relative z-10 flex items-start justify-between gap-3">
      <div>
        <div className="eyebrow">Frontiera astrală</div>
        <div className="mt-1 text-lg font-bold text-[#f7e7b0]">Masa teritoriilor</div>
      </div>
      {contestedTerritoryId && <div className="rounded-lg border border-[#e0ba58]/25 bg-black/35 px-3 py-2 text-center">
        <div className="text-[10px] uppercase tracking-widest text-[#a89ca9]">În dispută</div>
        <div className="font-display text-sm text-[#e3c36a]">{contestedTerritoryId}</div>
      </div>}
    </div>

    {territoryMap && total > 0
      ? <TerritoryHexMap
          map={territoryMap}
          ownership={ownership}
          contestedTerritoryId={contestedTerritoryId}
          myUserId={myUserId}
          playerOrder={playerOrder}
          attackable={attackable}
          selectedTargetId={selectedTargetId}
          onSelectTarget={onSelectTarget}
          className="relative z-10 mx-auto mt-3 h-auto max-h-[38vh] w-full"
        />
      : <div className="relative z-10 grid min-h-[280px] place-items-center px-6 text-center">
          <div>
            <TerritoryMapSvg className="mx-auto h-24 w-40 text-[#e0ba58] opacity-20" />
            <p className="mt-4 text-sm text-[#8b8194]">
              {phase == null ? "Modul acesta se joacă pe scor: nu are hartă de teritorii." : "Se așteaptă harta de la server…"}
            </p>
          </div>
        </div>}

    {/* Legenda culorilor, nu încă o bară de progres: procentul hărții e deja în
        panoul din stânga, iar pe hartă întrebarea reală e „a cui e culoarea". */}
    {total > 0 && <div className="relative z-10 mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border border-white/10 bg-[#090a12]/80 px-4 py-2.5 backdrop-blur">
      <span className="text-[10px] uppercase tracking-widest text-[#6f6875]">Stăpânire</span>
      {playerOrder.map(userId => <span key={userId} className="flex items-center gap-1.5 text-xs">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: playerColour(userId, playerOrder, myUserId) }} />
        <span className={userId === myUserId ? "font-bold text-[#f7e7b0]" : "text-[#a197a5]"}>{playerLabel(userId, playerOrder, myUserId)}</span>
      </span>)}
      <span className="flex items-center gap-1.5 text-xs">
        <span className="h-2.5 w-2.5 rounded-sm bg-[#2a2740]" />
        <span className="text-[#6f6875]">Liber</span>
      </span>
    </div>}
  </section>;
}

function QuestionPanel({ questionText, answers, selected, onSelect, onAnswer, answerSubmitted, disabled, secondsLeft, roundResult, categoryId, roundNumber, totalRounds }: {
  questionText: string; answers: string[]; selected: string | null; onSelect: (value: string) => void;
  onAnswer: (value: string) => void; answerSubmitted: boolean; disabled: boolean; secondsLeft: number | null;
  roundResult: RoundResult | null; categoryId: string | null; roundNumber: number; totalRounds: number;
}) {
  const urgent = secondsLeft != null && secondsLeft <= 5;
  return <div className="engraved-frame rounded-2xl p-5">
    <div className="flex justify-between gap-3">
      <div>
        <div className="eyebrow">Provocarea de lore</div>
        <h2 className="mt-2 max-w-2xl font-display text-xl leading-tight text-[#f7e7b0]">{questionText}</h2>
      </div>
      <div className="hidden text-right sm:block">
        <div className={`flex items-center gap-1 ${urgent ? "text-[#ff8a9b]" : "text-[#e3c36a]"}`}>
          <Clock3 size={15} /><span className="font-display text-xl">{formatSeconds(secondsLeft)}</span>
        </div>
        <div className="mt-1 text-[10px] uppercase tracking-widest text-[#958a98]">Timp de sigilare</div>
      </div>
    </div>

    {/* Două coloane pe ecran lat: patru variante una sub alta împing întrebarea
        și butonul sub fold exact când jucătorul are 12 secunde să răspundă. */}
    <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
      {answers.length === 0 && <div className="rounded-xl border border-white/8 bg-black/15 px-4 py-6 text-center text-sm text-[#6f6875] lg:col-span-2">Se așteaptă întrebarea rundei…</div>}
      {answers.map((answer, index) => {
        const isCorrect = roundResult != null && roundResult.correctAnswer === answer;
        const isChosenWrong = roundResult != null && selected === answer && !isCorrect;
        return <button
          key={answer}
          disabled={disabled || answerSubmitted || roundResult != null}
          onClick={() => onSelect(answer)}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm disabled:cursor-not-allowed ${
            isCorrect ? "border-[#2bc7b4]/70 bg-[#2bc7b4]/12 text-[#c6f3ec]"
              : isChosenWrong ? "border-[#e05563]/60 bg-[#e05563]/10 text-[#ffb5bf]"
              : selected === answer ? "border-[#e0ba58]/60 bg-[#e0ba58]/10 text-[#f7e7b0]"
              : "border-white/8 bg-black/15 text-[#c0b5c4] hover:border-[#8d6bda]/55 hover:bg-[#8d6bda]/10"
          }`}
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/7 text-xs font-bold text-[#d6cbe0]">{String.fromCharCode(65 + index)}</span>
          <span className="flex-1">{answer}</span>
          {isCorrect && <Check size={16} className="text-[#2bc7b4]" />}
          {selected === answer && roundResult == null && <Check size={16} className="text-[#e3c36a]" />}
        </button>;
      })}
    </div>

    <button
      disabled={!selected || answerSubmitted || disabled || roundResult != null}
      onClick={() => selected && onAnswer(selected)}
      className="sigil-button mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {answerSubmitted ? "Răspuns sigilat" : "Sigilează răspunsul"} <Zap size={16} />
    </button>

    <div className="mt-3 flex justify-between text-xs text-[#aaa0ad]">
      <span>Întrebarea {roundNumber || 0} din {totalRounds || 0}</span>
      <span>{roundResult ? `Corect: ${roundResult.correctAnswer}` : `Codex · ${categoryId ?? "se așteaptă"}`}</span>
    </div>
  </div>;
}

function FrontlinePanel({ attackable, ownership, playerOrder, myUserId, attackTarget, onDeclareAttack, phase }: {
  attackable: string[]; ownership: TerritoryOwnership; playerOrder: string[]; myUserId: string | null;
  attackTarget: string | null; onDeclareAttack: (territoryId: string) => void; phase: "capture" | "battle" | null;
}) {
  return <div className="panel rounded-2xl p-5">
    <div className="flex items-center justify-between"><span className="eyebrow">Linia frontului</span>{attackable.length > 0 && <span className="text-[10px] text-[#a7e7de]">{attackable.length} ținte</span>}</div>
    {/* Lista are scroll propriu: pe o hartă plină pot fi peste 20 de ținte, iar
        fără limită ar împinge stindardele și cronica în afara ecranului. */}
    <div className="mt-4 max-h-[34vh] space-y-2 overflow-y-auto pr-1">
      {phase !== "battle" && <p className="text-xs leading-5 text-[#6f6875]">{phase === "capture" ? "Cât timp mai există teritorii libere, se revendică, nu se atacă." : "Fără hartă, nu există linie a frontului."}</p>}
      {phase === "battle" && attackable.length === 0 && <p className="text-xs leading-5 text-[#6f6875]">Niciun vecin de atacat în runda aceasta.</p>}
      {attackable.map(territoryId => {
        const owner = ownership[territoryId] ?? null;
        const colour = playerColour(owner, playerOrder, myUserId);
        const isTarget = attackTarget === territoryId;
        return <button
          key={territoryId}
          onClick={() => onDeclareAttack(territoryId)}
          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left ${isTarget ? "border-[#ff8a9b]/60 bg-[#e05563]/12" : "border-white/8 bg-black/20 hover:border-[#2bc7b4]/45"}`}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: `${colour}22`, color: colour }}><Crosshair size={15} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-[#e9dfea]">{territoryId}</span>
            <span className="block truncate text-[10px] text-[#8b8194]">{owner ? playerLabel(owner, playerOrder, myUserId) : "liber"}</span>
          </span>
          {isTarget && <span className="text-[9px] font-bold uppercase tracking-wider text-[#ff8a9b]">declarat</span>}
        </button>;
      })}
    </div>
  </div>;
}

function BannerRoster({ players, playerOrder, myUserId }: { players: MatchPlayer[]; playerOrder: string[]; myUserId: string | null }) {
  const variants = ["runeknight", "astromancer", "oracle"] as const;
  return <div className="panel rounded-2xl p-5">
    <div className="flex items-center justify-between"><span className="eyebrow">Stindarde</span><span className="text-xs text-[#a7e7de]">LIVE</span></div>
    <div className="mt-4 space-y-4">
      {players.length === 0 && <div className="text-xs text-[#6f6875]">Se așteaptă jucătorii.</div>}
      {players.map((player, index) => {
        const colour = playerColour(player.userId, playerOrder, myUserId);
        return <div key={player.userId} className="flex items-center gap-3">
          <Avatar variant={variants[index % variants.length]} colour={colour} />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-sm">
              <span className={player.userId === myUserId ? "font-bold text-[#f7e7b0]" : "text-[#c3b8c9]"}>{playerLabel(player.userId, playerOrder, myUserId)}</span>
              <span className="text-xs text-[#aaa0ad]">{player.score}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: colour }} />
              <span className="text-[10px] text-[#8b8194]">{player.territoriesWon} teritorii{player.hasAnswered ? " · a răspuns" : ""}</span>
            </div>
          </div>
        </div>;
      })}
    </div>
  </div>;
}

function RealmChronicle({ events }: { events: RealmEvent[] }) {
  return <div className="panel rounded-2xl p-5">
    <div className="eyebrow">Cronica tărâmului</div>
    <div className="mt-4 space-y-3">
      {events.length === 0 && <p className="text-xs text-[#6f6875]">Nimic încă. Evenimentele apar pe măsură ce rundele se rezolvă.</p>}
      {events.map(event => <div key={event.id} className="flex items-start gap-2 text-xs">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: event.colour }} />
        <span className="flex-1 text-[#c3b8c9]">{event.text}</span>
        <span className="shrink-0 text-[10px] text-[#6f6875]">R{event.round}</span>
      </div>)}
    </div>
  </div>;
}
