"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredUser, logout } from "@/lib/auth/client";
import { APP_EVENTS, type AuthUser } from "@/lib/auth/config";
import { Icon } from "@/components/ui/Icon";

export function UserMenu() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    const sync = () => setUser(getStoredUser());
    window.addEventListener(APP_EVENTS.authUpdated, sync);
    return () => window.removeEventListener(APP_EVENTS.authUpdated, sync);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-brand"
      >
        Sign in
      </Link>
    );
  }

  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-border px-2 py-1.5 [&::-webkit-details-marker]:hidden">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-lg object-cover" />
        ) : (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-xs font-bold text-brand">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate text-sm font-semibold sm:block">{user.name}</span>
        {user.isPro && (
          <span className="hidden rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand sm:inline">
            Pro
          </span>
        )}
        <Icon name="ChevronDown" className="h-4 w-4 text-muted group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 rounded-xl border border-border bg-surface p-1 shadow-xl">
        <p className="truncate px-3 py-2 text-xs text-muted">{user.email}</p>
        <Link href="/pricing" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2">
          {user.isPro ? "Manage Pro" : "Upgrade to Pro"}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-500 hover:bg-surface-2"
        >
          Sign out
        </button>
      </div>
    </details>
  );
}
