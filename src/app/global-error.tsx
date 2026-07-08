"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#07060f] text-[#f4f2ff] antialiased">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/20 text-rose-400">
            <Icon name="AlertTriangle" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold">Application error</h1>
          <p className="mt-2 text-sm text-[#9b94b8]">Something broke while loading the app.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-[#8b7cff] px-5 py-2.5 font-semibold text-[#07060f] transition-all hover:brightness-110"
            >
              Try again
            </button>
            <Link href="/" className="rounded-xl border border-white/10 px-5 py-2.5 font-semibold hover:bg-white/5">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
