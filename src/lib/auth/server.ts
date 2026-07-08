import { jwtVerify } from "jose";

export type JwtUser = {
  sub: string;
  email: string;
  name: string;
  isPro: boolean;
};

/** Verify Bearer JWT issued by tools-hub-backend. */
export async function verifyAuthToken(request: Request): Promise<JwtUser | null> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      isPro: payload.isPro === true,
    };
  } catch {
    return null;
  }
}
