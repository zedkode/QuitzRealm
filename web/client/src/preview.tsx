// FIȘIER TEMPORAR — verificare vizuală a panoului de admin. Se șterge după.
import { createRoot } from "react-dom/client";
import { useState } from "react";
import AdminShell from "./admin/AdminShell";
import AdminDashboard from "./admin/Dashboard";
import "./index.css";

const day = (offset: number) => new Date(Date.now() - offset * 86_400_000).toISOString();

const overview = {
  generatedAt: new Date().toISOString(),
  kpis: {
    activePlayers: { value: 18642, previous: 16580 },
    engagement: { dau: 8742, mau: 28913, ratioPct: 30.2 },
    liveMatches: { value: 356, previous: 327 },
    pendingReports: { value: 12, previous: 16 },
    totalQuestions: { value: 42817, addedThisWeek: 156 },
    activeCampaigns: { available: false, reason: "Nu există model de campanie." },
    revenue: { cents: 9461500, previousCents: 7978000, currency: "RON" },
    serverUptimeSeconds: 7_776_000,
  },
  series: [6, 5, 4, 3, 2, 1, 0].map((offset, index) => ({
    day: day(offset),
    activePlayers: 17000 + index * 320,
    newPlayers: 2200 + index * 90,
    matchesPlayed: 7100 + index * 140,
    questionsAnswered: 28000 + index * 900,
  })),
  recentActivity: [
    { kind: "report", title: "Jucător raportat", subtitle: "AstraNoir · global", at: day(0) },
    { kind: "question", title: "Întrebare aprobată", subtitle: "Conducători medievali", at: day(0) },
    { kind: "match", title: "Partidă începută", subtitle: "CLASSIC", at: day(0) },
    { kind: "payment", title: "Plată încasată", subtitle: "49.99 RON · Player#74621", at: day(0) },
    { kind: "admin", title: "Acțiune de administrare", subtitle: "store.powerup.create · Andrei", at: day(1) },
  ],
  moderation: {
    pendingReports: 12,
    questionSubmissions: 8,
    chatBanRequests: { available: false, reason: "fără coadă separată" },
    appeals: { available: false, reason: "fără flux de contestații" },
  },
  services: [
    { key: "api", name: "Web API", status: "up", latencyMs: null, uptimePct: null },
    { key: "database", name: "Database", status: "up", latencyMs: 3, uptimePct: null },
    { key: "game", name: "Game Engine", status: "unknown", latencyMs: null, uptimePct: null },
    { key: "matchmaking", name: "Matchmaking", status: "unknown", latencyMs: null, uptimePct: null },
    { key: "realtime", name: "Realtime Gateway", status: "unknown", latencyMs: null, uptimePct: null },
    { key: "payments", name: "Payments", status: "not_configured", latencyMs: null, uptimePct: null },
    { key: "cdn", name: "CDN / Assets", status: "unknown", latencyMs: null, uptimePct: null },
  ],
  campaign: { available: false, reason: "Nu există campanii sezoniere în backend." },
  warMap: { available: false, reason: "Harta persistentă a României nu există încă." },
  topPlayers: [
    { id: "1", username: "AstraNoir", eloRating: 42815, matches: 1248, winRatePct: 72.4 },
    { id: "2", username: "VelvetRune", eloRating: 39120, matches: 1103, winRatePct: 68.1 },
    { id: "3", username: "M. Orpheus", eloRating: 37440, matches: 986, winRatePct: 65.7 },
    { id: "4", username: "KestrelVoid", eloRating: 35210, matches: 902, winRatePct: 62.3 },
  ],
  recentTransactions: [
    { id: "t1", player: "Player#74621", item: "Conquest Bundle", priceCents: 4999, currency: "RON", at: day(0) },
    { id: "t2", player: "AstraNoir", item: "Gems 1200", priceCents: 9999, currency: "RON", at: day(0) },
  ],
};

const originalFetch = window.fetch.bind(window);
window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
  if (url.includes("/admin/overview")) {
    return new Response(JSON.stringify(overview), { headers: { "Content-Type": "application/json" } });
  }
  return originalFetch(input as RequestInfo, init);
}) as typeof window.fetch;

function Preview() {
  const [count, setCount] = useState<number | undefined>(undefined);
  return (
    <AdminShell
      user={{ id: "1", username: "Andrei", displayName: "Alexandru I.", email: "a@b.c", role: "ADMIN" }}
      moderationCount={count}
    >
      <AdminDashboard onModerationCount={setCount} />
    </AdminShell>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
