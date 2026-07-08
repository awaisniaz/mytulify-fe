"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------- Button --------------------------------- */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-brand text-brand-fg hover:bg-brand-2 active:scale-[0.98]",
  secondary: "border border-border bg-surface text-foreground hover:bg-surface-2 active:scale-[0.98]",
  ghost: "hover:bg-surface-2 text-foreground active:scale-[0.98]",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-2 active:scale-[0.98]",
  danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
};
const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

/* ----------------------------------- Card ---------------------------------- */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-xl border border-border bg-surface shadow-sm", className)} {...props} />
  );
}

/* --------------------------------- Textarea -------------------------------- */
export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-border bg-surface-2 p-3.5 text-sm",
      "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-brand/40",
      "transition-shadow duration-200 focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_12%,transparent)]",
      "resize-y font-mono leading-relaxed min-h-32",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

/* ---------------------------------- Input ---------------------------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2/80 px-3.5 h-11 text-sm",
        "placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40",
        "transition-all duration-200 focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--brand)_12%,transparent)]",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ---------------------------------- Select --------------------------------- */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-border bg-surface-2 px-3 h-11 text-sm",
      "focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";

/* ---------------------------------- Label ---------------------------------- */
export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-sm font-medium text-foreground mb-1.5", className)}
      {...props}
    />
  );
}

/* --------------------------------- Badge ----------------------------------- */
export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "brand" | "green" | "amber" | "rose";
}) {
  const tones = {
    default: "bg-surface-2 text-muted",
    brand: "bg-brand/10 text-brand",
    green: "bg-emerald-500/10 text-emerald-500",
    amber: "bg-amber-500/10 text-amber-500",
    rose: "bg-rose-500/10 text-rose-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
