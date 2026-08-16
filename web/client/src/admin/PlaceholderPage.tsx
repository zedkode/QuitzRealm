import { Link } from "wouter";
import { ArrowRight, Check, CircleDashed, Compass, Wrench } from "lucide-react";
import {
  ALL_SECTIONS, STAGE_META, routeFor, type AdminNavItem, type AdminStage,
} from "./navigation";

/// Pagina secțiunilor care încă n-au ecran propriu.
///
/// Nu e un „coming soon": spune exact ce va face pagina, ce va putea
/// administratorul pe ea și ce anume lipsește ca să existe. Un link care duce
/// undeva unde scrie ce urmează e mai util decât unul care duce nicăieri.
export default function AdminPlaceholderPage({ path }: { path: string }) {
  const route = routeFor(path);

  if (!route) return <UnknownRoute path={path} />;

  const stage = STAGE_META[route.stage];
  const siblings = (ALL_SECTIONS.find((section) => section.key === route.sectionKey)?.items ?? [])
    .filter((item) => item.href !== route.href);

  return (
    <div className="min-w-0">
      <header className="mb-4">
        <div className="admin-eyebrow">{route.section}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
          <h1 className="font-display text-[26px] leading-none text-[#e8c56a]">{route.label}</h1>
          <StageTag stage={route.stage} />
        </div>
        <p className="mt-2 max-w-3xl text-[11.5px] leading-5 text-[var(--admin-muted)]">{route.summary}</p>
      </header>

      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1.4fr_1fr]">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <Compass size={12} className="shrink-0 text-[#b9a3ff]" />
            <span className="admin-panel-title">Ce va face ecranul</span>
          </div>
          <ul className="space-y-1.5 p-3">
            {route.capabilities.map((capability) => (
              <li key={capability} className="flex gap-2 text-[11px] leading-5 text-[#b6adcd]">
                <Check size={12} className="mt-[3px] shrink-0 text-[#6ee7b7]" />
                <span>{capability}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-2.5">
          <section className="admin-panel">
            <div className="admin-panel-head">
              <Wrench size={12} className="shrink-0 text-[#f0cf7a]" />
              <span className="admin-panel-title">Stadiu de dezvoltare</span>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-2">
                <StageTag stage={route.stage} />
                <span className="text-[10.5px] text-[var(--admin-muted)]">{stage.note}</span>
              </div>
              {route.blocker && (
                <p className="mt-2.5 border-t border-[var(--admin-line)] pt-2.5 text-[10.5px] leading-5 text-[#a49bbd]">
                  <span className="admin-eyebrow block">Ce lipsește</span>
                  <span className="mt-1 block">{route.blocker}</span>
                </p>
              )}
              <code className="mt-3 inline-block rounded-md border border-[var(--admin-line)] bg-[#0b0a14] px-2 py-1 text-[10px] text-[var(--admin-dim)]">
                {path}
              </code>
            </div>
          </section>

          {siblings.length > 0 && (
            <section className="admin-panel">
              <div className="admin-panel-head">
                <CircleDashed size={12} className="shrink-0 text-[#8f7fd0]" />
                <span className="admin-panel-title">Restul secțiunii {route.section}</span>
              </div>
              <div className="p-1.5">
                {siblings.map((item) => <SiblingLink key={item.href} item={item} />)}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SiblingLink({ item }: { item: AdminNavItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[.035]"
    >
      <span className="min-w-0 flex-1 truncate text-[11px] text-[#b6adcd]">{item.label}</span>
      <StageTag stage={item.stage} />
      <ArrowRight size={11} className="shrink-0 text-[var(--admin-dim)]" />
    </Link>
  );
}

function StageTag({ stage }: { stage: AdminStage }) {
  const meta = STAGE_META[stage];
  return <span className={`admin-tag admin-tag-${meta.tone} shrink-0`}>{meta.label}</span>;
}

function UnknownRoute({ path }: { path: string }) {
  return (
    <div className="min-w-0">
      <header className="mb-4">
        <div className="admin-eyebrow">Admin</div>
        <h1 className="mt-1.5 font-display text-[26px] leading-none text-[#e8c56a]">Rută necunoscută</h1>
      </header>
      <section className="admin-panel p-6 text-center">
        <p className="text-[11.5px] text-[var(--admin-muted)]">
          Adresa <code className="text-[#ded6f0]">{path}</code> nu corespunde niciunei secțiuni din meniu.
        </p>
        <Link href="/admin" className="admin-ghost-button mt-4 inline-flex rounded-lg px-3.5 py-2 text-[11px] font-semibold">
          Înapoi la tabloul de bord
        </Link>
      </section>
    </div>
  );
}
