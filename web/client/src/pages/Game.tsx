import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, Check, Clock3, Crosshair, Flame, MapPin, Radio,
  Shield, Sparkles, Swords, Users,
} from "lucide-react";
import { connectQuizRealmSocket } from "@/lib/quizrealm";
import { realmAssets } from "@/lib/realmAssets";
import { AvatarRuneRing, CornerFiligree, HeraldicAvatar, RuneDivider, TerritoryMapSvg } from "@/components/MedievalSvg";

const modes = [
  { id: "duo", name: "Duo", subtitle: "Rite of two banners", players: "1 · 1", color: "#8d6bda", icon: Swords },
  { id: "classic", name: "Classic", subtitle: "Grand province campaign", players: "4 · 8", color: "#e0ba58", icon: Shield },
  { id: "blitz", name: "Blitz", subtitle: "Lightning lore siege", players: "90 sec", color: "#2bc7b4", icon: Flame },
] as const;

type Mode = (typeof modes)[number]["id"];
type MatchStatus = "active" | "paused" | "finished";

export default function Game() {
  const [mode, setMode] = useState<Mode>("duo");
  const [queued, setQueued] = useState(false);
  const [battle, setBattle] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [connection, setConnection] = useState<"connecting" | "connected" | "offline">("connecting");
  const [notice, setNotice] = useState("");
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("active");
  const socketRef = useRef<ReturnType<typeof connectQuizRealmSocket> | null>(null);

  useEffect(() => {
    const socket = connectQuizRealmSocket();
    socketRef.current = socket;
    socket.on("connect", () => { setConnection("connected"); setNotice(""); });
    socket.on("disconnect", () => { setConnection("offline"); setQueued(false); setNotice("Signal lost. Reconnecting to the war table…"); });
    socket.io.on("reconnect_attempt", () => setConnection("connecting"));
    socket.io.on("reconnect", () => { setConnection("connected"); setNotice("Realm signal restored."); });
    socket.on("connect_error", () => { setConnection("offline"); setNotice("Sign in to raise a matchmaking banner."); });
    socket.on("server:error", (payload: { message?: string }) => setNotice(payload.message ?? "The realm returned an error."));
    socket.on("matchmaking:queued", () => { setQueued(true); setNotice("Your sigil was placed in the queue."); });
    socket.on("matchmaking:left", () => setQueued(false));
    socket.on("matchmaking:rejected", (payload: { reason?: string }) => { setQueued(false); setNotice(payload.reason === "email_not_verified" ? "Verify your email before ranked campaign." : "Matchmaking rejected this banner."); });
    socket.on("match:found", () => { setQueued(false); setBattle(true); setMatchStatus("active"); setNotice("Campaign found. Read the map."); });
    socket.on("match:state", () => { setBattle(true); setMatchStatus("active"); });
    socket.on("match:paused", () => { setMatchStatus("paused"); setNotice("Campaign paused while the realm stabilizes."); });
    socket.on("match:resumed", () => { setMatchStatus("active"); setNotice("Campaign resumed."); });
    socket.on("match:finished", () => { setMatchStatus("finished"); setNotice("Campaign sealed. Result is being engraved."); });
    socket.on("round:result", () => setNotice("Round resolved. Province borders changed."));
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

  if (battle) return <Battle mode={current.name} selected={selected} onSelect={setSelected} onLeave={() => setBattle(false)} matchStatus={matchStatus} notice={notice} />;

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
            <div className="mt-6 grid gap-3 sm:grid-cols-3"><Info label="Rite" value={current.name} /><Info label="Prophecy" value={current.id === "blitz" ? "~12 sec" : "~24 sec"} /><Info label="Your ELO" value="1,842" gold /></div>
            <button onClick={toggleQueue} className="sigil-button mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-extrabold">{queued ? <><Clock3 size={17} /> Seeking rival…</> : <><Swords size={17} /> Begin matchmaking</>}</button>
          </div>
        </div>
        <aside className="space-y-5"><RealmPulse /><NextRelic /></aside>
      </div>
    </div>
  </div>;
}

function RealmPulse() { return <div className="engraved-frame relative overflow-hidden rounded-2xl p-5"><TerritoryMapSvg className="pointer-events-none absolute -right-20 -top-8 h-48 w-80 opacity-[.1]" /><div className="relative"><div className="flex items-center gap-2 text-sm font-bold text-[#f7e7b0]"><Users size={16} className="text-[#e3c36a]" /> Banners in realm</div><div className="mt-5 font-display text-4xl text-[#f7e7b0]">2,418</div><div className="mt-2 flex items-center gap-2 text-xs text-[#a7e7de]"><span className="h-2 w-2 rounded-full bg-[#2bc7b4]" /> Queue health: strong</div></div></div>; }
function NextRelic() { return <div className="panel rounded-2xl p-5"><div className="eyebrow">Next relic</div><div className="mt-4 flex items-center gap-3"><Avatar variant="oracle" color="text-[#e0ba58]" /><div><div className="text-sm font-bold text-[#f7e7b0]">Grand Cartographer</div><div className="mt-1 text-xs text-[#a197a5]">7,420 / 10,000 provinces</div></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full w-[74%] rounded-full bg-gradient-to-r from-[#8d6bda] to-[#2bc7b4]" /></div></div>; }
function ConnectionBadge({ state }: { state: "connecting" | "connected" | "offline" }) { const text = state === "connected" ? "Realm signal live" : state === "connecting" ? "Tuning sigils…" : "Offline · sign in"; return <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${state === "connected" ? "border-[#2bc7b4]/30 bg-[#2bc7b4]/8 text-[#a7e7de]" : "border-[#8d6bda]/35 bg-[#8d6bda]/10 text-[#dacbff]"}`}><Radio size={14} />{text}</div>; }
function Info({ label, value, gold }: { label: string; value: string; gold?: boolean }) { return <div className="rounded-xl border border-white/5 bg-black/20 p-3"><div className="text-[10px] uppercase tracking-wider text-[#897e8d]">{label}</div><div className={`mt-1 text-sm font-bold ${gold ? "text-[#e3c36a]" : "text-[#e9dfea]"}`}>{value}</div></div>; }
function Avatar({ variant = "oracle", color, image: _image }: { variant?: "astromancer" | "runeknight" | "oracle"; color: string; image?: string }) { return <div className="relative h-11 w-11 overflow-hidden rounded-full"><HeraldicAvatar variant={variant} className="h-full w-full" /><AvatarRuneRing className={`absolute inset-0 h-full w-full ${color}`} /></div>; }

function Battle({ mode, selected, onSelect, onLeave, matchStatus, notice }: { mode: string; selected: string | null; onSelect: (value: string) => void; onLeave: () => void; matchStatus: MatchStatus; notice: string }) {
  const answers = ["The Library of Alexandria", "The House of Wisdom", "The Crystal Archive", "The Grand Athenaeum"];
  const players = [{ name: "You", score: "1,842", image: realmAssets.avatars.runeknight, width: "72%", color: "text-[#e0ba58]" }, { name: "AstraNoir", score: "1,796", image: realmAssets.avatars.astromancer, width: "68%", color: "text-[#8d6bda]" }, { name: "M. Orpheus", score: "1,721", image: realmAssets.avatars.oracle, width: "55%", color: "text-[#8d6bda]" }];
  return <div className="realm-surface min-h-[calc(100vh-72px)]"><div className="mx-auto max-w-[1440px] px-5 py-7 lg:px-10">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><button onClick={onLeave} className="flex items-center gap-2 text-sm text-[#aaa0ad] hover:text-[#f7e7b0]"><ArrowLeft size={16} /> Withdraw banner</button><div className="rune-chip flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-[#ddcfff]"><Radio size={13} />{matchStatus === "paused" ? "Table paused" : matchStatus === "finished" ? "Campaign sealed" : `Live rite · ${mode}`}</div></div>
    {notice && <div className="mb-4 border border-[#8d6bda]/30 bg-[#8d6bda]/10 px-4 py-3 text-xs text-[#dacbff]">{notice}</div>}
    <div className="grid gap-5 xl:grid-cols-[1.08fr_1.15fr_290px]">
      <section className="engraved-frame tactical-grid order-2 min-h-[420px] overflow-hidden rounded-2xl p-4 xl:order-1"><img src={realmAssets.tacticalMap} className="absolute inset-0 h-full w-full object-cover opacity-[.18] mix-blend-screen" /><div className="relative z-10 flex items-start justify-between"><div><div className="eyebrow">The astral frontier</div><div className="mt-1 text-lg font-bold text-[#f7e7b0]">Territory war table</div></div><div className="rounded-lg border border-[#e0ba58]/25 bg-black/35 px-3 py-2 text-center"><div className="text-[10px] uppercase tracking-widest text-[#a89ca9]">Cycle</div><div className="font-display text-sm text-[#e3c36a]">04 / 08</div></div></div><TerritoryMapSvg className="relative z-10 mt-6 h-auto w-full" /><div className="absolute bottom-5 left-5 right-5 z-10 border border-white/10 bg-[#090a12]/80 p-3 backdrop-blur"><div className="flex justify-between text-xs text-[#aaa0ad]"><span>Map influence</span><b className="text-[#e3c36a]">62%</b></div><div className="mt-2 h-1.5 rounded-full bg-white/8"><div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#8d6bda] to-[#2bc7b4]" /></div></div></section>
      <section className="order-1 space-y-5 xl:order-2"><div className="engraved-frame rounded-2xl p-6"><div className="flex justify-between gap-3"><div><div className="eyebrow">Lore challenge</div><h2 className="mt-3 max-w-xl font-display text-2xl leading-tight text-[#f7e7b0]">Which institution became the greatest centre of learning in the medieval Islamic world?</h2></div><div className="hidden text-right sm:block"><div className="flex items-center gap-1 text-[#e3c36a]"><Clock3 size={15} /><span className="font-display text-xl">00:18</span></div><div className="mt-1 text-[10px] uppercase tracking-widest text-[#958a98]">Time to seal</div></div></div><div className="mt-7 grid gap-3">{answers.map((answer, index) => <button key={answer} onClick={() => onSelect(answer)} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm ${selected === answer ? "border-[#e0ba58]/60 bg-[#e0ba58]/10 text-[#f7e7b0]" : "border-white/8 bg-black/15 text-[#c0b5c4] hover:border-[#8d6bda]/55 hover:bg-[#8d6bda]/10"}`}><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/7 text-xs font-bold text-[#d6cbe0]">{String.fromCharCode(65 + index)}</span>{answer}{selected === answer && <Check size={16} className="ml-auto text-[#e3c36a]" />}</button>)}</div><button disabled={!selected} className="sigil-button mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-extrabold disabled:cursor-not-allowed disabled:opacity-40">Seal answer <MapPin size={16} /></button></div><div className="panel rounded-2xl p-5"><div className="flex justify-between text-xs text-[#aaa0ad]"><span>Question 4 of 8</span><span>Codex · History</span></div><div className="mt-3 h-1.5 rounded-full bg-white/8"><div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#8d6bda] to-[#e0ba58]" /></div></div></section>
      <aside className="order-3 space-y-5"><div className="panel rounded-2xl p-5"><div className="flex items-center justify-between"><span className="eyebrow">Banners</span><span className="text-xs text-[#a7e7de]">LIVE</span></div><div className="mt-4 space-y-4">{players.map((player, index) => <div key={player.name} className="flex items-center gap-3"><Avatar image={player.image} color={player.color} /><div className="min-w-0 flex-1"><div className="flex justify-between text-sm"><span className={index === 0 ? "font-bold text-[#f7e7b0]" : "text-[#c3b8c9]"}>{player.name}</span><span className="text-xs text-[#aaa0ad]">{player.score}</span></div><div className="mt-1 h-1 rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-[#8d6bda] to-[#2bc7b4]" style={{ width: player.width }} /></div></div></div>)}</div></div><div className="panel rounded-2xl p-5"><div className="flex items-center gap-2 text-sm font-bold text-[#f7e7b0]"><Sparkles size={16} className="text-[#e3c36a]" /> Battle momentum</div><p className="mt-3 text-sm leading-6 text-[#aaa0ad]">Two true answers in a row. Your next province strike receives <b className="text-[#f1d58d]">+12% force</b>.</p></div></aside>
    </div>
  </div></div>;
}
