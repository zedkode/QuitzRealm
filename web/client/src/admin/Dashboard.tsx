import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity, AlertTriangle, BookOpen, CheckCircle2, Coins, CreditCard, Database,
  Flag, Gauge, HeartPulse, MessageSquareWarning, RefreshCw, Scale, Server,
  ShieldAlert, Swords, TrendingDown, TrendingUp, Users,
} from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import type { AdminOverview, NotInstrumented } from "@/lib/adminTypes";
import ActivityChart from "./components/ActivityChart";

const NUMBER = new Intl.NumberFormat("ro-RO");

export default function AdminDashboard({ onModerationCount }: { onModerationCount?: (n: number) => void }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const load = () => {
    quizRealmApi
      .adminOverview()
      .then((payload) => {
        setData(payload as AdminOverview);
        setLoadedAt(new Date());
        setError("");
        onModerationCount?.((payload as AdminOverview).moderation.pendingReports);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Overview indisponibil"));
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 120_000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-w-0">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[21px] font-bold leading-none tracking-tight text-[#efe7ff]">Admin Dashboard</h1>
          <p className="mt-2 flex flex-wrap items-center gap-3 text-[11.5px] text-[var(--admin-muted)]">
            Privire în timp real asupra operațiunilor QuizRealm.
            <span className="flex items-center gap-1.5 text-[var(--admin-dim)]">
              <span className="h-1 w-1 rounded-full bg-[var(--admin-dim)]" />
              {loadedAt ? `Date de acum ${relative(loadedAt.toISOString())}` : "Se încarcă…"}
              <button onClick={load} className="ml-1 text-[var(--admin-muted)] hover:text-[#d6c8ff]">
                <RefreshCw size={11} />
              </button>
            </span>
          </p>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-[#f87171]/30 bg-[#f87171]/10 px-4 py-2.5 text-[11.5px] text-[#fca5a5]">
          {error}
        </div>
      )}

      <KpiRow data={data} />

      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ActivityPanel data={data} />
        <RecentActivityPanel data={data} />
        <QuickModerationPanel data={data} />
      </div>

      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.28fr)_minmax(0,1fr)]">
        <CampaignPanel data={data} />
        <WarMapPanel data={data} />
        <ServicesPanel data={data} />
      </div>

      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,.8fr)]">
        <TopPlayersPanel data={data} />
        <TransactionsPanel data={data} />
        <AlertsPanel data={data} />
      </div>
    </div>
  );
}

// --- KPI -------------------------------------------------------------------

function KpiRow({ data }: { data: AdminOverview | null }) {
  const k = data?.kpis;
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
      <Kpi
        icon={<Users size={14} />} tone="violet" label="Active Players"
        value={k ? NUMBER.format(k.activePlayers.value) : "—"}
        delta={k ? deltaOf(k.activePlayers.value, k.activePlayers.previous) : null}
        note="față de ieri"
      />
      <Kpi
        icon={<Gauge size={14} />} tone="teal" label="DAU / MAU"
        value={k ? `${NUMBER.format(k.engagement.dau)} / ${NUMBER.format(k.engagement.mau)}` : "—"}
        note={k ? `${k.engagement.ratioPct}% engagement` : ""}
      />
      <Kpi
        icon={<Swords size={14} />} tone="violet" label="Live Matches"
        value={k ? NUMBER.format(k.liveMatches.value) : "—"}
        delta={k ? deltaOf(k.liveMatches.value, k.liveMatches.previous) : null}
        note="față de ieri"
      />
      <Kpi
        icon={<Flag size={14} />} tone="pink" label="Pending Reports"
        value={k ? NUMBER.format(k.pendingReports.value) : "—"}
        delta={k ? deltaOf(k.pendingReports.value, k.pendingReports.previous) : null}
        note="față de ieri" invertDelta
      />
      <Kpi
        icon={<BookOpen size={14} />} tone="violet" label="Total Questions"
        value={k ? NUMBER.format(k.totalQuestions.value) : "—"}
        note={k ? `${NUMBER.format(k.totalQuestions.addedThisWeek)} săptămâna asta` : ""}
      />
      <Kpi
        icon={<Flag size={14} />} tone="gold" label="Active Campaigns"
        value="—" note="fără sursă de date" pending
      />
      <Kpi
        icon={<Coins size={14} />} tone="gold" label="Revenue (30d)"
        value={k ? money(k.revenue.cents, k.revenue.currency) : "—"}
        delta={k ? deltaOf(k.revenue.cents, k.revenue.previousCents) : null}
        note="față de perioada anterioară"
      />
      <Kpi
        icon={<HeartPulse size={14} />} tone="teal" label="API Uptime"
        value={k ? uptime(k.serverUptimeSeconds) : "—"}
        note="de la ultima repornire"
      />
    </div>
  );
}

const TONES: Record<string, string> = {
  violet: "bg-[#7c5cff]/12 text-[#b9a3ff]",
  teal: "bg-[#2bc7b4]/12 text-[#6ee7d5]",
  gold: "bg-[#e0ba58]/12 text-[#e8c877]",
  pink: "bg-[#ec4899]/12 text-[#f9a8d4]",
};

function Kpi({ icon, tone, label, value, delta, note, invertDelta, pending }: {
  icon: ReactNode; tone: keyof typeof TONES | string; label: string; value: string;
  delta?: { pct: number; up: boolean } | null; note?: string; invertDelta?: boolean; pending?: boolean;
}) {
  const good = delta ? (invertDelta ? !delta.up : delta.up) : false;
  return (
    <div className="admin-kpi px-2.5 py-2.5">
      <div className="flex items-center gap-1.5">
        <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md ${TONES[tone] ?? TONES.violet}`}>
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-[9px] leading-tight text-[var(--admin-dim)]">{label}</span>
        {pending && <span className="admin-preview-tag shrink-0">soon</span>}
      </div>
      <div className={`mt-1.5 truncate font-bold leading-tight text-[#efe7ff] ${value.length > 11 ? "text-[13px]" : "text-[15.5px]"}`}>{value}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[9px]">
        {delta && (
          <span className={`flex items-center gap-0.5 font-semibold ${good ? "text-[#34d399]" : "text-[#f87171]"}`}>
            {delta.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {delta.pct}%
          </span>
        )}
        <span className="truncate text-[var(--admin-dim)]">{note}</span>
      </div>
    </div>
  );
}

// --- Panouri ---------------------------------------------------------------

function Panel({ title, action, children, className }: {
  title: string; action?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={`admin-panel flex flex-col p-3 ${className ?? ""}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="admin-panel-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActivityPanel({ data }: { data: AdminOverview | null }) {
  const series = data?.series ?? [];
  const totals = useMemo(() => ({
    activePlayers: series.reduce((sum, row) => sum + row.activePlayers, 0),
    newPlayers: series.reduce((sum, row) => sum + row.newPlayers, 0),
    matchesPlayed: series.reduce((sum, row) => sum + row.matchesPlayed, 0),
    questionsAnswered: series.reduce((sum, row) => sum + row.questionsAnswered, 0),
  }), [series]);

  return (
    <Panel
      title="Player Activity Overview"
      action={
        <div className="flex gap-1.5">
          <span className="admin-select">Ultimele 7 zile</span>
          <span className="admin-select">Zilnic</span>
        </div>
      }
    >
      <div className="mb-2.5 flex flex-wrap gap-x-3 gap-y-1">
        <Legend colour="#8b5cf6" label="Active Players" value={totals.activePlayers} />
        <Legend colour="#2bc7b4" label="New Players" value={totals.newPlayers} />
        <Legend colour="#e0ba58" label="Matches Played" value={totals.matchesPlayed} />
        <Legend colour="#a78bfa" label="Questions Answered" value={totals.questionsAnswered} />
      </div>
      <ActivityChart series={series} />
    </Panel>
  );
}

function Legend({ colour, label, value }: { colour: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: colour }} />
      <span className="text-[9px] text-[var(--admin-dim)]">{label}</span>
      <b className="text-[9.5px] text-[#d9d2ea]">{NUMBER.format(value)}</b>
    </span>
  );
}

const ACTIVITY_ICONS: Record<string, { icon: ReactNode; tone: string }> = {
  report: { icon: <ShieldAlert size={12} />, tone: "bg-[#ec4899]/12 text-[#f9a8d4]" },
  question: { icon: <CheckCircle2 size={12} />, tone: "bg-[#2bc7b4]/12 text-[#6ee7d5]" },
  match: { icon: <Swords size={12} />, tone: "bg-[#7c5cff]/12 text-[#b9a3ff]" },
  payment: { icon: <CreditCard size={12} />, tone: "bg-[#e0ba58]/12 text-[#e8c877]" },
  admin: { icon: <Database size={12} />, tone: "bg-[#7c5cff]/12 text-[#b9a3ff]" },
};

function RecentActivityPanel({ data }: { data: AdminOverview | null }) {
  const entries = data?.recentActivity ?? [];
  return (
    <Panel
      title="Recent Activity"
      action={<span className="text-[10px] text-[#b9a3ff]">Vezi tot</span>}
    >
      <div className="space-y-2.5">
        {entries.length === 0 && <Empty text="Nicio activitate înregistrată încă." />}
        {entries.map((entry, index) => {
          const visual = ACTIVITY_ICONS[entry.kind] ?? ACTIVITY_ICONS.admin;
          return (
            <div key={index} className="flex items-start gap-2.5">
              <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ${visual.tone}`}>
                {visual.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] text-[#ded6f0]">{entry.title}</span>
                <span className="block truncate text-[10px] text-[var(--admin-dim)]">{entry.subtitle}</span>
              </span>
              <span className="shrink-0 text-[9.5px] text-[var(--admin-dim)]">{relative(entry.at)}</span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function QuickModerationPanel({ data }: { data: AdminOverview | null }) {
  const m = data?.moderation;
  const rows = [
    { icon: <Flag size={13} />, tone: "bg-[#ec4899]/12 text-[#f9a8d4]", label: "Pending Reports", note: "Necesită analiză", value: m?.pendingReports },
    { icon: <MessageSquareWarning size={13} />, tone: "bg-[#e0ba58]/12 text-[#e8c877]", label: "Chat Ban Requests", note: notInstrumentedNote(m?.chatBanRequests), value: null },
    { icon: <BookOpen size={13} />, tone: "bg-[#7c5cff]/12 text-[#b9a3ff]", label: "Question Submissions", note: "În așteptarea aprobării", value: m?.questionSubmissions },
    { icon: <Scale size={13} />, tone: "bg-[#2bc7b4]/12 text-[#6ee7d5]", label: "Appeals", note: notInstrumentedNote(m?.appeals), value: null },
  ];

  return (
    <Panel title="Quick Moderation">
      <div className="flex-1 space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="admin-side-card flex items-center gap-2.5 rounded-lg px-2.5 py-2">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${row.tone}`}>{row.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11.5px] text-[#ded6f0]">{row.label}</span>
              <span className="block truncate text-[9.5px] text-[var(--admin-dim)]">{row.note}</span>
            </span>
            <span className="shrink-0 text-[15px] font-bold text-[#efe7ff]">
              {row.value == null ? <span className="text-[10px] text-[var(--admin-dim)]">n/a</span> : NUMBER.format(row.value)}
            </span>
          </div>
        ))}
      </div>
      <button className="admin-ghost-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold">
        Deschide coada de moderare <span aria-hidden>→</span>
      </button>
    </Panel>
  );
}

function CampaignPanel({ data }: { data: AdminOverview | null }) {
  const missing = data?.campaign && "available" in data.campaign;
  return (
    <Panel
      title="Seasonal Campaign Status"
      action={missing ? <span className="admin-preview-tag">fără date</span> : undefined}
    >
      <div className="admin-side-card flex items-center gap-3 rounded-lg p-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#2a1c4d] to-[#17122a] text-[#e8c877]">
          <Flag size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-bold text-[#efe7ff]">Campanie sezonieră</span>
            <span className="rounded px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-[var(--admin-dim)] ring-1 ring-white/10">
              inactiv
            </span>
          </span>
          <span className="mt-0.5 block text-[10px] text-[var(--admin-dim)]">Sezon de război teritorial</span>
        </span>
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-[var(--admin-dim)]">
          <span>Progres sezon</span><span>—</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-white/8" />
        <div className="mt-1.5 text-[9.5px] text-[var(--admin-dim)]">Timp rămas: —</div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Participanți" value="—" />
        <MiniStat label="Provincii" value="—" />
        <MiniStat label="Top facțiune" value="—" />
      </div>

      {missing && (
        <p className="mt-3 text-[9.5px] leading-4 text-[var(--admin-dim)]">
          {(data!.campaign as NotInstrumented).reason}
        </p>
      )}

      <button className="admin-ghost-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold">
        Administrează campania <span aria-hidden>→</span>
      </button>
    </Panel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-side-card rounded-lg px-2 py-2">
      <div className="text-[13px] font-bold text-[#efe7ff]">{value}</div>
      <div className="mt-0.5 text-[9px] text-[var(--admin-dim)]">{label}</div>
    </div>
  );
}

/// Facțiunile din concept. Nu există în backend, deci lista rămâne aici,
/// marcată ca previzualizare, până când apare modelul.
const PREVIEW_FACTIONS = [
  { name: "House of Wisdom", colour: "#8b5cf6" },
  { name: "The Astral Frontier", colour: "#e0ba58" },
  { name: "The Crystal Archive", colour: "#2bc7b4" },
  { name: "M. Orpheus", colour: "#94a3b8" },
];

function WarMapPanel({ data }: { data: AdminOverview | null }) {
  const missing = data?.warMap && "available" in data.warMap;
  return (
    <Panel
      title="Romania War Map (Preview)"
      action={
        <span className="flex items-center gap-2">
          {missing && <span className="admin-preview-tag">previzualizare</span>}
          <span className="admin-select">Vezi harta</span>
        </span>
      }
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-[var(--admin-line)] bg-[#0b0a14]">
          <img
            src="/romania-war-map.jpg"
            alt="Harta județelor României colorată pe facțiuni"
            className="h-full w-full object-cover opacity-90"
          />
        </div>
        <div className="w-full shrink-0 sm:w-[150px]">
          <div className="admin-panel-title mb-2">Top facțiuni</div>
          <div className="space-y-2">
            {PREVIEW_FACTIONS.map((faction) => (
              <div key={faction.name} className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: faction.colour }} />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-[#ded6f0]">{faction.name}</span>
                <span className="shrink-0 text-[10px] text-[var(--admin-dim)]">—</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-[9.5px] text-[var(--admin-dim)]">
        {missing ? (data!.warMap as NotInstrumented).reason : "Treci cu mouse-ul peste un județ pentru detalii."}
      </p>
    </Panel>
  );
}

const SERVICE_STATUS: Record<string, { label: string; colour: string }> = {
  up: { label: "operațional", colour: "#34d399" },
  degraded: { label: "degradat", colour: "#e0ba58" },
  down: { label: "oprit", colour: "#f87171" },
  unknown: { label: "nemonitorizat", colour: "#6f6885" },
  not_configured: { label: "neconfigurat", colour: "#6f6885" },
};

function ServicesPanel({ data }: { data: AdminOverview | null }) {
  const services = data?.services ?? [];
  return (
    <Panel title="Live Services Status">
      <div className="flex-1 space-y-1.5">
        {services.map((service) => {
          const status = SERVICE_STATUS[service.status] ?? SERVICE_STATUS.unknown;
          return (
            <div key={service.key} className="flex items-center gap-2 py-0.5">
              <Server size={11} className="shrink-0 text-[var(--admin-dim)]" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-[#ded6f0]">{service.name}</span>
              <span className="shrink-0 text-[9.5px] text-[var(--admin-dim)]">
                {service.latencyMs != null ? `${service.latencyMs} ms` : "—"}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-[9.5px]" style={{ color: status.colour }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.colour }} />
                {status.label}
              </span>
            </div>
          );
        })}
        {services.length === 0 && <Empty text="Se încarcă…" />}
      </div>
      <button className="admin-ghost-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold">
        Vezi monitorizarea <span aria-hidden>→</span>
      </button>
    </Panel>
  );
}

function TopPlayersPanel({ data }: { data: AdminOverview | null }) {
  const players = data?.topPlayers ?? [];
  return (
    <Panel title="Top Players (după ELO)">
      <div className="grid grid-cols-[20px_minmax(0,1fr)_58px_46px_50px] gap-2 pb-1.5 text-[9px] uppercase tracking-wider text-[var(--admin-dim)]">
        <span>#</span><span>Player</span><span className="text-right">ELO</span>
        <span className="text-right">Meciuri</span><span className="text-right">Win</span>
      </div>
      <div className="space-y-0.5">
        {players.length === 0 && <Empty text="Niciun jucător încă." />}
        {players.map((player, index) => (
          <div key={player.id} className="grid grid-cols-[20px_minmax(0,1fr)_58px_46px_50px] items-center gap-2 rounded-md py-1.5 text-[11px]">
            <span className={index < 3 ? "text-[#e8c877]" : "text-[var(--admin-dim)]"}>{index + 1}</span>
            <span className="flex min-w-0 items-center gap-2">
              <span className="admin-avatar grid h-5 w-5 shrink-0 place-items-center rounded-full text-[8px] font-bold">
                {player.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-[#ded6f0]">{player.username}</span>
            </span>
            <span className="text-right font-semibold text-[#efe7ff]">{NUMBER.format(player.eloRating)}</span>
            <span className="text-right text-[var(--admin-muted)]">{NUMBER.format(player.matches)}</span>
            <span className="text-right text-[var(--admin-muted)]">
              {player.winRatePct == null ? "—" : `${player.winRatePct}%`}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function TransactionsPanel({ data }: { data: AdminOverview | null }) {
  const rows = data?.recentTransactions ?? [];
  return (
    <Panel title="Recent High-Value Transactions">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_70px_58px] gap-2 pb-1.5 text-[9px] uppercase tracking-wider text-[var(--admin-dim)]">
        <span>Player</span><span>Pachet</span><span className="text-right">Sumă</span><span className="text-right">Când</span>
      </div>
      <div className="space-y-0.5">
        {rows.length === 0 && <Empty text="Nicio plată încasată încă. Stripe nu e configurat." />}
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_70px_58px] items-center gap-2 py-1.5 text-[11px]">
            <span className="truncate text-[#ded6f0]">{row.player}</span>
            <span className="truncate text-[var(--admin-muted)]">{row.item}</span>
            <span className="text-right font-semibold text-[#e8c877]">{money(row.priceCents, row.currency, 2)}</span>
            <span className="text-right text-[9.5px] text-[var(--admin-dim)]">{row.at ? relative(row.at) : "—"}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AlertsPanel({ data }: { data: AdminOverview | null }) {
  const pending = data?.moderation.pendingReports ?? 0;
  const alerts = [
    ...(pending > 0
      ? [{ tone: "warn" as const, text: `${pending} rapoarte în așteptare`, at: "acum" }]
      : []),
    { tone: "ok" as const, text: "Baza de date răspunde", at: "acum" },
  ];

  return (
    <Panel title="System Alerts">
      <div className="space-y-2">
        {alerts.map((alert, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg ${
                alert.tone === "ok" ? "bg-[#2bc7b4]/12 text-[#6ee7d5]" : "bg-[#e0ba58]/12 text-[#e8c877]"
              }`}
            >
              {alert.tone === "ok" ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] text-[#ded6f0]">{alert.text}</span>
            <span className="shrink-0 text-[9.5px] text-[var(--admin-dim)]">{alert.at}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-center text-[10.5px] text-[var(--admin-dim)]">{text}</p>;
}

// --- Formatare -------------------------------------------------------------

function deltaOf(current: number, previous: number): { pct: number; up: boolean } | null {
  if (previous === 0) return current === 0 ? null : { pct: 100, up: true };
  const change = ((current - previous) / previous) * 100;
  return { pct: Math.abs(Math.round(change * 10) / 10), up: change >= 0 };
}

function money(cents: number, currency: string, decimals = 0): string {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency, maximumFractionDigits: decimals, minimumFractionDigits: decimals })
    .format(cents / 100);
}

function uptime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}z`;
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "acum";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}z`;
}

function notInstrumentedNote(value: NotInstrumented | number | undefined): string {
  if (value && typeof value === "object" && "reason" in value) return "Fără sursă de date";
  return "Necesită analiză";
}
