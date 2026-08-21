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

export interface GrowthPoint {
  day: string;
  newPlayers: number;
  returningPlayers: number;
  totalPlayers: number;
  matchesPlayed: number;
  questionsTotal: number;
  newReports: number;
  revenueCents: number;
}

export interface Delta {
  value: number;
  deltaPct: number | null;
}

export interface Money {
  cents: number;
  deltaPct: number | null;
}

/// Procent derivat, cu explicația din care a ieșit. `basis` se arată la hover:
/// un indicator compus fără bază de calcul e o cifră în care nu poți avea
/// încredere.
export interface DerivedPct {
  pct: number;
  basis: string;
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
    actor: string;
    action: string;
    target: string;
    details: string;
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

  growth: {
    series: GrowthPoint[];
    summary: {
      newPlayers: Delta;
      returningPlayers: Delta;
      totalGrowth: Delta;
    };
  };

  storeRevenue: {
    currency: string;
    today: Money;
    sevenDays: Money;
    thirtyDays: Money;
    topItem: { name: string; cents: number } | null;
  };

  coinEconomy: {
    minted30d: number;
    spent30d: number;
    circulation: number;
    healthy: boolean;
    topSink: { label: string; amount: number } | null;
  };

  questionQueue: {
    total: number;
    buckets: NotInstrumented;
  };

  events: NotInstrumented;
  challenges: NotInstrumented;
  notifications: NotInstrumented;

  moderationAlerts: {
    chatReports: number;
    playerReports: NotInstrumented;
    offensiveNames: NotInstrumented;
    cheatingReports: NotInstrumented;
  };

  platformOverview: {
    contentCoverage: DerivedPct;
    playerEngagement: DerivedPct;
    economyBalance: DerivedPct;
    communityHealth: DerivedPct;
    systemPerformance: DerivedPct;
  };
}
