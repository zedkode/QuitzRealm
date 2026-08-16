import { useCallback, useEffect, useState } from "react";
import { Ban, Check } from "lucide-react";
import { quizRealmApi } from "@/lib/quizrealm";
import AdminPage, { AdminNotice, usePanelAction } from "./AdminPage";

interface PendingQuestion {
  id: string;
  text: string;
  difficulty?: number;
  source?: string;
}

interface CatalogStats {
  categories?: number;
  approved?: number;
  pending?: number;
  flagged?: number;
}

export default function QuestionReviewPage() {
  const [questions, setQuestions] = useState<PendingQuestion[]>([]);
  const [stats, setStats] = useState<CatalogStats>({});
  const [error, setError] = useState("");
  const { notice, run, clearNotice } = usePanelAction();

  const load = useCallback(() => {
    Promise.all([quizRealmApi.adminQuestions("PENDING"), quizRealmApi.adminQuestionStats()])
      .then(([rows, catalog]) => {
        setQuestions(Array.isArray(rows) ? (rows as PendingQuestion[]) : []);
        setStats((catalog ?? {}) as CatalogStats);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Codexul e indisponibil"));
  }, []);

  useEffect(load, [load]);

  return (
    <AdminPage group="Questions" title="Review Queue" subtitle={`${questions.length} în așteptare`}>
      {error && <AdminNotice tone="error" text={error} onClose={() => setError("")} />}
      {notice && <AdminNotice tone="ok" text={notice} onClose={clearNotice} />}

      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Categorii" value={stats.categories} colour="#e8c877" />
        <StatTile label="Aprobate" value={stats.approved} colour="#6ee7d5" />
        <StatTile label="În așteptare" value={stats.pending} colour="#b9a3ff" />
        <StatTile label="Semnalate" value={stats.flagged} colour="#f9a8d4" />
      </div>

      <section className="admin-panel divide-y divide-[var(--admin-line)]">
        {questions.length === 0 && (
          <p className="px-4 py-10 text-center text-[11px] text-[var(--admin-dim)]">
            Nicio întrebare în așteptare.
          </p>
        )}
        {questions.map((question) => (
          <div key={question.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="min-w-[220px] flex-1 text-[11.5px] leading-5 text-[#ded6f0]">{question.text}</span>
            <span className="flex shrink-0 gap-1.5">
              <button
                onClick={() => run("Întrebare aprobată", () => quizRealmApi.adminReviewQuestion(question.id, "APPROVED"), load)}
                className="flex items-center gap-1 rounded-md border border-[#34d399]/30 px-2.5 py-1 text-[10px] text-[#6ee7b7] hover:border-[#34d399]/60"
              >
                <Check size={11} /> Aprobă
              </button>
              <button
                onClick={() => run("Întrebare respinsă", () => quizRealmApi.adminReviewQuestion(question.id, "REJECTED"), load)}
                className="flex items-center gap-1 rounded-md border border-[#f87171]/30 px-2.5 py-1 text-[10px] text-[#fca5a5] hover:border-[#f87171]/60"
              >
                <Ban size={11} /> Respinge
              </button>
            </span>
          </div>
        ))}
      </section>
    </AdminPage>
  );
}

function StatTile({ label, value, colour }: { label: string; value?: number; colour: string }) {
  return (
    <div className="admin-panel px-3.5 py-3">
      <div className="text-[10px] text-[var(--admin-dim)]">{label}</div>
      <div className="mt-1 text-[19px] font-bold" style={{ color: colour }}>
        {value ?? "—"}
      </div>
    </div>
  );
}
