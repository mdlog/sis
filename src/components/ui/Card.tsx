import { cn } from "../../lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...props} />;
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-ink-50">{title}</div>
        {subtitle && <div className="mt-0.5 text-xs text-ink-400">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}
