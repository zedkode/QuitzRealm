import type { NotInstrumented } from "./adminTypes";

export type PlayerStatus = "ACTIVE" | "IDLE" | "OFFLINE" | "SUSPENDED";
export type PlayerPlan = "PREMIUM" | "FREE";

export interface PlayerRow {
  id: string;
  playerId: string;
  username: string;
  displayName: string;
  level: number;
  countryCode: string | null;
  role: string;
  status: PlayerStatus;
  lastOnlineAt: string | null;
  joinedAt: string;
  plan: PlayerPlan;
  reports: number;
  emailMasked: string;
  verified: boolean;
  bannedAt: string | null;
}

export interface PlayerPage {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  rows: PlayerRow[];
}

export interface PlayerDetail extends Omit<PlayerRow, "lastOnlineAt"> {
  xp: number;
  eloRating: number;
  continent: string;
  lastLoginAt: string | null;
  linkedDevices: number;
  reportsAgainst: number;
  reportsMade: number;
  matches: number;
  coins: number;
  gems: number;
  chatMutedUntil: string | null;
  shadowBannedUntil: string | null;
  trust: { value: number; basis: string; tier: number };
  language: NotInstrumented;
  faction: NotInstrumented;
}

export interface PlayerStats {
  generatedAt: string;
  kpis: {
    totalPlayers: { value: number; deltaPct: number | null };
    activeToday: { value: number; deltaPct: number | null };
    newSignups24h: { value: number; deltaPct: number | null };
    flaggedAccounts: { value: number; deltaPct: number | null };
    premiumPlayers: { value: number; deltaPct: number | null };
    avgSessionTime: NotInstrumented;
  };
  growth: Array<{ day: string; totalPlayers: number; joined: number }>;
  regional: {
    total: number;
    buckets: Array<{ name: string; count: number; sharePct: number }>;
  };
  segments: {
    total: number;
    rows: Array<{ key: string; label: string; value: number; sharePct: number }>;
  };
  recentActivity: Array<{ userId: string; name: string; text: string; at: string }>;
  suspicious: Array<{ userId: string; name: string; reason: string; count: number }>;
  moderationActions: Array<{
    id: string;
    at: string;
    actor: string;
    actorRole: string;
    action: string;
    target: string;
    targetType: string;
    details: string;
  }>;
}

/// Filtrele din bara de sus, într-un singur obiect. Ele formează cheia de
/// reîncărcare a listei, deci trebuie să fie serializabile fără surprize.
export interface PlayerFilters {
  search: string;
  region: string;
  status: string;
  role: string;
  plan: string;
  joinedFrom: string;
  joinedTo: string;
  sort: string;
  dir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const DEFAULT_FILTERS: PlayerFilters = {
  search: "", region: "ALL", status: "ALL", role: "ALL", plan: "ALL",
  joinedFrom: "", joinedTo: "", sort: "joinDate", dir: "desc", page: 1, pageSize: 10,
};

export function filtersToQuery(filters: PlayerFilters): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === "ALL") continue;
    params.set(key, String(value));
  }
  return params.size > 0 ? `?${params.toString()}` : "";
}

/// Câte filtre sunt puse acum. Decide dacă „Clear Filters" are ce curăța.
export function activeFilterCount(filters: PlayerFilters): number {
  const keys: Array<keyof PlayerFilters> = ["search", "region", "status", "role", "plan", "joinedFrom", "joinedTo"];
  return keys.filter((key) => filters[key] !== "" && filters[key] !== "ALL").length;
}
