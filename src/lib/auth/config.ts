import { API_URL } from "@/lib/env";

export { API_URL };

export const AUTH_KEYS = {
  accessToken: "mytulify_access_token",
  refreshToken: "mytulify_refresh_token",
  user: "mytulify_user",
} as const;

export const APP_EVENTS = {
  authUpdated: "mytulify-auth-updated",
  proUpdated: "mytulify-pro-updated",
} as const;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  isPro: boolean;
};
