import { motion, AnimatePresence } from "framer-motion";
import { SOLVERS } from "../lib/mock";
import { CardHeader } from "./ui/Card";
import { Badge, Dot } from "./ui/Badge";

type Bid = {
  solverId: string;
  feeINIT: number;
  etaMs: number;
  hops: number;
  winning?: boolean;
};

const BIDS: Bid[] = [
  { solverId: "s1", feeINIT: 0.072, etaMs: 3_810, hops: 4, winning: true },
  { solverId: "s2", feeINIT: 0.081, etaMs: 4_210, hops: 4 },
  { solverId: "s3", feeINIT: 0.078, etaMs: 4_620, hops: 5 },
  { solverId: "s4", feeINIT: 0.094, etaMs: 3_940, hops: 3 },
  { solverId: "s5", feeINIT: 0.088, etaMs: 5_100, hops: 5 },
];

export function SolverAuction() {
  return (
    <div className="card">
      <CardHeader
        title="Solver auction"
        subtitle="Scored on fee · ETA · route safety"
        right={
          <Badge tone="accent">
            <Dot tone="accent" /> Live
          </Badge>
        }
      />

      <div className="surface-subtle rounded-md">
        <div className="hairline-b grid grid-cols-12 gap-3 px-3 py-2 text-2xs uppercase tracking-widest text-ink-500">
          <div className="col-span-5">Solver</div>
          <div className="col-span-2 text-right">Fee</div>
          <div className="col-span-2 text-right">ETA</div>
          <div className="col-span-2 text-right">Hops</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        <AnimatePresence>
          {BIDS.sort((a, b) => a.feeINIT - b.feeINIT).map((bid, i) => {
            const solver = SOLVERS.find((s) => s.id === bid.solverId)!;
            return (
              <motion.div
                key={bid.solverId}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-12 items-center gap-3 border-t border-line px-3 py-2.5 text-sm ${
                  bid.winning ? "bg-accent/[0.04]" : ""
                }`}
              >
                <div className="col-span-5 flex min-w-0 items-center gap-2">
                  <span className="mono-num w-6 text-2xs text-ink-500">#{i + 1}</span>
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[13px] text-ink-50">
                      {solver.handle}
                    </div>
                    <div className="text-2xs text-ink-500">
                      rep {solver.reputation}% · {solver.intentsSolved.toLocaleString()} solved
                    </div>
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <div className="mono-num text-xs text-ink-100">{bid.feeINIT.toFixed(3)}</div>
                  <div className="text-2xs text-ink-500">INIT</div>
                </div>
                <div className="col-span-2 mono-num text-right text-xs text-ink-100">
                  {(bid.etaMs / 1000).toFixed(2)}s
                </div>
                <div className="col-span-2 mono-num text-right text-xs text-ink-100">
                  {bid.hops}
                </div>
                <div className="col-span-1 text-right">
                  {bid.winning ? (
                    <Badge tone="accent">won</Badge>
                  ) : (
                    <span className="text-2xs text-ink-500">—</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between text-2xs text-ink-500">
        <span>Winner locks in 420ms · losers forfeit no stake</span>
        <span className="font-mono">commit 0x8c…f21</span>
      </div>
    </div>
  );
}
