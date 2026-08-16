import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  Bell, ChevronDown, ChevronRight, MessageSquare, ScrollText, Search, Zap,
} from "lucide-react";
import type { UserIdentity } from "@/lib/quizrealm";
import { ADMIN_NAV, DASHBOARD_ITEM, groupKeyForPath } from "./navigation";

const OPEN_GROUPS_KEY = "quizrealm.admin.openGroups";

interface AdminShellProps {
  user: UserIdentity | null;
  moderationCount?: number;
  children: ReactNode;
}

export default function AdminShell({ user, moderationCount, children }: AdminShellProps) {
  return (
    <div className="admin-root flex min-h-screen">
      <Sidebar moderationCount={moderationCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="min-w-0 flex-1 px-6 pb-10 pt-5">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({ moderationCount }: { moderationCount?: number }) {
  const [location] = useLocation();
  const activeGroup = useMemo(() => groupKeyForPath(location), [location]);

  // Starea de pliere se ține în localStorage: un meniu cu optsprezece secțiuni
  // rearanjat de utilizator n-are voie să se reseteze la fiecare navigare.
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    try {
      const stored = window.localStorage.getItem(OPEN_GROUPS_KEY);
      if (stored) return JSON.parse(stored) as Record<string, boolean>;
    } catch {
      /* preferință coruptă: se pornește de la zero */
    }
    return {};
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(open));
    } catch {
      /* stocare indisponibilă (mod privat): meniul rămâne funcțional */
    }
  }, [open]);

  // Grupul paginii curente se deschide singur, fără să șteargă alegerile
  // făcute manual pentru celelalte.
  useEffect(() => {
    if (activeGroup) setOpen((previous) => (previous[activeGroup] ? previous : { ...previous, [activeGroup]: true }));
  }, [activeGroup]);

  const toggle = (key: string) => setOpen((previous) => ({ ...previous, [key]: !previous[key] }));

  return (
    <aside className="admin-sidebar hidden w-[216px] shrink-0 flex-col lg:flex">
      <Link href="/admin" className="flex shrink-0 items-center gap-2.5 px-4 py-[18px]">
        <span className="admin-logo-mark grid h-8 w-8 shrink-0 place-items-center rounded-lg">
          <ScrollText size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-[13px] leading-tight tracking-wide text-[#efe7ff]">
            QUIZREALM
          </span>
          <span className="block text-[8.5px] font-bold uppercase tracking-[.18em] text-[#6f6885]">
            Admin Panel
          </span>
        </span>
      </Link>

      <nav className="admin-nav-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-3">
        <Link
          href={DASHBOARD_ITEM.href}
          className={`admin-nav-item ${location === DASHBOARD_ITEM.href ? "is-active" : ""}`}
        >
          <DASHBOARD_ITEM.icon size={15} className="shrink-0" />
          <span className="flex-1 truncate">{DASHBOARD_ITEM.label}</span>
        </Link>

        {ADMIN_NAV.map((group) => {
          const isOpen = open[group.key] ?? false;
          const hasActive = group.items.some(
            (item) => location === item.href || location.startsWith(`${item.href}/`),
          );
          const badge = group.badgeKey === "moderation" ? moderationCount : undefined;

          return (
            <div key={group.key} className="pt-1.5">
              <button
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className={`admin-nav-group ${hasActive ? "has-active" : ""}`}
              >
                <group.icon size={13} className="shrink-0" />
                <span className="flex-1 truncate text-left">{group.label}</span>
                {badge != null && badge > 0 && <span className="admin-nav-badge">{badge}</span>}
                {isOpen ? (
                  <ChevronDown size={12} className="shrink-0 opacity-60" />
                ) : (
                  <ChevronRight size={12} className="shrink-0 opacity-60" />
                )}
              </button>

              {isOpen && (
                <div className="admin-nav-children mt-0.5 space-y-px">
                  {group.items.map((item) => (
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
        })}
      </nav>

      <SidebarFooter />
    </aside>
  );
}

function SidebarFooter() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="shrink-0 p-2.5">
      <div className="admin-side-card rounded-xl px-3 py-3">
        <div className="text-[8.5px] font-bold uppercase tracking-[.16em] text-[#6f6885]">
          Server Time
        </div>
        <div className="mt-1 font-mono text-[11px] text-[#cfc7e2]">
          {now.toLocaleTimeString("ro-RO", { hour12: false })}
        </div>
        <div className="text-[10px] text-[#6f6885]">
          {now.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
        </div>

        <Link
          href="/admin/system/audit"
          className="admin-ghost-button mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] font-semibold"
        >
          View Audit Logs <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  );
}

function TopBar({ user }: { user: UserIdentity | null }) {
  return (
    <header className="admin-topbar sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-3 px-4">
      <label className="admin-search relative hidden min-w-0 max-w-[290px] flex-1 items-center rounded-lg sm:flex">
        <Search size={13} className="ml-2.5 shrink-0 text-[#6f6885]" />
        <input
          placeholder="Search players, matches, questions..."
          className="min-w-0 flex-1 bg-transparent px-2 py-[7px] text-[11.5px] text-[#d9d2ea] outline-none placeholder:text-[#615a78]"
        />
        <kbd className="admin-kbd mr-1.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold">
          Ctrl K
        </kbd>
      </label>

      <div className="ml-auto flex items-center gap-2.5">
        <button className="admin-chip flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34d399] shadow-[0_0_8px_#34d399]" />
          <span className="text-left leading-tight">
            <span className="block text-[8px] uppercase tracking-wider text-[#6f6885]">Environment</span>
            <span className="block font-semibold text-[#d9d2ea]">Production</span>
          </span>
          <ChevronDown size={12} className="text-[#6f6885]" />
        </button>

        <button className="admin-accent-button flex items-center gap-1.5 rounded-lg px-3 py-[7px] text-[11.5px] font-semibold">
          <Zap size={13} /> Quick Actions
        </button>

        <IconButton icon={<Bell size={14} />} />
        <IconButton icon={<MessageSquare size={14} />} />

        <div className="flex items-center gap-2 pl-1">
          <span className="admin-avatar grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold">
            {(user?.displayName ?? user?.username ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden leading-tight md:block">
            <span className="block text-[11px] font-semibold text-[#e4dcf5]">
              {user?.displayName ?? user?.username ?? "—"}
            </span>
            <span className="block text-[9px] text-[#6f6885]">{roleLabel(user?.role)}</span>
          </span>
          <ChevronDown size={12} className="text-[#6f6885]" />
        </div>
      </div>
    </header>
  );
}

function IconButton({ icon }: { icon: ReactNode }) {
  return (
    <button className="admin-icon-button relative grid h-[30px] w-[30px] place-items-center rounded-lg">
      {icon}
    </button>
  );
}

function roleLabel(role: string | undefined): string {
  switch (role) {
    case "ADMIN":
      return "Super Admin";
    case "MODERATOR":
      return "Moderator";
    case "CONTENT_EDITOR":
      return "Content Editor";
    case "SUPPORT":
      return "Support";
    default:
      return "—";
  }
}
