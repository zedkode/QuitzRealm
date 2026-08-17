import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, BadgeCheck, Bookmark, CalendarDays,
  ChevronDown, ChevronLeft, ChevronRight, Crown, Download, Eye, Gavel, KeyRound,
  Loader2, MessageSquare, MoreVertical, RefreshCw, RotateCcw, Search, Shield,
  ShieldAlert, Sparkles, Star, Timer, TrendingUp, UserPlus, UserRound, Users, X,
} from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import {
  DEFAULT_FILTERS, activeFilterCount, filtersToQuery,
  type PlayerFilters, type PlayerPage, type PlayerRow, type PlayerStats,
} from "@/lib/playerTypes";
import Avatar from "../components/Avatar";
import AreaChart from "../components/AreaChart";
import DonutChart from "../components/DonutChart";
import Sparkline from "../components/Sparkline";
import Popover, { MenuItem } from "../components/Popover";
import PlayerDetailPanel from "../components/PlayerDetailPanel";
import {
  countryName, formatCompact, formatDate, formatNumber, levelTone, relativeTime,
  statusTone,
} from "../components/playerFormat";

const SAVED_FILTERS_KEY = "quizrealm.admin.players.savedFilters";
const SEARCH_DEBOUNCE_MS = 300;

interface SavedFilter { name: string; filters: PlayerFilters }

export default function PlayersPage() {
  const [filters, setFilters] = useState<PlayerFilters>(DEFAULT_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const [page, setPage] = useState<PlayerPage | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: "ok" | "error" } | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [saved, setSaved] = useState<SavedFilter[]>(() => readSaved());
  const [busy, setBusy] = useState(false);

  // Căutarea se aplică după o pauză de tastare: la fiecare literă ar însemna o
  // interogare cu `ILIKE` peste tot tabelul de conturi.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((previous) => (previous.search === searchDraft ? previous : { ...previous, search: searchDraft, page: 1 }));
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await quizRealmApi.adminPlayers(filtersToQuery(filters)) as PlayerPage;
      setPage(result);
      setError(null);
      setLoadedAt(new Date());
      // Selecția se păstrează doar pentru rândurile încă vizibile: o acțiune în
      // masă n-are voie să atingă conturi ieșite din filtru.
      setSelected((previous) => new Set(result.rows.filter((row) => previous.has(row.id)).map((row) => row.id)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lista de jucători nu a putut fi încărcată.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await quizRealmApi.adminPlayerStats() as PlayerStats);
    } catch {
      /* cifrele de sus sunt secundare: lista rămâne utilizabilă fără ele */
    }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => { void loadStats(); }, [loadStats]);

  // Primul rând se deschide singur, ca panoul din dreapta să nu fie un gol la
  // intrarea pe pagină.
  useEffect(() => {
    if (detailId === null && page && page.rows.length > 0) setDetailId(page.rows[0].id);
  }, [page, detailId]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const patch = (part: Partial<PlayerFilters>) =>
    setFilters((previous) => ({ ...previous, page: 1, ...part }));

  const runBulk = async (action: string, label: string) => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBusy(true);
    try {
      const result = await quizRealmApi.adminPlayersBulk(action, ids) as {
        succeeded: number; requested: number; skippedSelf: number;
      };
      const extra = result.skippedSelf > 0 ? ` (propriul cont a fost sărit)` : "";
      setNotice({
        text: `${label}: ${result.succeeded} din ${result.requested} conturi${extra}.`,
        tone: result.succeeded === result.requested - result.skippedSelf ? "ok" : "error",
      });
      setSelected(new Set());
      await Promise.all([loadList(), loadStats()]);
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Acțiunea a eșuat.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const rowAction = async (id: string, action: string, label: string) => {
    setBusy(true);
    try {
      await quizRealmApi.adminPlayersBulk(action, [id]);
      setNotice({ text: label, tone: "ok" });
      await Promise.all([loadList(), loadStats()]);
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Acțiunea a eșuat.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  /// Exportul cere serverului toate rândurile care trec de filtrele curente,
  /// nu doar pagina de pe ecran: altfel un export ar fi o felie arbitrară.
  const exportCsv = async (scope: "page" | "all") => {
    setBusy(true);
    try {
      const rows = scope === "page"
        ? page?.rows ?? []
        : ((await quizRealmApi.adminPlayers(
            filtersToQuery({ ...filters, page: 1, pageSize: 100 }),
          ) as PlayerPage).rows);
      downloadCsv(rows);
      setNotice({ text: `Export generat: ${rows.length} conturi.`, tone: "ok" });
    } catch (cause) {
      setNotice({ text: cause instanceof Error ? cause.message : "Exportul a eșuat.", tone: "error" });
    } finally {
      setBusy(false);
    }
  };

  const saveCurrentFilter = () => {
    const name = window.prompt("Nume pentru acest set de filtre:");
    if (!name?.trim()) return;
    const next = [...saved.filter((entry) => entry.name !== name.trim()), { name: name.trim(), filters }];
    setSaved(next);
    writeSaved(next);
    setNotice({ text: `Filtrele au fost salvate ca „${name.trim()}".`, tone: "ok" });
  };

  const allOnPageSelected = (page?.rows.length ?? 0) > 0 && page!.rows.every((row) => selected.has(row.id));
  const filterCount = activeFilterCount(filters);

  return (
    <div className="min-w-0">
      <header className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[23px] font-extrabold leading-none tracking-tight text-[#e8c56a]">All Players</h1>
          <p className="mt-1.5 text-[10.5px] text-[var(--admin-muted)]">
            Search, review, segment, and manage all player accounts across QuizRealm.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[9.5px] text-[var(--admin-dim)]">
          <span>Last updated: {loadedAt ? loadedAt.toLocaleTimeString("en-GB", { hour12: false }) : "—"}</span>
          <button
            onClick={() => { void loadList(); void loadStats(); }}
            className="flex items-center gap-1.5 rounded-md border border-[var(--admin-line)] px-2 py-1 hover:border-[var(--admin-line-strong)]"
          >
            <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
            Auto-refresh
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_6px_#34d399]" />
          </button>
        </div>
      </header>

      {notice && (
        <div className={`admin-notice ${notice.tone === "ok" ? "is-ok" : "is-error"}`}>
          <span className="min-w-0 flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X size={12} />
          </button>
        </div>
      )}

      <KpiRow stats={stats} />

      <div className="mt-2.5 grid min-w-0 gap-2.5 min-[1180px]:grid-cols-[minmax(0,1fr)_278px]">
        <div className="min-w-0 space-y-2.5">
          <FilterBar
            filters={filters}
            searchDraft={searchDraft}
            onSearch={setSearchDraft}
            onPatch={patch}
            filterCount={filterCount}
            onClear={() => { setSearchDraft(""); setFilters(DEFAULT_FILTERS); }}
            saved={saved}
            onSave={saveCurrentFilter}
            onApplySaved={(entry) => { setSearchDraft(entry.filters.search); setFilters(entry.filters); }}
            onDeleteSaved={(name) => {
              const next = saved.filter((entry) => entry.name !== name);
              setSaved(next); writeSaved(next);
            }}
            selectedCount={selected.size}
            busy={busy}
            onBulk={runBulk}
            onExport={exportCsv}
          />

          <PlayersTable
            page={page}
            loading={loading}
            error={error}
            selected={selected}
            allSelected={allOnPageSelected}
            detailId={detailId}
            sort={filters.sort}
            dir={filters.dir}
            onSort={(sort) => setFilters((previous) => ({
              ...previous,
              sort,
              dir: previous.sort === sort && previous.dir === "desc" ? "asc" : "desc",
            }))}
            onToggle={(id) => setSelected((previous) => {
              const next = new Set(previous);
              if (next.has(id)) next.delete(id); else next.add(id);
              return next;
            })}
            onToggleAll={() => setSelected((previous) =>
              allOnPageSelected ? new Set() : new Set(page?.rows.map((row) => row.id) ?? [...previous]),
            )}
            onOpen={setDetailId}
            onRowAction={rowAction}
            onPage={(next) => setFilters((previous) => ({ ...previous, page: next }))}
          />
        </div>

        {detailId && (
          <PlayerDetailPanel
            key={detailId}
            id={detailId}
            onClose={() => setDetailId(null)}
            onChanged={() => { void loadList(); void loadStats(); }}
            onNotice={(text, tone) => setNotice({ text, tone })}
          />
        )}
      </div>

      <BottomPanels stats={stats} onOpen={setDetailId} />
      <ModerationTable stats={stats} />
    </div>
  );
}

/* --------------------------------------------------------------- cifre --- */

const KPI_TONES = {
  violet: { bg: "rgba(124,92,255,.13)", fg: "#b9a3ff", line: "#8b5cf6" },
  teal: { bg: "rgba(43,199,180,.13)", fg: "#5eead4", line: "#2bc7b4" },
  gold: { bg: "rgba(224,186,88,.13)", fg: "#f0cf7a", line: "#e0ba58" },
  rose: { bg: "rgba(244,114,182,.13)", fg: "#f9a8d4", line: "#ec4899" },
  green: { bg: "rgba(52,211,153,.13)", fg: "#6ee7b7", line: "#34d399" },
} as const;

function KpiRow({ stats }: { stats: PlayerStats | null }) {
  const kpis = stats?.kpis;
  const cards = [
    {
      label: "Total Players", icon: <Users size={13} />, tone: "violet" as const,
      value: kpis ? formatNumber(kpis.totalPlayers.value) : null,
      delta: kpis?.totalPlayers.deltaPct ?? null,
      spark: stats?.growth.map((point) => point.totalPlayers),
    },
    {
      label: "Active Today", icon: <Sparkles size={13} />, tone: "teal" as const,
      value: kpis ? formatNumber(kpis.activeToday.value) : null,
      delta: kpis?.activeToday.deltaPct ?? null,
    },
    {
      label: "New Signups (24h)", icon: <UserPlus size={13} />, tone: "gold" as const,
      value: kpis ? formatNumber(kpis.newSignups24h.value) : null,
      delta: kpis?.newSignups24h.deltaPct ?? null,
      spark: stats?.growth.map((point) => point.joined),
    },
    {
      label: "Flagged Accounts", icon: <ShieldAlert size={13} />, tone: "rose" as const,
      value: kpis ? formatNumber(kpis.flaggedAccounts.value) : null,
      delta: kpis?.flaggedAccounts.deltaPct ?? null,
    },
    {
      label: "Premium Players", icon: <Star size={13} />, tone: "green" as const,
      value: kpis ? formatNumber(kpis.premiumPlayers.value) : null,
      delta: kpis?.premiumPlayers.deltaPct ?? null,
    },
    {
      label: "Avg Session Time", icon: <Timer size={13} />, tone: "violet" as const,
      value: null,
      missing: kpis?.avgSessionTime.reason,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card, index) => {
        const tone = KPI_TONES[card.tone];
        return (
          <article key={card.label} className="admin-kpi admin-rise px-2.5 pb-0.5 pt-1.5" style={{ "--i": index } as React.CSSProperties}>
            <div className="flex items-start gap-2">
              <span className="admin-kpi-icon shrink-0" style={{ background: tone.bg, color: tone.fg }}>
                {card.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[9.5px] text-[var(--admin-dim)]">{card.label}</div>
                <div className="mt-0.5 truncate text-[16px] font-bold leading-none text-[#efe7ff]">
                  {card.value ?? <span className="cursor-help text-[var(--admin-dim)]" title={card.missing ?? "Se încarcă…"}>—</span>}
                </div>
                <div className="mt-1 truncate text-[8.5px]">
                  {card.delta != null
                    ? <Trend pct={card.delta} />
                    : <span className="text-[var(--admin-dim)]">no baseline</span>}
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

function Trend({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className={up ? "admin-up" : "admin-down"}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
      <span className="text-[var(--admin-dim)]"> vs yesterday</span>
    </span>
  );
}

/* -------------------------------------------------------------- filtre --- */

const REGIONS = ["ALL", "North America", "Europe", "Asia", "South America", "Oceania", "Africa", "Necunoscut"];
const STATUSES = ["ALL", "ACTIVE", "IDLE", "OFFLINE", "SUSPENDED"];
const ROLES = ["ALL", "USER", "MODERATOR", "ADMIN", "CONTENT_EDITOR", "SUPPORT"];
const PLANS = ["ALL", "PREMIUM", "FREE"];

function FilterBar({
  filters, searchDraft, onSearch, onPatch, filterCount, onClear,
  saved, onSave, onApplySaved, onDeleteSaved, selectedCount, busy, onBulk, onExport,
}: {
  filters: PlayerFilters;
  searchDraft: string;
  onSearch: (value: string) => void;
  onPatch: (part: Partial<PlayerFilters>) => void;
  filterCount: number;
  onClear: () => void;
  saved: SavedFilter[];
  onSave: () => void;
  onApplySaved: (entry: SavedFilter) => void;
  onDeleteSaved: (name: string) => void;
  selectedCount: number;
  busy: boolean;
  onBulk: (action: string, label: string) => void;
  onExport: (scope: "page" | "all") => void;
}) {
  return (
    <section className="admin-panel p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <label className="admin-filter-search">
          <Search size={12} className="ml-2 shrink-0 text-[var(--admin-dim)]" />
          <input
            value={searchDraft}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search by name, email or player ID..."
            className="min-w-0 flex-1 bg-transparent px-1.5 py-[6px] text-[10.5px] text-[#d9d2ea] outline-none placeholder:text-[#5b5472]"
          />
          {searchDraft && (
            <button onClick={() => onSearch("")} className="mr-1.5 shrink-0 text-[var(--admin-dim)] hover:text-[#ded6f0]">
              <X size={11} />
            </button>
          )}
        </label>

        <Select label="All Regions" value={filters.region} options={REGIONS} onChange={(region) => onPatch({ region })} />
        <Select label="All Statuses" value={filters.status} options={STATUSES} onChange={(status) => onPatch({ status })} format={titleCase} />
        <Select label="All Roles" value={filters.role} options={ROLES} onChange={(role) => onPatch({ role })} format={titleCase} />
        <Select label="All Plans" value={filters.plan} options={PLANS} onChange={(plan) => onPatch({ plan })} format={titleCase} />

        <Popover
          align="end"
          width={220}
          trigger={({ toggle, open }) => (
            <button onClick={toggle} className={`admin-select-trigger ${filters.joinedFrom || filters.joinedTo ? "is-set" : ""}`}>
              <CalendarDays size={11} className="shrink-0" />
              <span className="truncate">
                {filters.joinedFrom || filters.joinedTo
                  ? `${filters.joinedFrom || "…"} → ${filters.joinedTo || "…"}`
                  : "Join date range"}
              </span>
              <ChevronDown size={10} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        >
          {(close) => (
            <div className="p-2">
              <div className="admin-eyebrow mb-1.5">Data înscrierii</div>
              <label className="mb-1.5 block">
                <span className="mb-0.5 block text-[9px] text-[var(--admin-dim)]">De la</span>
                <input
                  type="date" value={filters.joinedFrom}
                  onChange={(event) => onPatch({ joinedFrom: event.target.value })}
                  className="admin-date-input"
                />
              </label>
              <label className="block">
                <span className="mb-0.5 block text-[9px] text-[var(--admin-dim)]">Până la</span>
                <input
                  type="date" value={filters.joinedTo}
                  onChange={(event) => onPatch({ joinedTo: event.target.value })}
                  className="admin-date-input"
                />
              </label>
              <button
                onClick={() => { onPatch({ joinedFrom: "", joinedTo: "" }); close(); }}
                className="admin-ghost-button mt-2 w-full rounded-md py-1 text-[10px] font-semibold"
              >
                Șterge intervalul
              </button>
            </div>
          )}
        </Popover>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--admin-line)] pt-2">
        <Popover
          width={210}
          trigger={({ toggle, open }) => (
            <button onClick={toggle} disabled={selectedCount === 0 || busy} className="admin-bulk-button">
              {busy ? <Loader2 size={11} className="animate-spin" /> : <Gavel size={11} />}
              Bulk Actions{selectedCount > 0 ? ` (${selectedCount})` : ""}
              <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        >
          {(close) => (
            <div className="p-1">
              <MenuItem close={close} icon={<Gavel size={11} />} label="Suspendă conturile" onSelect={() => onBulk("suspend", "Suspendate")} />
              <MenuItem close={close} icon={<RotateCcw size={11} />} label="Ridică suspendarea" onSelect={() => onBulk("unsuspend", "Reactivate")} />
              <MenuItem close={close} icon={<KeyRound size={11} />} label="Revocă sesiunile" onSelect={() => onBulk("revoke-sessions", "Sesiuni revocate")} />
              <MenuItem close={close} icon={<KeyRound size={11} />} label="Forțează resetarea parolei" onSelect={() => onBulk("force-password-reset", "Resetare cerută")} />
            </div>
          )}
        </Popover>

        <Popover
          width={200}
          trigger={({ toggle, open }) => (
            <button onClick={toggle} disabled={busy} className="admin-gold-button flex items-center gap-1.5 rounded-md px-2.5 py-[6px] text-[10px] font-semibold">
              <Download size={11} /> Export
              <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
          )}
        >
          {(close) => (
            <div className="p-1">
              <MenuItem close={close} icon={<Download size={11} />} label="Pagina curentă (CSV)" onSelect={() => onExport("page")} />
              <MenuItem close={close} icon={<Download size={11} />} label="Toate rezultatele (CSV)" onSelect={() => onExport("all")} />
            </div>
          )}
        </Popover>

        <button
          disabled
          title="Notele de cont n-au model în baza de date. Vezi ai/needdesign.md."
          className="admin-outline-button"
        >
          <span aria-hidden>+</span> Create Player Note
        </button>

        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={onClear} disabled={filterCount === 0} className="admin-outline-button">
            <RefreshCw size={11} /> Clear Filters{filterCount > 0 ? ` (${filterCount})` : ""}
          </button>

          <Popover
            align="end"
            width={230}
            trigger={({ toggle, open }) => (
              <button onClick={toggle} className="admin-outline-button">
                <Bookmark size={11} /> Saved Filters ({saved.length})
                <ChevronRight size={10} className={`transition-transform ${open ? "rotate-90" : ""}`} />
              </button>
            )}
          >
            {(close) => (
              <div className="p-1">
                {saved.length === 0 && (
                  <p className="px-2 py-2 text-[10px] leading-4 text-[var(--admin-dim)]">
                    Niciun set salvat. Pune filtrele dorite și salvează-le pentru mai târziu.
                  </p>
                )}
                {saved.map((entry) => (
                  <div key={entry.name} className="admin-saved-row">
                    <button
                      onClick={() => { onApplySaved(entry); close(); }}
                      className="min-w-0 flex-1 truncate text-left"
                    >
                      {entry.name}
                    </button>
                    <button
                      onClick={() => onDeleteSaved(entry.name)}
                      aria-label={`Șterge ${entry.name}`}
                      className="shrink-0 text-[var(--admin-dim)] hover:text-[#fca5a5]"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => { onSave(); close(); }}
                  className="admin-ghost-button mt-1 w-full rounded-md py-1.5 text-[10px] font-semibold"
                >
                  Salvează filtrele curente
                </button>
              </div>
            )}
          </Popover>
        </div>
      </div>
    </section>
  );
}

function Select({
  label, value, options, onChange, format = (option: string) => option,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  format?: (option: string) => string;
}) {
  return (
    <Popover
      width={168}
      trigger={({ toggle, open }) => (
        <button onClick={toggle} className={`admin-select-trigger ${value !== "ALL" ? "is-set" : ""}`}>
          <span className="truncate">{value === "ALL" ? label : format(value)}</span>
          <ChevronDown size={10} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    >
      {(close) => (
        <div className="p-1">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => { onChange(option); close(); }}
              className={`admin-menu-item ${option === value ? "is-active" : ""}`}
            >
              <span className="flex-1 text-left">{option === "ALL" ? label : format(option)}</span>
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/* --------------------------------------------------------------- tabel --- */

function PlayersTable({
  page, loading, error, selected, allSelected, detailId, sort, dir,
  onSort, onToggle, onToggleAll, onOpen, onRowAction, onPage,
}: {
  page: PlayerPage | null;
  loading: boolean;
  error: string | null;
  selected: Set<string>;
  allSelected: boolean;
  detailId: string | null;
  sort: string;
  dir: "asc" | "desc";
  onSort: (sort: string) => void;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
  onRowAction: (id: string, action: string, label: string) => void;
  onPage: (page: number) => void;
}) {
  const headRef = useRef<HTMLInputElement>(null);
  const someSelected = selected.size > 0 && !allSelected;
  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = someSelected;
  }, [someSelected]);

  return (
    <section className="admin-panel flex min-w-0 flex-col">
      <div className="admin-table-scroll min-w-0 overflow-x-auto">
        <table className="admin-players-table w-full">
          <thead>
            <tr>
              <th className="w-[26px] pl-2">
                <input
                  ref={headRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Selectează toate rândurile de pe pagină"
                  className="admin-checkbox"
                />
              </th>
              <SortableHead label="Player" field="player" sort={sort} dir={dir} onSort={onSort} className="min-w-[128px]" />
              <th>Player ID</th>
              <SortableHead label="Level" field="level" sort={sort} dir={dir} onSort={onSort} />
              <th>Region</th>
              <th>Role</th>
              <th>Status</th>
              <SortableHead label="Last Online" field="lastOnline" sort={sort} dir={dir} onSort={onSort} />
              <SortableHead label="Join Date" field="joinDate" sort={sort} dir={dir} onSort={onSort} />
              <th>Plan</th>
              <SortableHead label="Reports" field="reports" sort={sort} dir={dir} onSort={onSort} />
              <th className="pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td colSpan={12} className="admin-empty py-6">{error}</td></tr>
            )}
            {!error && page?.rows.length === 0 && (
              <tr><td colSpan={12} className="admin-empty py-6">
                Niciun cont nu se potrivește cu filtrele puse.
              </td></tr>
            )}
            {page?.rows.map((row, index) => (
              <PlayerTableRow
                key={row.id}
                row={row}
                index={index}
                checked={selected.has(row.id)}
                active={detailId === row.id}
                onToggle={onToggle}
                onOpen={onOpen}
                onRowAction={onRowAction}
              />
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="admin-table-veil">
            <Loader2 size={16} className="animate-spin text-[#b9a3ff]" />
          </div>
        )}
      </div>

      <Pagination page={page} onPage={onPage} />
    </section>
  );
}

function SortableHead({
  label, field, sort, dir, onSort, className = "",
}: {
  label: string; field: string; sort: string; dir: "asc" | "desc";
  onSort: (field: string) => void; className?: string;
}) {
  const active = sort === field;
  return (
    <th className={className}>
      <button onClick={() => onSort(field)} className={`admin-sort-head ${active ? "is-active" : ""}`}>
        {label}
        {active
          ? (dir === "desc" ? <ArrowDown size={9} /> : <ArrowUp size={9} />)
          : <ArrowUpDown size={9} className="opacity-40" />}
      </button>
    </th>
  );
}

function PlayerTableRow({
  row, index, checked, active, onToggle, onOpen, onRowAction,
}: {
  row: PlayerRow;
  index: number;
  checked: boolean;
  active: boolean;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
  onRowAction: (id: string, action: string, label: string) => void;
}) {
  const tone = statusTone(row.status);
  const suspended = row.status === "SUSPENDED";

  return (
    <tr
      className={`admin-player-row ${active ? "is-active" : ""}`}
      style={{ "--i": index } as React.CSSProperties}
      onClick={() => onOpen(row.id)}
    >
      <td className="pl-2" onClick={(event) => event.stopPropagation()}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(row.id)}
          aria-label={`Selectează ${row.displayName}`}
          className="admin-checkbox"
        />
      </td>

      <td>
        <div className="flex items-center gap-2">
          <Avatar name={row.displayName} id={row.id} size={26} ring={tone.colour} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-[10.5px] font-semibold text-[#e4dcf5]">{row.displayName}</span>
              {row.verified && <BadgeCheck size={10} className="shrink-0 text-[#5eead4]" />}
            </div>
            <div className="truncate text-[9px] text-[var(--admin-dim)]">@{row.username}</div>
          </div>
        </div>
      </td>

      <td className="font-mono text-[9px] text-[var(--admin-muted)]">{row.playerId}</td>

      <td>
        <span className="admin-level-badge" style={{ color: levelTone(row.level), borderColor: `${levelTone(row.level)}55` }}>
          {row.level}
        </span>
      </td>

      <td>
        {row.countryCode ? (
          <span className="flex items-center gap-1.5" title={countryName(row.countryCode) ?? undefined}>
            <span className="admin-cc">{row.countryCode}</span>
            <span className="max-w-[58px] truncate text-[9.5px] text-[var(--admin-muted)]">
              {countryName(row.countryCode)}
            </span>
          </span>
        ) : (
          <span className="text-[var(--admin-dim)]">—</span>
        )}
      </td>

      <td><RoleCell role={row.role} /></td>

      <td>
        <span className="flex items-center gap-1.5" style={{ color: tone.colour }}>
          <span className="admin-status-dot" style={{ background: tone.colour }} />
          <span className="text-[9.5px] font-medium">{tone.label}</span>
        </span>
      </td>

      <td className="text-[9.5px] text-[var(--admin-muted)]">
        {row.lastOnlineAt ? relativeTime(row.lastOnlineAt) : <span className="text-[var(--admin-dim)]">never</span>}
      </td>

      <td className="text-[9.5px] text-[var(--admin-muted)]">{formatDate(row.joinedAt)}</td>

      <td>
        {row.plan === "PREMIUM"
          ? <span className="admin-plan is-premium"><Star size={8} /> Premium</span>
          : <span className="admin-plan">Free</span>}
      </td>

      <td className={`text-[9.5px] ${row.reports > 0 ? "text-[#fca5a5]" : "text-[var(--admin-muted)]"}`}>
        {row.reports}
      </td>

      <td className="pr-2" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => onOpen(row.id)} title="Deschide detaliile" className="admin-row-icon">
            <Eye size={11} />
          </button>
          <button
            disabled
            title="Trimiterea unui mesaj din panou nu are încă endpoint. Vezi ai/needdesign.md."
            className="admin-row-icon"
          >
            <MessageSquare size={11} />
          </button>
          <Popover
            align="end"
            width={200}
            trigger={({ toggle }) => (
              <button onClick={toggle} title="Alte acțiuni" className="admin-row-icon">
                <MoreVertical size={11} />
              </button>
            )}
          >
            {(close) => (
              <div className="p-1">
                <MenuItem close={close} icon={<Eye size={11} />} label="Deschide detaliile" onSelect={() => onOpen(row.id)} />
                <MenuItem close={close} icon={<KeyRound size={11} />} label="Revocă sesiunile" onSelect={() => onRowAction(row.id, "revoke-sessions", `Sesiunile lui ${row.username} au fost revocate.`)} />
                <MenuItem close={close} icon={<KeyRound size={11} />} label="Forțează resetarea parolei" onSelect={() => onRowAction(row.id, "force-password-reset", `S-a cerut resetarea parolei pentru ${row.username}.`)} />
                <MenuItem
                  close={close}
                  tone={suspended ? "default" : "danger"}
                  icon={suspended ? <RotateCcw size={11} /> : <Gavel size={11} />}
                  label={suspended ? "Ridică suspendarea" : "Suspendă contul"}
                  onSelect={() => onRowAction(
                    row.id,
                    suspended ? "unsuspend" : "suspend",
                    suspended ? `${row.username} a fost reactivat.` : `${row.username} a fost suspendat.`,
                  )}
                />
              </div>
            )}
          </Popover>
        </div>
      </td>
    </tr>
  );
}

function RoleCell({ role }: { role: string }) {
  if (role === "ADMIN") {
    return <span className="admin-role is-admin"><Crown size={9} /> Admin</span>;
  }
  if (role === "MODERATOR") {
    return <span className="admin-role is-mod"><Shield size={9} /> Moderator</span>;
  }
  if (role === "CONTENT_EDITOR" || role === "SUPPORT") {
    return <span className="admin-role is-staff">{titleCase(role)}</span>;
  }
  return <span className="admin-role">Player</span>;
}

function Pagination({ page, onPage }: { page: PlayerPage | null; onPage: (page: number) => void }) {
  if (!page) return null;
  const from = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--admin-line)] px-2.5 py-1.5">
      <span className="text-[9.5px] text-[var(--admin-dim)]">
        Showing {formatNumber(from)} to {formatNumber(to)} of {formatNumber(page.total)} players
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => onPage(page.page - 1)}
          disabled={page.page <= 1}
          aria-label="Pagina anterioară"
          className="admin-page-button"
        >
          <ChevronLeft size={11} />
        </button>
        {pageNumbers(page.page, page.pageCount).map((entry, index) =>
          entry === null
            ? <span key={`gap-${index}`} className="px-1 text-[9.5px] text-[var(--admin-dim)]">…</span>
            : (
              <button
                key={entry}
                onClick={() => onPage(entry)}
                className={`admin-page-button ${entry === page.page ? "is-active" : ""}`}
              >
                {formatNumber(entry)}
              </button>
            ),
        )}
        <button
          onClick={() => onPage(page.page + 1)}
          disabled={page.page >= page.pageCount}
          aria-label="Pagina următoare"
          className="admin-page-button"
        >
          <ChevronRight size={11} />
        </button>
      </div>
    </div>
  );
}

/// Numerele afișate: primele cinci în jurul paginii curente, apoi ultima.
/// `null` marchează o ruptură („…").
function pageNumbers(current: number, count: number): Array<number | null> {
  if (count <= 7) return Array.from({ length: count }, (_, index) => index + 1);
  const window = [current - 1, current, current + 1].filter((entry) => entry > 1 && entry < count);
  const middle = [...new Set([1, 2, ...window])].sort((a, b) => a - b);
  const result: Array<number | null> = [];
  let previous = 0;
  for (const entry of middle) {
    if (entry - previous > 1) result.push(null);
    result.push(entry);
    previous = entry;
  }
  if (count - previous > 1) result.push(null);
  result.push(count);
  return result;
}

/* ------------------------------------------------------ panouri de jos --- */

const DONUT_COLOURS = ["#8b5cf6", "#2bc7b4", "#e0ba58", "#ec4899", "#3b82f6", "#34d399", "#4b4463"];
const SEGMENT_ICONS: Record<string, ReactNode> = {
  new: <UserPlus size={11} className="text-[#8b5cf6]" />,
  returning: <RotateCcw size={11} className="text-[#2bc7b4]" />,
  vip: <Crown size={11} className="text-[#e0ba58]" />,
  inactive: <Timer size={11} className="text-[#f87171]" />,
};

function BottomPanels({ stats, onOpen }: { stats: PlayerStats | null; onOpen: (id: string) => void }) {
  const growth = stats?.growth ?? [];
  const last = growth.at(-1);
  const first = growth[0];
  const growthPct = first && last && first.totalPlayers > 0
    ? ((last.totalPlayers - first.totalPlayers) / first.totalPlayers) * 100
    : null;

  return (
    <div className="mt-2.5 grid min-w-0 grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-[1.45fr_1.15fr_1.35fr_1.2fr_1.1fr]">
      <Panel
        title="Player Growth"
        note="(30 Days)"
        right={
          <span className="flex items-center gap-1.5 text-[9px]">
            <b className="text-[#efe7ff]">{last ? formatNumber(last.totalPlayers) : "—"}</b>
            {growthPct != null && <span className="admin-up">▲ {growthPct.toFixed(2)}%</span>}
          </span>
        }
      >
        <AreaChart points={growth.map((point) => ({ day: point.day, value: point.totalPlayers }))} />
      </Panel>

      <Panel title="Regional Distribution">
        <div className="flex items-center gap-2">
          <DonutChart
            centreLabel={stats ? formatCompact(stats.regional.total) : "—"}
            slices={(stats?.regional.buckets ?? []).map((bucket, index) => ({
              label: bucket.name,
              value: bucket.count,
              colour: DONUT_COLOURS[index % DONUT_COLOURS.length],
            }))}
          />
          <div className="min-w-0 flex-1 space-y-[3px]">
            {(stats?.regional.buckets ?? []).map((bucket, index) => (
              <div key={bucket.name} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: DONUT_COLOURS[index % DONUT_COLOURS.length] }} />
                <span className="min-w-0 flex-1 truncate text-[9px] text-[#a49bbd]">{bucket.name}</span>
                <span className="shrink-0 font-mono text-[9px] text-[#ded6f0]">{bucket.sharePct.toFixed(1)}%</span>
              </div>
            ))}
            {stats && stats.regional.buckets.length === 0 && (
              <span className="text-[9px] text-[var(--admin-dim)]">Niciun cont cu țară declarată.</span>
            )}
          </div>
        </div>
      </Panel>

      <Panel title="Top Player Segments">
        <div className="space-y-1.5">
          {(stats?.segments.rows ?? []).map((segment) => (
            <div key={segment.key}>
              <div className="flex items-center gap-1.5">
                {SEGMENT_ICONS[segment.key]}
                <span className="min-w-0 flex-1 truncate text-[9.5px] text-[#a49bbd]">{segment.label}</span>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-[#ded6f0]">{formatNumber(segment.value)}</span>
                <span className="w-[38px] shrink-0 text-right text-[8.5px] text-[var(--admin-dim)]">{segment.sharePct.toFixed(1)}%</span>
              </div>
              <span className="admin-meter mt-1 block">
                <span className="admin-meter-fill" style={{ width: `${Math.min(100, segment.sharePct)}%`, background: "linear-gradient(90deg,#7c5cff,#a78bfa)" }} />
              </span>
            </div>
          ))}
          {!stats && <div className="admin-empty">Se încarcă segmentele…</div>}
        </div>
      </Panel>

      <Panel title="Recent Player Activity" action="/admin/system/audit">
        <div className="space-y-px">
          {(stats?.recentActivity ?? []).map((entry, index) => (
            <button
              key={`${entry.userId}-${index}`}
              onClick={() => onOpen(entry.userId)}
              className="admin-activity-row"
            >
              <Avatar name={entry.name} id={entry.userId} size={18} />
              <span className="min-w-0 flex-1 truncate text-left text-[9.5px] text-[#a49bbd]">
                <b className="text-[#ded6f0]">{entry.name}</b> {entry.text}
              </span>
              <span className="shrink-0 text-[8.5px] text-[var(--admin-dim)]">{relativeTime(entry.at)}</span>
            </button>
          ))}
          {stats && stats.recentActivity.length === 0 && (
            <div className="admin-empty">Nicio activitate încă.</div>
          )}
        </div>
      </Panel>

      <Panel title="Suspicious Accounts" action="/admin/moderation/chat">
        <div className="space-y-px">
          {(stats?.suspicious ?? []).map((entry) => (
            <button key={entry.userId} onClick={() => onOpen(entry.userId)} className="admin-activity-row">
              <Avatar name={entry.name} id={entry.userId} size={18} ring="#f87171" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[9.5px] text-[#ded6f0]">{entry.name}</span>
                <span className="block truncate text-[8.5px] text-[var(--admin-dim)]">{entry.reason}</span>
              </span>
              <span className="admin-count-badge">{entry.count}</span>
            </button>
          ))}
          {stats && stats.suspicious.length === 0 && (
            <div className="admin-empty">Niciun cont cu rapoarte deschise.</div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Panel({
  title, note, right, action, children,
}: {
  title: string; note?: string; right?: ReactNode; action?: string; children: ReactNode;
}) {
  return (
    <section className="admin-panel admin-reveal flex min-w-0 flex-col">
      <div className="admin-panel-head">
        <span className="admin-panel-title truncate">{title}</span>
        {note && <span className="admin-panel-note shrink-0">{note}</span>}
        <span className="ml-auto shrink-0">{right}</span>
        {action && <a href={action} className="admin-panel-link ml-auto shrink-0">View all</a>}
      </div>
      <div className="min-w-0 flex-1 p-2">{children}</div>
    </section>
  );
}

function ModerationTable({ stats }: { stats: PlayerStats | null }) {
  const rows = stats?.moderationActions ?? [];
  return (
    <section className="admin-panel admin-reveal mt-2.5 min-w-0">
      <div className="admin-panel-head">
        <span className="admin-panel-title">Recent Moderation / Player Actions</span>
        <a href="/admin/system/audit" className="admin-panel-link ml-auto">View all</a>
      </div>
      <div className="min-w-0 overflow-x-auto p-1">
        {rows.length === 0 ? (
          <div className="admin-empty py-4">
            {stats
              ? "Jurnalul de audit e gol: se umple la prima acțiune făcută din panou."
              : "Se încarcă jurnalul…"}
          </div>
        ) : (
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="w-[150px]">Time</th>
                <th className="w-[16%]">Actor</th>
                <th className="w-[18%]">Action</th>
                <th className="w-[22%]">Target</th>
                <th className="w-[12%]">Target Type</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-mono text-[9px] text-[var(--admin-dim)]">
                    {new Date(row.at).toLocaleString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false,
                    })}
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      <Avatar name={row.actor} id={row.actor} size={16} />
                      <span className="truncate text-[#ded6f0]">{row.actor}</span>
                    </span>
                  </td>
                  <td className="truncate">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={9} className="shrink-0 text-[#e0ba58]" />
                      {row.action}
                    </span>
                  </td>
                  <td className="truncate">{row.target}</td>
                  <td className="truncate capitalize">{row.targetType}</td>
                  <td className="truncate">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ ajutoare --- */

function titleCase(value: string): string {
  return value.split("_").map((part) => part[0] + part.slice(1).toLowerCase()).join(" ");
}

function readSaved(): SavedFilter[] {
  try {
    const stored = window.localStorage.getItem(SAVED_FILTERS_KEY);
    return stored ? (JSON.parse(stored) as SavedFilter[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(entries: SavedFilter[]) {
  try {
    window.localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(entries));
  } catch {
    /* stocare indisponibilă: filtrele rămân doar pentru sesiunea curentă */
  }
}

const CSV_COLUMNS: Array<[string, (row: PlayerRow) => string]> = [
  ["Player ID", (row) => row.playerId],
  ["Username", (row) => row.username],
  ["Display name", (row) => row.displayName],
  ["Email", (row) => row.emailMasked],
  ["Level", (row) => String(row.level)],
  ["Region", (row) => row.countryCode ?? ""],
  ["Role", (row) => row.role],
  ["Status", (row) => row.status],
  ["Last online", (row) => row.lastOnlineAt ?? ""],
  ["Joined", (row) => row.joinedAt],
  ["Plan", (row) => row.plan],
  ["Reports", (row) => String(row.reports)],
];

/// Exportul păstrează e-mailul mascat.
///
/// Un fișier descărcat pleacă de sub controlul panoului: dacă ar conține
/// adresele în clar, o simplă apăsare pe „Export" ar scoate din sistem date
/// personale pe care panoul le dezvăluie altfel doar una câte una, cu audit.
function downloadCsv(rows: PlayerRow[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    CSV_COLUMNS.map(([header]) => escape(header)).join(","),
    ...rows.map((row) => CSV_COLUMNS.map(([, read]) => escape(read(row))).join(",")),
  ];
  // BOM, ca Excel să deschidă diacriticele corect.
  const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `quizrealm-players-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
