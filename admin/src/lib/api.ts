import { request } from "@quizrealm/shared";

/// Endpointurile de administrare.
///
/// Stau aici, nu în pachetul comun: site-ul public n-are ce face cu ele, iar
/// dacă ar sta împreună ar ajunge în bundle-ul livrat oricărui vizitator.
export const adminApi = {
  overview: (days = 7) => request<unknown>(`/admin/overview?days=${days}`),
  dashboard: () => request<unknown>("/admin/dashboard"),

  /* --- jucători --- */
  players: (query: string) => request<unknown>(`/admin/players${query}`),
  playerStats: () => request<unknown>("/admin/players/stats"),
  playerDetail: (id: string) => request<unknown>(`/admin/players/${id}`),
  revealEmail: (id: string) =>
    request<{ email: string }>(`/admin/players/${id}/reveal-email`, { method: "POST" }),
  playersBulk: (action: string, ids: string[]) =>
    request<unknown>("/admin/players/bulk", {
      method: "POST",
      body: JSON.stringify({ action, ids }),
    }),

  /* --- conturi, acțiuni individuale --- */
  users: () => request<unknown>("/admin/users"),
  banUser: (id: string) => request<unknown>(`/admin/users/${id}/ban`, { method: "PATCH" }),
  unbanUser: (id: string) => request<unknown>(`/admin/users/${id}/unban`, { method: "PATCH" }),
  revokeSessions: (id: string) =>
    request<unknown>(`/admin/users/${id}/revoke-sessions`, { method: "POST" }),
  shadowBan: (id: string, minutes = 60) =>
    request<unknown>(`/admin/users/${id}/shadow-ban`, {
      method: "PATCH",
      body: JSON.stringify({ minutes }),
    }),
  forcePasswordReset: (id: string) =>
    request<unknown>(`/admin/users/${id}/force-password-reset`, { method: "POST" }),

  /* --- moderare --- */
  chatReports: () => request<unknown>("/admin/reports/chat"),
  resolveChatReport: (id: string, resolution: string) =>
    request<unknown>(`/admin/reports/chat/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ resolution }),
    }),

  /* --- întrebări --- */
  questions: (status = "PENDING") => request<unknown>(`/admin/questions?status=${status}`),
  questionStats: () => request<unknown>("/admin/questions/stats"),
  reviewQuestion: (id: string, status: string) =>
    request<unknown>(`/admin/questions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
