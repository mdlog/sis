import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function StatTile({
  label,
  value,
  delta,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface rounded-xl p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <span className="text-ink-500">{icon}</span>}
      </div>
      <div className="mt-3 mono-num text-2xl text-ink-50">{value}</div>
      {delta && <div className="mt-0.5 text-xs text-ink-400">{delta}</div>}
    </div>
  );
}
