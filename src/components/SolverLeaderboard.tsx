import { CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { useSolverLeaderboard, type SolverStatView } from "../lib/queries";
import { IS_MODULE_DEPLOYED } from "../lib/config";
import { SOLVERS } from "../lib/mock";

export function SolverLeaderboard() {
  const { data: real = [], isLoading } = useSolverLeaderboard(10);
  const hasReal = IS_MODULE_DEPLOYED;

  return (
    <div className="card">
      <CardHeader
        title="Solver leaderboard"
        subtitle={
          hasReal
            ? "Real solver stats from sis::intent_registry"
            : "Demo leaderboard — deploy the module to see live stats"
        }
        right={hasReal ? <Badge tone="accent">live</Badge> : <Badge tone="neutral">demo</Badge>}
      />

      <div className="surface-subtle overflow-x-auto rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="hairline-b text-left text-2xs uppercase tracking-widest text-ink-500">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Solver</th>
              <th className="px-3 py-2 text-right font-medium">Claimed</th>
              <th className="px-3 py-2 text-right font-medium">Settled</th>
              <th className="px-3 py-2 text-right font-medium">Refunded</th>
              <th className="px-3 py-2 text-right font-medium">INIT earned</th>
            </tr>
          </thead>
          <tbody>
            {hasReal
              ? isLoading && real.length === 0
                ? <SkeletonRow />
                : real.length === 0
                  ? <EmptyRow />
                  : [...real]
                      .sort((a, b) =>
                        Number(BigInt(b.total_earned_uinit) - BigInt(a.total_earned_uinit))
                      )
                      .map((s, i) => <RealRow key={s.solver} rank={i + 1} s={s} />)
              : SOLVERS.map((s, i) => (
                  <tr key={s.id} className="border-t border-line text-ink-200">
                    <td className="px-3 py-2.5 mono-num text-2xs text-ink-500">{i + 1}</td>
                    <td className="px-3 py-2.5 font-mono text-[13px] text-ink-50">{s.handle}</td>
                    <td className="px-3 py-2.5 mono-num text-right">
                      {s.intentsSolved.toLocaleString()}
                    </td>
                    <td className="px-3 py-2.5 mono-num text-right text-accent">
                      {s.successRate}%
                    </td>
                    <td className="px-3 py-2.5 mono-num text-right text-ink-500">—</td>
                    <td className="px-3 py-2.5 mono-num text-right text-ink-50">
                      {s.earningsINIT.toLocaleString()}
                      <span className="ml-1 text-2xs text-ink-500">INIT</span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="divider mt-4" />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <VipRow label="Pending intents" value={
          hasReal ? "—" : "18"
        } hint="awaiting solver claim" />
        <VipRow label="Settled intents" value={
          hasReal && real.length
            ? real.reduce((acc, s) => acc + BigInt(s.intents_settled), 0n).toString()
            : "41,882"
        } hint="lifetime" />
        <VipRow label="Total paid to solvers" value={
          hasReal && real.length
            ? formatInit(
                real.reduce((acc, s) => acc + BigInt(s.total_earned_uinit), 0n)
              )
            : "63,894 INIT"
        } hint="reward_uinit" />
      </div>
    </div>
  );
}

function RealRow({ rank, s }: { rank: number; s: SolverStatView }) {
  return (
    <tr className="border-t border-line text-ink-200 transition hover:bg-ink-800/60">
      <td className="px-3 py-2.5 mono-num text-2xs text-ink-500">{rank}</td>
      <td className="px-3 py-2.5 font-mono text-[13px] text-ink-50">
        {short(s.solver)}
      </td>
      <td className="px-3 py-2.5 mono-num text-right">{s.intents_claimed}</td>
      <td className="px-3 py-2.5 mono-num text-right text-accent">{s.intents_settled}</td>
      <td className="px-3 py-2.5 mono-num text-right text-rose-300/80">
        {s.intents_refunded}
      </td>
      <td className="px-3 py-2.5 mono-num text-right text-ink-50">
        {formatInit(BigInt(s.total_earned_uinit))}
      </td>
    </tr>
  );
}

function SkeletonRow() {
  return (
    <tr>
      <td colSpan={6} className="px-3 py-6 text-center text-xs text-ink-500">
        Loading…
      </td>
    </tr>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={6} className="px-3 py-6 text-center text-xs text-ink-500">
        No solver activity yet. Run the solver bot from <code>bots/solver</code>.
      </td>
    </tr>
  );
}

function VipRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-subtle rounded-md px-3 py-2.5">
      <div className="label">{label}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="mono-num text-base text-ink-50">{value}</div>
        <span className="text-2xs text-ink-500">{hint}</span>
      </div>
    </div>
  );
}

function short(addr: string) {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatInit(uinit: bigint) {
  const init = Number(uinit) / 1_000_000;
  if (init >= 1) return `${init.toFixed(2)} INIT`;
  return `${uinit.toString()} uinit`;
}
