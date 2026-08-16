import { useCallback, useEffect, useState } from "react";
import { Ban, KeyRound, LogOut, ShieldOff } from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import AdminPage, { AdminNotice, usePanelAction } from "./AdminPage";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  bannedAt: string | null;
  eloRating: number;
  createdAt: string;
}

export default function PlayersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState("");
  const { notice, run, clearNotice } = usePanelAction();

  const load = useCallback(() => {
    quizRealmApi
      .adminUsers()
      .then((rows) => setUsers(Array.isArray(rows) ? (rows as AdminUser[]) : []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Lista de jucători e indisponibilă"));
  }, []);

  useEffect(load, [load]);

  return (
    <AdminPage group="Players" title="All Players" subtitle={`${users.length} conturi`}>
      {error && <AdminNotice tone="error" text={error} onClose={() => setError("")} />}
      {notice && <AdminNotice tone="ok" text={notice} onClose={clearNotice} />}

      <section className="admin-panel overflow-hidden">
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_70px_minmax(0,240px)] gap-3 border-b border-[var(--admin-line)] px-4 py-2.5 text-[9px] uppercase tracking-wider text-[var(--admin-dim)]">
          <span>Jucător</span><span>Email</span><span>Rol</span><span className="text-right">ELO</span><span className="text-right">Acțiuni</span>
        </div>
        <div className="divide-y divide-[var(--admin-line)]">
          {users.length === 0 && (
            <p className="px-4 py-8 text-center text-[11px] text-[var(--admin-dim)]">Niciun cont încărcat.</p>
          )}
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_90px_70px_minmax(0,240px)] items-center gap-3 px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="admin-avatar grid h-6 w-6 shrink-0 place-items-center rounded-full text-[9px] font-bold">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] text-[#ded6f0]">{user.username}</span>
                  {user.bannedAt && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-[#f87171]">suspendat</span>
                  )}
                </span>
              </span>
              <span className="truncate text-[11px] text-[var(--admin-muted)]">{user.email}</span>
              <span className="text-[10px] text-[var(--admin-muted)]">{user.role}</span>
              <span className="text-right text-[11px] font-semibold text-[#e8c877]">{user.eloRating}</span>
              <span className="flex justify-end gap-1.5">
                <RowButton
                  tone={user.bannedAt ? "ok" : "danger"}
                  icon={user.bannedAt ? <ShieldOff size={11} /> : <Ban size={11} />}
                  label={user.bannedAt ? "Ridică banul" : "Suspendă"}
                  onClick={() =>
                    run(
                      user.bannedAt ? "Suspendare ridicată" : "Cont suspendat",
                      () => (user.bannedAt ? quizRealmApi.adminUnbanUser(user.id) : quizRealmApi.adminBanUser(user.id)),
                      load,
                    )
                  }
                />
                <RowButton
                  icon={<LogOut size={11} />} label="Rupe sesiunile"
                  onClick={() => run("Sesiuni revocate", () => quizRealmApi.adminRevokeSessions(user.id), load)}
                />
                <RowButton
                  icon={<KeyRound size={11} />} label="Resetare parolă"
                  onClick={() => run("Resetare de parolă cerută", () => quizRealmApi.adminForcePasswordReset(user.id), load)}
                />
              </span>
            </div>
          ))}
        </div>
      </section>
    </AdminPage>
  );
}

function RowButton({ icon, label, onClick, tone }: {
  icon: React.ReactNode; label: string; onClick: () => void; tone?: "danger" | "ok";
}) {
  const toneClass =
    tone === "danger"
      ? "border-[#f87171]/30 text-[#fca5a5] hover:border-[#f87171]/60"
      : tone === "ok"
        ? "border-[#34d399]/30 text-[#6ee7b7] hover:border-[#34d399]/60"
        : "border-[var(--admin-line)] text-[var(--admin-muted)] hover:border-[#7c5cff]/45 hover:text-[#d6c8ff]";
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[9.5px] ${toneClass}`}
    >
      {icon} {label}
    </button>
  );
}
