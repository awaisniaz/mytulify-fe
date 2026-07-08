"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <div className="glass gradient-border rounded-3xl p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
          <Icon name="AlertTriangle" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">This page hit an unexpected error. You can try again or go back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            Try again
          </button>
          <Link
            href="/"
            className="glass inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all hover:border-brand/30"
          >
            <Icon name="Home" className="h-4 w-4" />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
