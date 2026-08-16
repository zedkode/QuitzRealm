import { Construction } from "lucide-react";
import { ADMIN_ROUTES } from "./navigation";

/// Pagina pentru secțiunile din meniu care încă n-au ecran propriu.
///
/// Există ca navigația să fie completă și verificabilă de la început: un link
/// care duce nicăieri e mai greu de observat decât unul care spune deschis că
/// ecranul urmează.
export default function AdminPlaceholderPage({ path }: { path: string }) {
  const route = ADMIN_ROUTES.find((entry) => entry.href === path);

  return (
    <div className="min-w-0">
      <header className="mb-4">
        <div className="text-[9.5px] font-bold uppercase tracking-[.16em] text-[var(--admin-dim)]">
          {route?.group ?? "Admin"}
        </div>
        <h1 className="mt-1.5 font-display text-[26px] leading-none text-[#efe7ff]">
          {route?.label ?? "Secțiune"}
        </h1>
      </header>

      <section className="admin-panel grid min-h-[320px] place-items-center p-8 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#7c5cff]/12 text-[#b9a3ff]">
            <Construction size={20} />
          </span>
          <h2 className="mt-4 text-[15px] font-bold text-[#efe7ff]">Ecranul urmează</h2>
          <p className="mt-2 text-[11.5px] leading-5 text-[var(--admin-muted)]">
            Secțiunea există în navigație, dar ecranul ei nu e construit încă.
            Structura meniului e completă, deci se poate umple pe rând, fără să
            se mai mute nimic.
          </p>
          <code className="mt-4 inline-block rounded-md border border-[var(--admin-line)] bg-[#0b0a14] px-2.5 py-1 text-[10.5px] text-[var(--admin-dim)]">
            {path}
          </code>
        </div>
      </section>
    </div>
  );
}
