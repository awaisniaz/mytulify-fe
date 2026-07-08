import { API_URL, AUTH_KEYS, APP_EVENTS, type AuthUser } from "./config";
import { migrateLegacyStorage } from "@/lib/brand";

export function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  migrateLegacyStorage();
  try {
    return localStorage.getItem(AUTH_KEYS.accessToken) ?? "";
  } catch {
    return "";
  }
}

export function getRefreshToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(AUTH_KEYS.refreshToken) ?? "";
  } catch {
    return "";
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEYS.user);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function saveSession(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}): void {
  localStorage.setItem(AUTH_KEYS.accessToken, input.accessToken);
  localStorage.setItem(AUTH_KEYS.refreshToken, input.refreshToken);
  localStorage.setItem(AUTH_KEYS.user, JSON.stringify(input.user));
  window.dispatchEvent(new Event(APP_EVENTS.authUpdated));
  if (input.user.isPro) {
    window.dispatchEvent(new Event(APP_EVENTS.proUpdated));
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_KEYS.accessToken);
  localStorage.removeItem(AUTH_KEYS.refreshToken);
  localStorage.removeItem(AUTH_KEYS.user);
  window.dispatchEvent(new Event(APP_EVENTS.authUpdated));
  window.dispatchEvent(new Event(APP_EVENTS.proUpdated));
}

export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearSession();
      return false;
    }
    const data = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    localStorage.setItem(AUTH_KEYS.accessToken, data.accessToken);
    localStorage.setItem(AUTH_KEYS.refreshToken, data.refreshToken);
    window.dispatchEvent(new Event(APP_EVENTS.authUpdated));
    return true;
  } catch {
    return false;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } finally {
    clearSession();
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const token = getAccessToken();
  if (!token) return null;

  let res = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    const ok = await refreshSession();
    if (!ok) return null;
    res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: authHeaders(),
    });
  }

  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser };
  localStorage.setItem(AUTH_KEYS.user, JSON.stringify(data.user));
  return data.user;
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

export function isProUser(): boolean {
  return getStoredUser()?.isPro ?? false;
}
