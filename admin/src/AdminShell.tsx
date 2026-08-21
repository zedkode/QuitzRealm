import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Bell, ChevronDown, ChevronRight, Mail, ScrollText, Search } from "lucide-react";
import type { UserIdentity } from "@quizrealm/shared";
import {
  ADMIN_AREAS, DASHBOARD_ITEM, entryHref, sectionKeyForPath,
  type AdminNavSection,
} from "./navigation";

const OPEN_SECTIONS_KEY = "quizrealm.admin.openSections";

interface AdminShellProps {
  user: UserIdentity | null;
  moderationCount?: number;
  children: ReactNode;
}

export default function AdminShell({ user, moderationCount, children }: AdminShellProps) {
  // Înălțime fixă pe rădăcină, cu derulare proprie în fiecare coloană: meniul
  // are douăzeci și trei de secțiuni și, dacă ar împărți bara de derulare cu
  // pagina, ar dispărea în sus exact când cauți altă secțiune.
  return (
    <div className="admin-root flex h-screen overflow-hidden">
      <Sidebar moderationCount={moderationCount} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar user={user} />
        <main className="admin-scroll min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-4">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ moderationCount }: { moderationCount?: number }) {
  const [location] = useLocation();
  const activeSection = useMemo(() => sectionKeyForPath(location), [location]);

  // Starea de pliere se ține în localStorage: un meniu cu douăzeci și trei de
  // secțiuni rearanjat de utilizator n-are voie să se reseteze la fiecare
  // navigare.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem(OPEN_SECTIONS_KEY);
      if (stored) return JSON.parse(stored) as Record<string, boolean>;
    } catch {
      /* preferință coruptă: se pornește de la zero */
    }
    return {};
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(OPEN_SECTIONS_KEY, JSON.stringify(open));
    } catch {
      /* stocare indisponibilă (mod privat): meniul rămâne funcțional */
    }
  }, [open]);

  // Secțiunea paginii curente se deschide singură, fără să șteargă alegerile
  // făcute manual pentru celelalte.
  useEffect(() => {
    if (activeSection) {
      setOpen((previous) => (previous[activeSection] ? previous : { ...previous, [activeSection]: true }));
    }
  }, [activeSection]);

  const toggle = (key: string) => setOpen((previous) => ({ ...previous, [key]: !previous[key] }));

  return (
    <aside className="admin-sidebar hidden h-full w-[168px] shrink-0 flex-col lg:flex">
      <Link href="/admin" className="flex shrink-0 items-center gap-2 px-3.5 py-4">
        <span className="admin-logo-mark grid h-[26px] w-[26px] shrink-0 place-items-center rounded-lg">
          <ScrollText size={13} />
        </span>
        <span className="min-w-0">
          <span className="admin-wordmark block truncate">QUIZREALM</span>
          <span className="block text-[7px] font-bold uppercase tracking-[.2em] text-[#5f5875]">
            Admin Panel
          </span>
        </span>
      </Link>

      <nav className="admin-nav-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {ADMIN_AREAS.map((area, areaIndex) => (
          <div key={area.label} className={areaIndex === 0 ? "" : "mt-4"}>
            <div className="admin-nav-area">{area.label}</div>
            <div className="mt-1 space-y-px">
              {areaIndex === 0 && (
                <Link
                  href={DASHBOARD_ITEM.href}
                  className={`admin-nav-item ${location === DASHBOARD_ITEM.href ? "is-active" : ""}`}
                >
                  <DASHBOARD_ITEM.icon size={13.5} className="shrink-0" />
                  <span className="flex-1 truncate">{DASHBOARD_ITEM.label}</span>
                </Link>
              )}

              {area.sections.map((section) => (
                <SectionRow
                  key={section.key}
                  section={section}
                  location={location}
                  open={open[section.key] ?? false}
                  onToggle={() => toggle(section.key)}
                  badge={section.badgeKey === "moderation" ? moderationCount : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <SidebarFooter />
    </aside>
  );
}

/// Un cap de secțiune. Clicul pe etichetă duce la prima pagină a secțiunii;
/// clicul pe săgeată doar pliază. Cele două acțiuni sunt separate ca navigarea
/// să nu ascundă lista pe care tocmai ai deschis-o.
function SectionRow({
  section, location, open, onToggle, badge,
}: {
  section: AdminNavSection;
  location: string;
  open: boolean;
  onToggle: () => void;
  badge?: number;
}) {
  const children = section.items ?? [];
  const isLeaf = children.length <= 1 && section.href !== undefined;
  const hasActive = children.some((item) => location === item.href || location.startsWith(`${item.href}/`));

  return (
    <div>
      <div className={`admin-nav-row ${hasActive ? "has-active" : ""} ${isLeaf && hasActive ? "is-active" : ""}`}>
        <Link href={entryHref(section)} className="admin-nav-link">
          <section.icon size={13.5} className="shrink-0" />
          <span className="flex-1 truncate">{section.label}</span>
        </Link>
        {badge != null && badge > 0 && <span className="admin-nav-badge">{badge}</span>}
        {!isLeaf && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? `Pliază ${section.label}` : `Extinde ${section.label}`}
            className="admin-nav-caret"
          >
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        )}
      </div>

      {!isLeaf && open && (
        <div className="admin-nav-children">
          {children.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-child ${location === item.href ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SidebarFooter() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Numele fusului, nu decalajul: „EEST" spune mai mult decât „+03:00" pentru
  // cineva care compară ora din panou cu ora de pe telefon.
  const zone = useMemo(() => {
    const parts = new Intl.DateTimeFormat("ro-RO", { timeZoneName: "short" }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value ?? "";
  }, []);

  return (
    <div className="admin-sidebar-footer shrink-0 px-3.5 py-3">
      <div className="text-[7.5px] font-bold uppercase tracking-[.18em] text-[#57506b]">Server Time</div>
      <div className="mt-0.5 font-mono text-[10.5px] text-[#b9b1cd]">
        {now.toLocaleTimeString("ro-RO", { hour12: false })} {zone}
      </div>
      <div className="text-[9px] text-[#57506b]">
        {now.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
      </div>

      <div className="mt-2 font-mono text-[8.5px] text-[#4a4460]">v{__ADMIN_VERSION__}</div>

      <div className="mt-3 text-[7.5px] font-bold uppercase tracking-[.18em] text-[#57506b]">
        Admin Access
      </div>
      <div className="mt-0.5 text-[9px] text-[#8b83a3]">Level 6 (Super Admin)</div>
      <div className="admin-access-track mt-1.5">
        <span className="admin-access-fill" style={{ width: "86%" }} />
      </div>
    </div>
  );
}

function TopBar({ user }: { user: UserIdentity | null }) {
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl K duce în căsuța de căutare. Scurtătura e afișată pe tastă în
  // interfață, deci trebuie să și existe.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="admin-topbar z-30 flex h-[54px] shrink-0 items-center gap-3 px-4">
      <label className="admin-search relative flex min-w-0 max-w-[400px] flex-1 items-center rounded-lg">
        <Search size={13} className="ml-2.5 shrink-0 text-[#5f5875]" />
        <input
          ref={searchRef}
          placeholder="Search players, matches, questions, content..."
          className="min-w-0 flex-1 bg-transparent px-2 py-[7px] text-[11px] text-[#d9d2ea] outline-none placeholder:text-[#5b5472]"
        />
        <kbd className="admin-kbd mr-1.5 shrink-0 rounded px-1.5 py-0.5 text-[8.5px] font-semibold">Ctrl K</kbd>
      </label>

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <button className="admin-env-chip hidden items-center gap-2 rounded-lg px-3 py-[7px] text-[11px] md:flex">
          <span className="admin-pulse-dot" />
          <span className="font-medium text-[#cfc7e2]">Production</span>
          <ChevronDown size={12} className="ml-4 text-[#5f5875]" />
        </button>

        <button className="admin-gold-button flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[11px] font-semibold">
          <span aria-hidden>⚡</span> Quick Actions
        </button>

        <IconButton icon={<Bell size={14} />} count={0} />
        <IconButton icon={<Mail size={14} />} count={0} />

        <div className="flex items-center gap-2 pl-0.5">
          <span className="admin-avatar grid h-[30px] w-[30px] place-items-center rounded-full text-[10px] font-bold">
            {(user?.displayName ?? user?.username ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block text-[11px] font-semibold text-[#e4dcf5]">
              {user?.displayName ?? user?.username ?? "—"}
            </span>
            <span className="block text-[9px] text-[#5f5875]">{roleLabel(user?.role)}</span>
          </span>
          <ChevronDown size={12} className="text-[#5f5875]" />
        </div>
      </div>
    </header>
  );
}

/// Pastila numerică apare doar când chiar există ceva de citit. Un „0" permanent
/// pe clopoțel antrenează ochiul să nu se mai uite la el.
function IconButton({ icon, count }: { icon: ReactNode; count: number }) {
  return (
    <button className="admin-icon-button relative grid h-[30px] w-[30px] place-items-center rounded-lg">
      {icon}
      {count > 0 && <span className="admin-dot-badge">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

function roleLabel(role: string | undefined): string {
  switch (role) {
    case "ADMIN": return "Super Admin";
    case "MODERATOR": return "Moderator";
    case "CONTENT_EDITOR": return "Content Editor";
    case "SUPPORT": return "Support";
    default: return "—";
  }
}
