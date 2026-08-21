import type { AuthTokens, LoginResult, UserIdentity } from "./types";

/// Clientul HTTP către `backend/api`, folosit identic de web și de panou.
///
/// Stă în pachetul comun pentru că logica de reîmprospătare a sesiunii e exact
/// genul de cod care se dezacordă tăcut în două copii: una repară o eroare de
/// reînnoire, cealaltă rămâne cu bucla veche, iar simptomul apare ca o
/// deconectare aleatorie într-una din aplicații.

export const QUIZREALM_API_BASE =
  (import.meta.env?.VITE_QUIZREALM_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

const ACCESS_KEY = "quizrealm.web.access";
const REFRESH_KEY = "quizrealm.web.refresh";

export function accessToken(): string | null {
  return typeof window === "undefined" ? null : window.localStorage.getItem(ACCESS_KEY);
}

export function saveTokens(tokens: AuthTokens): void {
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearQuizRealmSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

/// O cerere către API, cu o singură încercare de reînnoire a sesiunii.
///
/// `retry` există ca să nu se intre în buclă: dacă și cererea reluată după
/// reîmprospătare primește 401, sesiunea se curăță și eroarea urcă.
export async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = accessToken();
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await fetch(`${QUIZREALM_API_BASE}${path}`, { ...init, headers });

  if (response.status === 401 && retry) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      const refreshed = await fetch(`${QUIZREALM_API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshed.ok) {
        saveTokens((await refreshed.json()) as AuthTokens);
        return request<T>(path, init, false);
      }
    }
    clearQuizRealmSession();
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `QuizRealm API request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/// Autentificarea, comună celor două aplicații: și panoul are nevoie de login,
/// de al doilea factor și de `/users/me`.
export const authApi = {
  login: async (email: string, password: string): Promise<LoginResult> => {
    const result = await request<LoginResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if ("accessToken" in result) saveTokens(result);
    return result;
  },
  register: async (payload: {
    username: string; displayName?: string; email: string; password: string; birthDate: string;
  }): Promise<AuthTokens> => {
    const result = await request<AuthTokens>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    saveTokens(result);
    return result;
  },
  completeTwoFactor: async (challengeToken: string, code: string): Promise<AuthTokens> => {
    const result = await request<AuthTokens>("/auth/two-factor/login", {
      method: "POST",
      body: JSON.stringify({ challengeToken, code }),
    });
    saveTokens(result);
    return result;
  },
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<UserIdentity>("/users/me"),
};
