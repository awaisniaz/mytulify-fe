import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <div className="glass gradient-border relative overflow-hidden rounded-3xl p-10">
        <div className="aurora opacity-30" />
        <div className="relative">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 text-white shadow-xl">
            <Icon name="Search" className="h-8 w-8" />
          </span>
          <h1 className="mt-6 text-6xl font-extrabold gradient-text">404</h1>
          <p className="mt-3 text-lg text-muted">We couldn&apos;t find that page or tool.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-2 px-5 py-2.5 font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <Icon name="Home" className="h-4 w-4" />
              Go home
            </Link>
            <Link
              href="/tools"
              className="glass inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition-all hover:border-brand/30 active:scale-[0.98]"
            >
              Browse tools
              <Icon name="ArrowRight" className="h-4 w-4 text-brand" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
