import { cn } from "../../lib/cn";
import type { ReactNode } from "react";

type Tone = "accent" | "neutral" | "warning" | "danger" | "success" | "info";

const toneClass: Record<Tone, string> = {
  accent: "text-accent border-accent/25 bg-accent/[0.06]",
  success: "text-emerald-300 border-emerald-400/25 bg-emerald-400/[0.06]",
  info: "text-sky-300 border-sky-400/25 bg-sky-400/[0.06]",
  warning: "text-amber-300 border-amber-400/25 bg-amber-400/[0.06]",
  danger: "text-rose-300 border-rose-400/25 bg-rose-400/[0.06]",
  neutral: "text-ink-200 border-line bg-bg-subtle",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-2xs font-medium",
        toneClass[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "accent" }: { tone?: Tone }) {
  const color = {
    accent: "bg-accent",
    success: "bg-emerald-400",
    info: "bg-sky-400",
    warning: "bg-amber-400",
    danger: "bg-rose-400",
    neutral: "bg-ink-400",
  }[tone];
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping", color)} />
      <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", color)} />
    </span>
  );
}
