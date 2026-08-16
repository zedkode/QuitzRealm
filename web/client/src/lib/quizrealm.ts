import { io, type Socket } from "socket.io-client";

export const QUIZREALM_API_BASE = (import.meta.env.VITE_QUIZREALM_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const API_BASE = QUIZREALM_API_BASE;
const ACCESS_KEY = "quizrealm.web.access";
const REFRESH_KEY = "quizrealm.web.refresh";

export type AuthTokens = { accessToken: string; refreshToken: string };
export type UserIdentity = { id: string; username: string; displayName?: string | null; email: string; role?: "user" | "admin" };
export type LoginResult = AuthTokens | { twoFactorRequired: true; challengeToken: string };

function token() { return typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_KEY); }
function saveTokens(tokens: AuthTokens) { localStorage.setItem(ACCESS_KEY, tokens.accessToken); localStorage.setItem(REFRESH_KEY, tokens.refreshToken); }
export function clearQuizRealmSession() { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); }

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = token();
  if (access) headers.set("Authorization", `Bearer ${access}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }) });
      if (refreshed.ok) { saveTokens(await refreshed.json() as AuthTokens); return request<T>(path, init, false); }
    }
    clearQuizRealmSession();
  }
  if (!response.ok) { const detail = await response.text().catch(() => ""); throw new Error(detail || `QuizRealm API request failed (${response.status})`); }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const quizRealmApi = {
  login: async (email: string, password: string) => { const result = await request<LoginResult>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); if ("accessToken" in result) saveTokens(result); return result; },
  register: async (payload: { username: string; displayName?: string; email: string; password: string; birthDate: string }) => { const result = await request<AuthTokens>("/auth/register", { method: "POST", body: JSON.stringify(payload) }); saveTokens(result); return result; },
  completeTwoFactor: async (challengeToken: string, code: string) => { const result = await request<AuthTokens>("/auth/two-factor/login", { method: "POST", body: JSON.stringify({ challengeToken, code }) }); saveTokens(result); return result; },
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<UserIdentity>("/users/me"),
  achievements: () => request<unknown>("/achievements"),
  achievementSummary: () => request<unknown>("/achievements/summary"),
  leaderboard: (query = "") => request<unknown>(`/leaderboard${query}`),
  publicProfile: (username: string) => request<unknown>(`/players/${encodeURIComponent(username)}`),
  profile: () => request<unknown>("/users/me/profile"),
  adminDashboard: () => request<unknown>("/admin/dashboard"),
  adminUsers: () => request<unknown>("/admin/users"),
  adminBanUser: (id: string) => request<unknown>(`/admin/users/${id}/ban`, { method: "PATCH" }),
  adminUnbanUser: (id: string) => request<unknown>(`/admin/users/${id}/unban`, { method: "PATCH" }),
  adminRevokeSessions: (id: string) => request<unknown>(`/admin/users/${id}/revoke-sessions`, { method: "POST" }),
  adminShadowBan: (id: string, minutes = 60) => request<unknown>(`/admin/users/${id}/shadow-ban`, { method: "PATCH", body: JSON.stringify({ minutes }) }),
  adminForcePasswordReset: (id: string) => request<unknown>(`/admin/users/${id}/force-password-reset`, { method: "POST" }),
  adminChatReports: () => request<unknown>("/admin/reports/chat"),
  adminResolveChatReport: (id: string, resolution: string) => request<unknown>(`/admin/reports/chat/${id}`, { method: "PATCH", body: JSON.stringify({ resolution }) }),
  adminQuestions: (status = "PENDING") => request<unknown>(`/admin/questions?status=${status}`),
  adminQuestionStats: () => request<unknown>("/admin/questions/stats"),
  adminReviewQuestion: (id: string, status: string) => request<unknown>(`/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  stats: () => request<{ activePlayers: number; matchesToday: number; questionsMastered: number; achievementsUnlocked: number; generatedAt: string }>("/health/stats"),
};

export function connectQuizRealmSocket(tokenOverride?: string): Socket {
  const socketUrl = (import.meta.env.VITE_QUIZREALM_SOCKET_URL as string | undefined) || API_BASE || window.location.origin;
  return io(socketUrl, { transports: ["websocket"], auth: { token: tokenOverride ?? token() } });
}
