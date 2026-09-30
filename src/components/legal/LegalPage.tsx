import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export function LegalPage({
  label,
  title,
  intro,
  updated,
  sections,
}: {
  label: string;
  title: string;
  intro: string;
  updated: string;
  sections: { icon: string; title: string; body: string }[];
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="glass gradient-border rounded-3xl p-6 sm:p-10">
        <p className="section-label mb-2">{label}</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-4 text-muted">{intro}</p>
      </div>

      <div className="mt-8 space-y-4">
        {sections.map(({ icon, title: heading, body }) => (
          <div key={heading} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Icon name={icon} className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-bold">{heading}</h2>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <nav className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
        <Link href="/contact" className="hover:text-foreground">Contact</Link>
        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link href="/terms" className="hover:text-foreground">Terms</Link>
        <Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link>
      </nav>
      <p className="mt-4 text-center text-sm text-muted">Last updated: {updated}.</p>
    </div>
  );
}
