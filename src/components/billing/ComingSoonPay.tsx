import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/** CTA placeholder on Pro cards while payment gateways are not live. */
export function ComingSoonPay({ className }: { className?: string }) {
  return (
    <div className={cn("mt-8 space-y-2", className)}>
      <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-2/60 py-3 text-sm font-bold text-muted">
        <Icon name="Clock" className="h-4 w-4" />
        Coming soon
      </div>
      <p className="text-center text-xs text-muted">
        Online payments are being set up. You can still use a Pro license key below when you have one.
      </p>
    </div>
  );
}
