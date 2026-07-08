"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/auth/config";
import { saveSession } from "@/lib/auth/client";
import { Icon } from "@/components/ui/Icon";

export function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("Missing authorization code");
      return;
    }

    async function exchange() {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = (await res.json()) as {
          accessToken?: string;
          refreshToken?: string;
          user?: Parameters<typeof saveSession>[0]["user"];
          error?: string;
        };
        if (!res.ok || !data.accessToken || !data.refreshToken || !data.user) {
          setError(data.error ?? "Could not complete sign in");
          return;
        }
        saveSession({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        router.replace("/tools");
      } catch {
        setError("Could not reach the server");
      }
    }

    exchange();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-rose-500">{error}</p>
        <a href="/login" className="mt-4 inline-block text-brand hover:underline">
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted">
      <Icon name="Loader2" className="h-5 w-5 animate-spin" />
      Completing sign in…
    </div>
  );
}
