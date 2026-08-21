import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

/// Cadrul comun al paginilor de admin: titlu, grup și conținut.
export default function AdminPage({ group, title, subtitle, actions, children }: {
  group: string; title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[9.5px] font-bold uppercase tracking-[.16em] text-[var(--admin-dim)]">{group}</div>
          <h1 className="mt-1.5 text-[23px] font-extrabold leading-none tracking-tight text-[#e8c56a]">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[11.5px] text-[var(--admin-muted)]">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

export function AdminNotice({ tone, text, onClose }: {
  tone: "ok" | "error"; text: string; onClose: () => void;
}) {
  const css = tone === "ok"
    ? "border-[#34d399]/30 bg-[#34d399]/10 text-[#6ee7b7]"
    : "border-[#f87171]/30 bg-[#f87171]/10 text-[#fca5a5]";
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-[11px] ${css}`}>
      <span className="min-w-0 truncate">{text}</span>
      <button onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100"><X size={12} /></button>
    </div>
  );
}

/// Rulează o acțiune de administrare și raportează rezultatul.
///
/// Eroarea serverului se arată ca atare: un „a eșuat" generic ar ascunde exact
/// motivul pentru care o operație de moderare a fost refuzată.
export function usePanelAction() {
  const [notice, setNotice] = useState("");
  const run = async (successText: string, call: () => Promise<unknown>, after?: () => void) => {
    try {
      await call();
      setNotice(successText);
      after?.();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Acțiunea nu a putut fi executată");
    }
  };
  return { notice, run, clearNotice: () => setNotice("") };
}
