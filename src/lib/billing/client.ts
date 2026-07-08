import { AUTH_KEYS } from "@/lib/auth/config";
import { migrateLegacyStorage } from "@/lib/brand";

const PRO_KEY = "mytulify_pro_key";

export function getProKey(): string {
  if (typeof window === "undefined") return "";
  migrateLegacyStorage();
  try {
    return localStorage.getItem(PRO_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setProKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(PRO_KEY, key.trim());
    else localStorage.removeItem(PRO_KEY);
  } catch {
    /* private mode */
  }
}

export function proHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const key = getProKey();
  if (key) headers["X-Pro-Key"] = key;

  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem(AUTH_KEYS.accessToken);
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* private mode */
    }
  }

  return headers;
}
