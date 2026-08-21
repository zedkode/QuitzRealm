import { io, type Socket } from "socket.io-client";
import { QUIZREALM_API_BASE, accessToken, authApi, request } from "@quizrealm/shared";

/// Clientul aplicației publice.
///
/// Nucleul HTTP, sesiunea și autentificarea vin din `@quizrealm/shared`, pentru
/// că le folosește și panoul de administrare. Aici rămân doar endpointurile
/// jocului — cele de administrare stau în `admin/src/lib/api.ts` și nu ajung
/// niciodată în bundle-ul livrat unui vizitator.

export { QUIZREALM_API_BASE, clearQuizRealmSession } from "@quizrealm/shared";
export type { AccountRole, AuthTokens, LoginResult, UserIdentity } from "@quizrealm/shared";

export const quizRealmApi = {
  ...authApi,

  achievements: () => request<unknown>("/achievements"),
  achievementSummary: () => request<unknown>("/achievements/summary"),
  leaderboard: (query = "") => request<unknown>(`/leaderboard${query}`),
  publicProfile: (username: string) => request<unknown>(`/players/${encodeURIComponent(username)}`),
  profile: () => request<unknown>("/users/me/profile"),
  stats: () =>
    request<{
      activePlayers: number;
      matchesToday: number;
      questionsMastered: number;
      achievementsUnlocked: number;
      generatedAt: string;
    }>("/health/stats"),
};

export function connectQuizRealmSocket(tokenOverride?: string): Socket {
  const base =
    (import.meta.env.VITE_QUIZREALM_SOCKET_URL as string | undefined) ||
    QUIZREALM_API_BASE ||
    window.location.origin;
  // Duelurile și chatul stau pe namespace-ul `/game`, la fel ca în aplicația
  // Flutter. Fără el, handshake-ul cade cu „Invalid namespace" și pagina rămâne
  // pe „offline".
  const socketUrl = `${base.replace(/\/$/, "")}/game`;
  return io(socketUrl, {
    transports: ["websocket"],
    auth: { token: tokenOverride ?? accessToken() },
  });
}
