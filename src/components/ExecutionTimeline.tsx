import { motion } from "framer-motion";
import { Check, Loader2, ExternalLink } from "lucide-react";
import { SAMPLE_ROUTE } from "../lib/mock";
import { CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

export function ExecutionTimeline({ activeStep = 5 }: { activeStep?: number }) {
  return (
    <div className="card">
      <CardHeader
        title="Execution timeline"
        subtitle="Intent lifecycle across SIS Minitia, L1 Hub, and the target rollup"
        right={<Badge tone="neutral">8 steps · ~3.8s</Badge>}
      />

      <ol className="space-y-px">
        {SAMPLE_ROUTE.map((hop) => {
          const status =
            hop.step < activeStep ? "done" : hop.step === activeStep ? "running" : "queued";
          return (
            <li
              key={hop.step}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-3 py-2.5"
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {status === "done" && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
                {status === "running" && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-3.5 w-3.5 text-accent" />
                  </motion.span>
                )}
                {status === "queued" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-line-strong" />
                )}
              </span>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="mono-num text-2xs text-ink-500">
                    {hop.step.toString().padStart(2, "0")}
                  </span>
                  <span
                    className={
                      status === "queued" ? "text-sm text-ink-400" : "text-sm text-ink-50"
                    }
                  >
                    {hop.label}
                  </span>
                  <Badge tone="neutral">{hop.venue}</Badge>
                </div>
                <div className="mt-0.5 truncate text-xs text-ink-400">{hop.detail}</div>
              </div>

              <div className="text-right">
                <div className="mono-num text-xs text-ink-100">
                  {(hop.estimatedMs / 1000).toFixed(2)}s
                </div>
                <div className="text-2xs text-ink-500">
                  {hop.costINIT > 0 ? `${hop.costINIT.toFixed(3)} INIT` : "free"}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="divider mt-3" />
      <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
        <span>
          IBC receipt posted back to <span className="text-ink-200">SIS Minitia</span>
        </span>
        <a href="#" className="inline-flex items-center gap-1 text-accent hover:underline">
          View receipt <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
