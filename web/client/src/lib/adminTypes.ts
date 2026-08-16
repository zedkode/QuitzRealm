/// Contractul răspunsului `/admin/overview`, oglindă a `OverviewService`.

/// Panou fără sursă de date. Se întoarce explicit ca ecranul să poată spune
/// „nu există încă", în loc să afișeze un zero care pare măsurătoare.
export interface NotInstrumented {
  available: false;
  reason: string;
}

export interface ActivityPoint {
  day: string;
  activePlayers: number;
  newPlayers: number;
  matchesPlayed: number;
  questionsAnswered: number;
}

export interface AdminOverview {
  generatedAt: string;
  kpis: {
    activePlayers: { value: number; previous: number };
    engagement: { dau: number; mau: number; ratioPct: number };
    liveMatches: { value: number; previous: number };
    pendingReports: { value: number; previous: number };
    totalQuestions: { value: number; addedThisWeek: number };
    activeCampaigns: NotInstrumented;
    revenue: { cents: number; previousCents: number; currency: string };
    serverUptimeSeconds: number;
  };
  series: ActivityPoint[];
  recentActivity: Array<{
    kind: "report" | "question" | "match" | "payment" | "admin";
    title: string;
    subtitle: string;
    at: string;
  }>;
  moderation: {
    pendingReports: number;
    questionSubmissions: number;
    chatBanRequests: NotInstrumented;
    appeals: NotInstrumented;
  };
  services: Array<{
    key: string;
    name: string;
    status: "up" | "degraded" | "down" | "unknown" | "not_configured";
    latencyMs: number | null;
    uptimePct: number | null;
  }>;
  campaign: NotInstrumented;
  warMap: NotInstrumented;
  topPlayers: Array<{
    id: string;
    username: string;
    eloRating: number;
    matches: number;
    winRatePct: number | null;
  }>;
  recentTransactions: Array<{
    id: string;
    player: string;
    item: string;
    priceCents: number;
    currency: string;
    at: string | null;
  }>;
}
