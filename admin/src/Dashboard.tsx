import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import {
  AlertTriangle, Bell, CalendarClock, Coins, FileText, Flag, HelpCircle, Mail,
  MessageSquare, RefreshCw, RotateCw, Send, ShieldAlert, ShoppingBag, Smartphone,
  Swords, Trophy, Users,
} from "lucide-react";
import { adminApi } from "@/lib/api";
import type { AdminOverview, DerivedPct, NotInstrumented } from "@/lib/adminTypes";
import Sparkline from "./components/Sparkline";
import GrowthChart from "./components/GrowthChart";
import DonutChart from "./components/DonutChart";
import WarMap from "./components/WarMap";

const REFRESH_MS = 30_000;

export default function AdminDashboard({ onModerationCount }: { onModerationCount?: (count: number) => void }) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ținut în ref, nu în dependențe: altfel fiecare reîncărcare ar reporni
  // intervalul și ceasul de reîmprospătare n-ar ajunge niciodată la capăt.
  const notify = useRef(onModerationCount);
  notify.current = onModerationCount;

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const overview = await adminApi.overview(30) as AdminOverview;
      setData(overview);
      setError(null);
      setLoadedAt(new Date());
      notify.current?.(overview.moderation.pendingReports + overview.moderation.questionSubmissions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tabloul de bord nu a putut fi încărcat.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => { void load(); }, REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load]);

  return (
    <div className="min-w-0">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-extrabold leading-none tracking-tight text-[#e8c56a]">Dashboard</h1>
          <p className="mt-1.5 text-[10.5px] text-[var(--admin-muted)]">
            Live overview of players, content, economy, campaigns, and system health.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9.5px] text-[var(--admin-dim)]">
          <span>Last updated: {loadedAt ? loadedAt.toLocaleTimeString("ro-RO", { hour12: false }) : "—"}</span>
          <button
            onClick={() => setAutoRefresh((on) => !on)}
            className="flex items-center gap-1.5 rounded-md border border-[var(--admin-line)] px-2 py-1 hover:border-[var(--admin-line-strong)]"
          >
            <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
            Auto refresh
            <span className={`h-1.5 w-1.5 rounded-full ${autoRefresh ? "bg-[#34d399] shadow-[0_0_6px_#34d399]" : "bg-[#4d4661]"}`} />
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-3 rounded-lg border border-[#f87171]/25 bg-[#f87171]/[.08] px-3 py-2 text-[10.5px] text-[#fca5a5]">
          {error}
        </div>
      )}

      <KpiRow data={data} />

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.35fr_.95fr_1fr_1.1fr]">
        <PlayerGrowthPanel data={data} />
        <QuestionQueuePanel data={data} />
        <ActiveEventsPanel data={data} />
        <ChallengesPanel data={data} />
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-[1.15fr_1.5fr_1.35fr_1.2fr_1.15fr_1.15fr]">
        <CampaignMapPanel data={data} />
        <StoreRevenuePanel data={data} />
        <CoinEconomyPanel data={data} />
        <NotificationsPanel data={data} />
        <ModerationAlertsPanel data={data} />
        <SystemHealthPanel data={data} />
      </div>

      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.32fr_1.09fr_1fr]">
        <RecentActivityPanel data={data} />
        <QuickActionsPanel />
        <PlatformOverviewPanel data={data} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- cadre --- */

function Panel({
  title, note, action, children, bodyClass = "p-2", foot,
}: {
  title: string;
  note?: string;
  action?: { label: string; href: string };
  children: ReactNode;
  bodyClass?: string;
  foot?: ReactNode;
}) {
  return (
    <section className="admin-panel flex min-w-0 flex-col">
      <div className="admin-panel-head">
        <span className="admin-panel-title truncate">{title}</span>
        {note && <span className="admin-panel-note shrink-0">{note}</span>}
        {action && (
          <Link href={action.href} className="admin-panel-link ml-auto shrink-0">
            {action.label}
          </Link>
        )}
      </div>
      <div className={`min-w-0 flex-1 ${bodyClass}`}>{children}</div>
      {foot}
    </section>
  );
}

function Foot({ children }: { children: ReactNode }) {
  return <div className="admin-panel-foot">{children}</div>;
}

/// Rândul standard din panourile-listă: etichetă la stânga, cifră la dreapta.
function Row({ icon, label, value, tone }: { icon?: ReactNode; label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-1.5 py-[3px] hover:bg-white/[.025]">
      {icon}
      <span className="min-w-0 flex-1 truncate text-[10px] text-[#a49bbd]" style={tone ? { color: tone } : undefined}>
        {label}
      </span>
      <span className="shrink-0 font-mono text-[10.5px] font-semibold text-[#ded6f0]">{value}</span>
    </div>
  );
}

/// Ce se afișează în locul unei cifre care nu se măsoară.
///
/// Un zero ar fi o măsurătoare; o liniuță e o absență. Motivul stă în `title`,
/// deci e la un hover distanță fără să încarce panoul.
function Missing({ reason }: { reason: string }) {
  return <span className="cursor-help text-[var(--admin-dim)]" title={reason}>—</span>;
}

const isMissing = (value: unknown): value is NotInstrumented =>
  typeof value === "object" && value !== null && (value as NotInstrumented).available === false;

/* ----------------------------------------------------------- indicatori --- */

const KPI_TONES = {
  violet: { bg: "rgba(124,92,255,.13)", fg: "#b9a3ff", line: "#8b5cf6" },
  teal: { bg: "rgba(43,199,180,.13)", fg: "#5eead4", line: "#2bc7b4" },
  gold: { bg: "rgba(224,186,88,.13)", fg: "#f0cf7a", line: "#e0ba58" },
  green: { bg: "rgba(52,211,153,.13)", fg: "#6ee7b7", line: "#34d399" },
  rose: { bg: "rgba(244,114,182,.13)", fg: "#f9a8d4", line: "#ec4899" },
} as const;

interface KpiCard {
  label: string;
  icon: ReactNode;
  tone: keyof typeof KPI_TONES;
  value: string | null;
  deltaPct?: number | null;
  deltaAbs?: number | null;
  missing?: string;
  spark?: number[];
}

function KpiRow({ data }: { data: AdminOverview | null }) {
  const growth = data?.growth.series ?? [];
  const totalPlayers = growth.at(-1)?.totalPlayers ?? null;

  const cards: KpiCard[] = [
    {
      label: "Total Players", icon: <Users size={13} />, tone: "violet",
      value: totalPlayers === null ? null : formatNumber(totalPlayers),
      deltaPct: data?.growth.summary.totalGrowth.deltaPct ?? null,
      spark: growth.map((point) => point.totalPlayers),
    },
    {
      label: "Live Matches", icon: <Swords size={13} />, tone: "teal",
      value: data ? formatNumber(data.kpis.liveMatches.value) : null,
      deltaPct: pctChange(data?.kpis.liveMatches.value, data?.kpis.liveMatches.previous),
      spark: growth.map((point) => point.matchesPlayed),
    },
    {
      label: "Questions in Bank", icon: <HelpCircle size={13} />, tone: "gold",
      value: data ? formatNumber(data.kpis.totalQuestions.value) : null,
      deltaAbs: data?.kpis.totalQuestions.addedThisWeek ?? null,
      spark: growth.map((point) => point.questionsTotal),
    },
    {
      label: "Active Campaigns", icon: <Flag size={13} />, tone: "violet",
      value: null,
      missing: data?.kpis.activeCampaigns.reason,
    },
    {
      label: "Revenue Today", icon: <Coins size={13} />, tone: "green",
      value: data ? formatMoney(data.storeRevenue.today.cents, data.storeRevenue.currency) : null,
      deltaPct: data?.storeRevenue.today.deltaPct ?? null,
      spark: growth.map((point) => point.revenueCents),
    },
    {
      label: "Open Reports", icon: <ShieldAlert size={13} />, tone: "rose",
      value: data ? formatNumber(data.kpis.pendingReports.value) : null,
      deltaAbs: data?.kpis.pendingReports.previous ?? null,
      spark: growth.map((point) => point.newReports),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => {
        const tone = KPI_TONES[card.tone];
        return (
          <article key={card.label} className="admin-kpi px-2.5 pb-0.5 pt-1.5">
            <div className="flex items-start gap-2">
              <span className="admin-kpi-icon shrink-0" style={{ background: tone.bg, color: tone.fg }}>
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[9.5px] text-[var(--admin-dim)]">{card.label}</div>
                <div className="mt-0.5 truncate text-[16px] font-bold leading-none text-[#efe7ff]">
                  {card.value ?? <Missing reason={card.missing ?? "Se încarcă…"} />}
                </div>
                <div className="mt-1 truncate text-[8.5px]">
                  {card.deltaPct != null ? (
                    <Trend pct={card.deltaPct} suffix="vs yesterday" />
                  ) : card.deltaAbs != null ? (
                    <span className="admin-up">
                      ▲ {formatNumber(card.deltaAbs)} <span className="text-[var(--admin-dim)]">vs yesterday</span>
                    </span>
                  ) : (
                    <span className="text-[var(--admin-dim)]">fără bază de comparație</span>
                  )}
                </div>
              </div>
            </div>
            <Sparkline points={card.spark} colour={tone.line} />
          </article>
        );
      })}
    </div>
  );
}

function Trend({ pct, suffix }: { pct: number; suffix?: string }) {
  const up = pct >= 0;
  return (
    <span className={up ? "admin-up" : "admin-down"}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
      {suffix && <span className="text-[var(--admin-dim)]"> {suffix}</span>}
    </span>
  );
}

/* ------------------------------------------------------------- rândul 2 --- */

function PlayerGrowthPanel({ data }: { data: AdminOverview | null }) {
  const summary = data?.growth.summary;
  const blocks = [
    { label: "New Players", entry: summary?.newPlayers },
    { label: "Returning Players", entry: summary?.returningPlayers },
    { label: "Total Growth", entry: summary?.totalGrowth },
  ];

  return (
    <Panel
      title="Player Growth"
      note="(30 Days)"
      foot={
        <div className="grid grid-cols-3 divide-x divide-[var(--admin-line)] border-t border-[var(--admin-line)]">
          {blocks.map((block) => (
            <div key={block.label} className="min-w-0 px-2 py-[3px]">
              <div className="truncate text-[8.5px] text-[var(--admin-dim)]">{block.label}</div>
              <div className="text-[11.5px] font-bold text-[#efe7ff]">
                {block.entry ? formatNumber(block.entry.value) : "—"}
              </div>
              <div className="truncate text-[8px]">
                {block.entry?.deltaPct != null
                  ? <Trend pct={block.entry.deltaPct} />
                  : <span className="text-[var(--admin-dim)]">fără comparație</span>}
              </div>
            </div>
          ))}
        </div>
      }
    >
      <GrowthChart series={data?.growth.series ?? []} />
    </Panel>
  );
}

const QUEUE_BUCKETS = [
  { label: "Critical", colour: "#f87171" },
  { label: "High Priority", colour: "#fb923c" },
  { label: "Medium Priority", colour: "#e0ba58" },
  { label: "Low Priority", colour: "#2bc7b4" },
];

function QuestionQueuePanel({ data }: { data: AdminOverview | null }) {
  const reason = data?.questionQueue.buckets.reason ?? "Se încarcă…";
  return (
    <Panel
      title="Question Review Queue"
      action={{ label: "View all", href: "/admin/questions/review" }}
      foot={
        <Foot>
          <span className="text-[var(--admin-muted)]">Total in Queue</span>
          <span className="font-mono font-bold text-[#efe7ff]">
            {data ? formatNumber(data.questionQueue.total) : "—"}
          </span>
        </Foot>
      }
    >
      <div className="space-y-px">
        {QUEUE_BUCKETS.map((bucket) => (
          <Row
            key={bucket.label}
            icon={<span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: bucket.colour }} />}
            label={bucket.label}
            tone={bucket.colour}
            value={<Missing reason={reason} />}
          />
        ))}
      </div>
    </Panel>
  );
}

function ActiveEventsPanel({ data }: { data: AdminOverview | null }) {
  return (
    <Panel
      title="Active Events"
      action={{ label: "View all", href: "/admin/events/active" }}
      foot={
        <Foot>
          <span className="text-[var(--admin-muted)]">Total Active <b className="text-[#efe7ff]">—</b></span>
          <span className="text-[var(--admin-muted)]">Upcoming <b className="text-[#efe7ff]">—</b></span>
        </Foot>
      }
    >
      <div className="admin-empty h-full">{data?.events.reason ?? "Se încarcă…"}</div>
    </Panel>
  );
}

const CHALLENGE_SLICES = [
  { label: "Completed", colour: "#34d399" },
  { label: "In Progress", colour: "#8b5cf6" },
  { label: "Available", colour: "#e0ba58" },
  { label: "Locked", colour: "#4b4463" },
];

function ChallengesPanel({ data }: { data: AdminOverview | null }) {
  const reason = data?.challenges.reason ?? "Se încarcă…";
  return (
    <Panel
      title="Challenges Progress"
      action={{ label: "View all", href: "/admin/challenges/daily" }}
      foot={
        <Foot>
          <span className="text-[var(--admin-muted)]">Completion Rate</span>
          <span className="font-mono font-bold text-[#efe7ff]"><Missing reason={reason} /></span>
        </Foot>
      }
    >
      <div className="flex items-center gap-2">
        <DonutChart slices={CHALLENGE_SLICES.map((slice) => ({ ...slice, value: 0 }))} centreLabel="—" />
        <div className="min-w-0 flex-1 space-y-1">
          {CHALLENGE_SLICES.map((slice) => (
            <div key={slice.label} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: slice.colour }} />
              <span className="min-w-0 flex-1 truncate text-[9.5px] text-[#a49bbd]">{slice.label}</span>
              <span className="shrink-0 text-[9.5px]"><Missing reason={reason} /></span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- rândul 3 --- */

const MAP_LEGEND = [
  { label: "Controlled", colour: "#34d399" },
  { label: "Contested", colour: "#e0ba58" },
  { label: "Locked", colour: "#5b5280" },
];

function CampaignMapPanel({ data }: { data: AdminOverview | null }) {
  const reason = data?.warMap.reason ?? "Se încarcă…";
  return (
    <Panel
      title="Campaign / Romania Map"
      foot={
        <div className="border-t border-[var(--admin-line)] px-2.5 py-1.5">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-[var(--admin-dim)]">Territories</span>
            <span className="text-[var(--admin-dim)]">Control Rate</span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#ded6f0]"><Missing reason={reason} /></span>
            <span className="admin-meter flex-1">
              <span style={{ width: "0%", background: "linear-gradient(90deg,#c9922f,#f0cf7a)" }} />
            </span>
          </div>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1"><WarMap /></div>
        <div className="shrink-0 space-y-1.5">
          {MAP_LEGEND.map((entry) => (
            <div key={entry.label} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: entry.colour }} />
              <span className="text-[9px] text-[#a49bbd]">{entry.label}</span>
              <span className="ml-auto text-[9px]"><Missing reason={reason} /></span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function StoreRevenuePanel({ data }: { data: AdminOverview | null }) {
  const revenue = data?.storeRevenue;
  const rows = [
    { label: "Today", entry: revenue?.today },
    { label: "7 Days", entry: revenue?.sevenDays },
    { label: "30 Days", entry: revenue?.thirtyDays },
  ];

  return (
    <Panel
      title="Store Revenue"
      note="(Real Money)"
      action={{ label: "View analytics", href: "/admin/store/revenue" }}
      foot={
        <Foot>
          <span className="min-w-0 truncate text-[var(--admin-muted)]">
            Top Item Today{revenue?.topItem ? `: ${revenue.topItem.name}` : ""}
          </span>
          <span className="shrink-0 font-mono font-bold text-[#efe7ff]">
            {revenue?.topItem ? formatMoney(revenue.topItem.cents, revenue.currency) : "—"}
          </span>
        </Foot>
      }
    >
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="px-1.5">
            <div className="text-[9px] text-[var(--admin-dim)]">{row.label}</div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-mono text-[12px] font-bold text-[#efe7ff]">
                {row.entry && revenue ? formatMoney(row.entry.cents, revenue.currency) : "—"}
              </span>
              <span className="shrink-0 text-[8.5px]">
                {row.entry?.deltaPct != null
                  ? <Trend pct={row.entry.deltaPct} />
                  : <span className="text-[var(--admin-dim)]">—</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CoinEconomyPanel({ data }: { data: AdminOverview | null }) {
  const economy = data?.coinEconomy;
  const rows = [
    { label: "Coins Minted (30d)", value: economy?.minted30d },
    { label: "Coins Spent (30d)", value: economy?.spent30d },
  ];

  return (
    <Panel
      title="Shop Coins Economy"
      action={{ label: "View analytics", href: "/admin/economy/analytics" }}
      foot={
        <Foot>
          <span className="min-w-0 truncate text-[var(--admin-muted)]">
            Top Spent Item{economy?.topSink ? `: ${economy.topSink.label}` : ""}
          </span>
          <span className="shrink-0 font-mono font-bold text-[#f0cf7a]">
            {economy?.topSink ? formatCompact(economy.topSink.amount) : "—"}
          </span>
        </Foot>
      }
    >
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="px-1.5">
            <div className="text-[9px] text-[var(--admin-dim)]">{row.label}</div>
            <div className="font-mono text-[11.5px] font-bold text-[#efe7ff]">
              {row.value != null ? formatCompact(row.value) : "—"}
            </div>
          </div>
        ))}
        <div className="px-1.5">
          <div className="text-[9px] text-[var(--admin-dim)]">Coins in Circulation</div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-[12px] font-bold text-[#efe7ff]">
              {economy ? formatCompact(economy.circulation) : "—"}
            </span>
            {economy && (
              <span className={`admin-tag shrink-0 ${economy.healthy ? "admin-tag-live" : "admin-tag-partial"}`}>
                {economy.healthy ? "Healthy" : "Watch"}
              </span>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

const NOTIFICATION_CHANNELS = [
  { label: "Push", icon: <Smartphone size={11} className="shrink-0 text-[#8b5cf6]" /> },
  { label: "In-App", icon: <MessageSquare size={11} className="shrink-0 text-[#2bc7b4]" /> },
  { label: "Email", icon: <Mail size={11} className="shrink-0 text-[#e0ba58]" /> },
  { label: "SMS", icon: <Bell size={11} className="shrink-0 text-[#f472b6]" /> },
];

function NotificationsPanel({ data }: { data: AdminOverview | null }) {
  const reason = data?.notifications.reason ?? "Se încarcă…";
  return (
    <Panel
      title="Notifications Sent"
      note="(24h)"
      action={{ label: "View all", href: "/admin/notifications/push" }}
      foot={
        <Foot>
          <span className="text-[var(--admin-muted)]">Total Sent</span>
          <span className="font-mono font-bold text-[#efe7ff]"><Missing reason={reason} /></span>
        </Foot>
      }
    >
      <div className="space-y-px">
        {NOTIFICATION_CHANNELS.map((channel) => (
          <Row key={channel.label} icon={channel.icon} label={channel.label} value={<Missing reason={reason} />} />
        ))}
      </div>
    </Panel>
  );
}

function ModerationAlertsPanel({ data }: { data: AdminOverview | null }) {
  const alerts = data?.moderationAlerts;
  const rows: Array<{ label: string; value: number | NotInstrumented | undefined }> = [
    { label: "Player Reports", value: alerts?.playerReports },
    { label: "Chat Reports", value: alerts?.chatReports },
    { label: "Offensive Names", value: alerts?.offensiveNames },
    { label: "Cheating Reports", value: alerts?.cheatingReports },
  ];

  return (
    <Panel
      title="Moderation Alerts"
      action={{ label: "View all", href: "/admin/moderation/chat" }}
      foot={
        <Foot>
          <span className="text-[#fca5a5]">Total Alerts</span>
          <span className="font-mono font-bold text-[#fca5a5]">
            {alerts ? formatNumber(alerts.chatReports) : "—"}
          </span>
        </Foot>
      }
    >
      <div className="space-y-px">
        {rows.map((row) => (
          <Row
            key={row.label}
            icon={<AlertTriangle size={11} className="shrink-0 text-[#f87171]" />}
            label={row.label}
            value={
              isMissing(row.value)
                ? <Missing reason={row.value.reason} />
                : typeof row.value === "number" ? formatNumber(row.value) : "—"
            }
          />
        ))}
      </div>
    </Panel>
  );
}

const STATUS_TONE: Record<string, { label: string; colour: string }> = {
  up: { label: "Healthy", colour: "#34d399" },
  degraded: { label: "Degraded", colour: "#e0ba58" },
  down: { label: "Down", colour: "#f87171" },
  unknown: { label: "No probe", colour: "#5b5280" },
  not_configured: { label: "Not set", colour: "#5b5280" },
};

function SystemHealthPanel({ data }: { data: AdminOverview | null }) {
  const services = data?.services ?? [];
  const overall = services.some((service) => service.status === "down")
    ? "down"
    : services.some((service) => service.status === "degraded") ? "degraded" : "up";
  const tone = STATUS_TONE[overall];

  return (
    <Panel
      title="System Health"
      foot={
        <Foot>
          <span className="text-[var(--admin-muted)]">Overall Status</span>
          <span className="flex items-center gap-1.5 font-semibold" style={{ color: tone.colour }}>
            {data ? tone.label : "—"}
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.colour }} />
          </span>
        </Foot>
      }
    >
      <div className="space-y-px">
        {services.map((service) => {
          const serviceTone = STATUS_TONE[service.status] ?? STATUS_TONE.unknown;
          return (
            <div key={service.key} className="flex items-center gap-2 px-1.5 py-[1px]">
              <span className="min-w-0 flex-1 truncate text-[9.5px] text-[#a49bbd]">{service.name}</span>
              <span className="shrink-0 text-[9px]" style={{ color: serviceTone.colour }}>
                {service.latencyMs != null ? `${service.latencyMs} ms` : serviceTone.label}
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: serviceTone.colour }} />
            </div>
          );
        })}
        {services.length === 0 && <div className="admin-empty">Se încarcă starea serviciilor…</div>}
      </div>
    </Panel>
  );
}

/* ------------------------------------------------------------- rândul 4 --- */

/// Culoarea actorului spune din ce sistem vine rândul, fără o coloană în plus.
const ACTOR_TONE: Record<string, string> = {
  report: "#f9a8d4",
  question: "#f0cf7a",
  match: "#5eead4",
  payment: "#6ee7b7",
  admin: "#b9a3ff",
};

function RecentActivityPanel({ data }: { data: AdminOverview | null }) {
  const rows = data?.recentActivity ?? [];
  return (
    <Panel
      title="Recent Activity"
      action={{ label: "View all activity", href: "/admin/system/audit" }}
      bodyClass="p-1"
    >
      {rows.length === 0 ? (
        <div className="admin-empty">
          {data
            ? "Nu s-a petrecut nimic încă: fluxul se umple pe măsură ce apar evenimente reale."
            : "Se încarcă…"}
        </div>
      ) : (
        <table className="admin-table w-full table-fixed">
          <thead>
            <tr>
              <th className="w-[52px]">Time</th>
              <th className="w-[21%]">Actor</th>
              <th className="w-[23%]">Action</th>
              <th className="w-[26%]">Target</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.at}-${index}`}>
                <td className="font-mono text-[9px] text-[var(--admin-dim)]">
                  {new Date(row.at).toLocaleTimeString("ro-RO", {
                    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
                  })}
                </td>
                <td className="truncate" style={{ color: ACTOR_TONE[row.kind] }}>{row.actor}</td>
                <td className="truncate text-[#ded6f0]">{row.action}</td>
                <td className="truncate">{row.target}</td>
                <td className="truncate">{row.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

const QUICK_ACTIONS = [
  { label: "Create Question", icon: HelpCircle, href: "/admin/questions/create" },
  { label: "Launch Event", icon: CalendarClock, href: "/admin/events/builder" },
  { label: "Add Challenge", icon: Trophy, href: "/admin/challenges/builder" },
  { label: "Create Store Offer", icon: ShoppingBag, href: "/admin/store/products" },
  { label: "Rotate Shop", icon: RotateCw, href: "/admin/shop/daily-rotation" },
  { label: "Publish Rules", icon: FileText, href: "/admin/game/rules" },
  { label: "Send Notification", icon: Send, href: "/admin/notifications/push" },
  { label: "View Reports", icon: ShieldAlert, href: "/admin/moderation/chat" },
];

function QuickActionsPanel() {
  return (
    <Panel title="Quick Actions">
      <div className="grid grid-cols-4 gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.label} href={action.href} className="admin-quick-action">
            <action.icon size={14} className="text-[#b9a3ff]" />
            {action.label}
          </Link>
        ))}
      </div>
    </Panel>
  );
}

const OVERVIEW_BARS: Array<{ label: string; key: keyof AdminOverview["platformOverview"]; colour: string }> = [
  { label: "Content Coverage", key: "contentCoverage", colour: "linear-gradient(90deg,#7c5cff,#a78bfa)" },
  { label: "Player Engagement", key: "playerEngagement", colour: "linear-gradient(90deg,#2bc7b4,#5eead4)" },
  { label: "Economy Balance", key: "economyBalance", colour: "linear-gradient(90deg,#c9922f,#f0cf7a)" },
  { label: "Community Health", key: "communityHealth", colour: "linear-gradient(90deg,#3b82f6,#93c5fd)" },
  { label: "System Performance", key: "systemPerformance", colour: "linear-gradient(90deg,#16a34a,#4ade80)" },
];

function PlatformOverviewPanel({ data }: { data: AdminOverview | null }) {
  return (
    <Panel title="Platform Overview" action={{ label: "View full report", href: "/admin/analytics/players" }}>
      <div className="space-y-1.5">
        {OVERVIEW_BARS.map((bar) => {
          const entry: DerivedPct | undefined = data?.platformOverview[bar.key];
          return (
            <div key={bar.key} title={entry?.basis}>
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="text-[#a49bbd]">{bar.label}</span>
                <span className="font-mono font-semibold text-[#ded6f0]">
                  {entry ? `${Math.round(entry.pct)}%` : "—"}
                </span>
              </div>
              <span className="admin-meter mt-1 block">
                <span style={{ width: `${entry?.pct ?? 0}%`, background: bar.colour }} />
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* --------------------------------------------------------------- format --- */

function formatNumber(value: number): string {
  return value.toLocaleString("ro-RO");
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatMoney(cents: number, currency: string): string {
  const amount = (cents / 100).toLocaleString("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount} ${currency}`;
}

function pctChange(current?: number, previous?: number): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
