import { useCallback, useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import AdminPage, { AdminNotice, usePanelAction } from "./AdminPage";

interface ChatReport {
  id: string;
  scope: string;
  reason: string;
  reportedUserId?: string;
  contentSnapshot?: string;
  createdAt?: string;
}

export default function ChatModerationPage() {
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [error, setError] = useState("");
  const { notice, run, clearNotice } = usePanelAction();

  const load = useCallback(() => {
    quizRealmApi
      .adminChatReports()
      .then((rows) => setReports(Array.isArray(rows) ? (rows as ChatReport[]) : []))
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Rapoartele sunt indisponibile"));
  }, []);

  useEffect(load, [load]);

  return (
    <AdminPage group="Moderation" title="Chat Moderation" subtitle={`${reports.length} rapoarte deschise`}>
      {error && <AdminNotice tone="error" text={error} onClose={() => setError("")} />}
      {notice && <AdminNotice tone="ok" text={notice} onClose={clearNotice} />}

      <section className="admin-panel divide-y divide-[var(--admin-line)]">
        {reports.length === 0 && (
          <p className="px-4 py-10 text-center text-[11px] text-[var(--admin-dim)]">
            Nicio sesizare deschisă.
          </p>
        )}
        {reports.map((report) => (
          <div key={report.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#ec4899]/12 text-[#f9a8d4]">
              <Flag size={14} />
            </span>
            <span className="min-w-[200px] flex-1">
              <span className="block truncate text-[11.5px] text-[#ded6f0]">
                {report.contentSnapshot || report.reason}
              </span>
              <span className="block truncate text-[10px] text-[var(--admin-dim)]">
                {report.scope} · {report.reason}
              </span>
            </span>
            <span className="flex gap-1.5">
              <button
                onClick={() => run("Sesizare respinsă", () => quizRealmApi.adminResolveChatReport(report.id, "DISMISSED"), load)}
                className="rounded-md border border-[var(--admin-line)] px-2.5 py-1 text-[10px] text-[var(--admin-muted)] hover:text-[#d6c8ff]"
              >
                Respinge
              </button>
              <button
                onClick={() => run("Jucător amuțit", () => quizRealmApi.adminResolveChatReport(report.id, "MUTED"), load)}
                className="rounded-md border border-[#e0ba58]/30 px-2.5 py-1 text-[10px] text-[#e8c877] hover:border-[#e0ba58]/60"
              >
                Amuțește
              </button>
              {report.reportedUserId && (
                <button
                  onClick={() => run("Sigiliu de umbră aplicat", () => quizRealmApi.adminShadowBan(report.reportedUserId!, 60), load)}
                  className="rounded-md border border-[#7c5cff]/30 px-2.5 py-1 text-[10px] text-[#b9a3ff] hover:border-[#7c5cff]/60"
                >
                  Shadow-ban
                </button>
              )}
            </span>
          </div>
        ))}
      </section>
    </AdminPage>
  );
}
