import { motion } from "framer-motion";
import { Check, Loader2, Gavel } from "lucide-react";
import { CardHeader } from "./ui/Card";
import { Badge, Dot } from "./ui/Badge";
import { useRecentIntents, STATUS_LABEL, type IntentView } from "../lib/queries";
import { IS_MODULE_DEPLOYED } from "../lib/config";
import { LIVE_INTENTS } from "../lib/mock";

export function LiveIntentsFeed() {
  const { data: real = [], isLoading } = useRecentIntents(10);
  const hasReal = IS_MODULE_DEPLOYED;

  return (
    <div className="card">
      <CardHeader
        title="Live intents"
        subtitle={
          hasReal
            ? "Streaming from sis::intent_registry"
            : "Awaiting module deployment — showing demo data"
        }
        right={
          hasReal ? (
            <Badge tone="accent">
              <Dot /> live
            </Badge>
          ) : (
            <Badge tone="neutral">demo</Badge>
          )
        }
      />

      <div className="surface-subtle divide-y divide-line rounded-md">
        {hasReal
          ? isLoading && real.length === 0
            ? <SkeletonRows />
            : real.length === 0
              ? <EmptyRow />
              : real.map((it) => <RealRow key={it.id} intent={it} />)
          : LIVE_INTENTS.map((it, i) => (
              <MockRow key={it.id} it={it} delay={i * 0.03} />
            ))}
      </div>
    </div>
  );
}

function RealRow({ intent }: { intent: IntentView }) {
  const status = intent.status;
  const solverAddr = intent.solver?.vec?.[0] ?? null;
  const rewardUinit = BigInt(intent.reward_uinit);
  const ageSec = Math.max(
    0,
    Math.floor(Date.now() / 1000) - Number(intent.created_at)
  );
  const progress =
    status === 0 ? 10 : status === 1 ? 60 : status === 2 ? 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-[16px_1fr_auto] items-center gap-3 px-3 py-2.5"
    >
      <StatusIcon status={STATUS_LABEL[status]} />
      <div className="min-w-0">
        <div className="truncate text-sm text-ink-50">
          {intent.source_minitia} → {intent.target_minitia} ·{" "}
          <span className="text-ink-400">{intent.desired_asset}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-ink-500">
          <span className="font-mono">#{intent.id}</span>
          <span className="text-ink-600">·</span>
          <span className="font-mono">{short(intent.owner)}</span>
          {solverAddr && (
            <>
              <span className="text-ink-600">·</span>
              <span className="font-mono text-accent">{short(solverAddr)}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden w-32 sm:block">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                status === 2
                  ? "bg-accent"
                  : status === 3
                  ? "bg-rose-400"
                  : "bg-ink-200"
              }`}
            />
          </div>
          <div className="mt-1 text-2xs text-ink-500">
            {progress}% · {ageSec}s
          </div>
        </div>
        <div className="text-right">
          <div className="mono-num text-xs text-ink-50">
            {formatInit(rewardUinit)}
          </div>
          <StatusBadge label={STATUS_LABEL[status]} />
        </div>
      </div>
    </motion.div>
  );
}

function MockRow({ it, delay }: { it: (typeof LIVE_INTENTS)[number]; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="grid grid-cols-[16px_1fr_auto] items-center gap-3 px-3 py-2.5"
    >
      <StatusIcon status={it.status} />
      <div className="min-w-0">
        <div className="truncate text-sm text-ink-50">{it.summary}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-2xs text-ink-500">
          <span className="font-mono">{it.id}</span>
          <span className="text-ink-600">·</span>
          <span className="font-mono">{it.user}</span>
          {it.solver && (
            <>
              <span className="text-ink-600">·</span>
              <span className="font-mono text-accent">{it.solver}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden w-32 sm:block">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-line">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${it.progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                it.status === "Settled"
                  ? "bg-accent"
                  : it.status === "Refunded"
                  ? "bg-rose-400"
                  : "bg-ink-200"
              }`}
            />
          </div>
          <div className="mt-1 text-2xs text-ink-500">
            {it.progress}% · {it.ageSec}s
          </div>
        </div>
        <div className="text-right">
          <div className="mono-num text-xs text-ink-50">
            ${it.valueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <StatusBadge label={it.status} />
        </div>
      </div>
    </motion.div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="grid grid-cols-[16px_1fr_auto] items-center gap-3 px-3 py-2.5"
        >
          <div className="h-3 w-3 rounded-full bg-line" />
          <div>
            <div className="h-3 w-48 rounded bg-line" />
            <div className="mt-1.5 h-2 w-32 rounded bg-line" />
          </div>
          <div className="h-3 w-14 rounded bg-line" />
        </div>
      ))}
    </>
  );
}

function EmptyRow() {
  return (
    <div className="px-3 py-6 text-center text-xs text-ink-500">
      No intents yet. Submit one above to see it appear here.
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Settled")
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </span>
    );
  if (status === "Bidding") return <Gavel className="h-3.5 w-3.5 text-amber-300" />;
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
    >
      <Loader2 className="h-3.5 w-3.5 text-accent" />
    </motion.span>
  );
}

function StatusBadge({ label }: { label: string }) {
  if (label === "Settled") return <Badge tone="accent">settled</Badge>;
  if (label === "Executing" || label === "Claimed") return <Badge tone="info">{label.toLowerCase()}</Badge>;
  if (label === "Bidding" || label === "Pending") return <Badge tone="warning">{label.toLowerCase()}</Badge>;
  return <Badge tone="danger">{label.toLowerCase()}</Badge>;
}

function short(addr: string) {
  if (!addr) return "";
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatInit(uinit: bigint) {
  const init = Number(uinit) / 1_000_000;
  if (init >= 1) return `${init.toFixed(2)} INIT`;
  return `${uinit.toString()} uinit`;
}
