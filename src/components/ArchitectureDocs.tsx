const PILLARS = [
  {
    n: "01",
    title: "The Brain",
    sub: "SIS Minitia · MoveVM",
    body:
      "Reasoning engine. Hosts the Intent Registry, session-key authorization, and pathfinding over the Omnitia.",
  },
  {
    n: "02",
    title: "The Clearinghouse",
    sub: "Initia L1 Hub",
    body:
      "Enshrined Liquidity and InitiaDEX coordinate every inter-Minitia swap. All routes clear through L1 for depth and safety.",
  },
  {
    n: "03",
    title: "The Executors",
    sub: "Solver Network",
    body:
      "Permissionless OPinit bots compete on fee, latency, and route safety. VIP-weighted rewards capture MEV and rebate users.",
  },
];

const LIFECYCLE = [
  ["Declare + sign", "User describes the outcome; one session-key signature scopes what solvers may do."],
  ["Pathfinding", "MoveVM compiles the intent into an execution graph across Minitias, Minitswap, and IBC."],
  ["Solver auction", "Solvers bid fee × ETA × safety. Winner locks in ~420ms; losers pay nothing."],
  ["Minitswap egress", "Virtual pools bypass the 7-day OP-bridge challenge window for instant inter-Minitia transfer."],
  ["JIT gas", "Source asset auto-converts to native gas at the target Minitia — no manual top-ups."],
  ["Settlement", "IBC receipt proves completion; solver reward is released, MEV rebate returns to the user."],
];

const STACK: [string, string][] = [
  ["MiniMove (MoveVM)", "Resource-safe solver logic; prevents mid-flight asset loss."],
  ["Minitswap", "Virtual pools for instant ibcOpINIT egress between Minitias."],
  ["Enshrined Liquidity", "L1 DEX routing for best-price inter-Minitia settlement."],
  ["OPinit Bots", "Solver execution fabric with permissionless entry."],
  ["Session Keys", "One signature authorizes a bounded agent scope."],
  ["Skip:Go API", "Falls back to IBC / CCTP / LayerZero outside Initia when faster."],
  ["VIP Rewards", "Vested Interest Program redistributes MEV to users and top solvers."],
  ["IBC Proofs", "Settlement evidence streamed back to SIS Minitia for reward release."],
  ["JIT Gas", "Converts source asset to target gas atomically."],
];

export function ArchitectureDocs() {
  return (
    <article className="surface rounded-2xl">
      <Section label="Architecture">
        <h2 className="max-w-3xl text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ink-50">
          From chain navigation to outcome resolution
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-300">
          SIS is a sovereign meta-rollup that abstracts the complexity of Initia's multi-chain
          ecosystem. Users submit the outcome they want; a dedicated Minitia compiles the
          intent, runs a solver auction, and executes the result atomically across Minitswap,
          IBC, and the L1 Hub.
        </p>
      </Section>

      <Section label="Three layers">
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.n}>
              <div className="mono-num text-2xs text-ink-500">{p.n}</div>
              <h3 className="mt-1 text-sm font-medium text-ink-50">{p.title}</h3>
              <div className="mt-0.5 text-2xs text-ink-400">{p.sub}</div>
              <p className="mt-2 text-xs leading-relaxed text-ink-300">{p.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Intent lifecycle">
        <ol className="divide-y divide-line">
          {LIFECYCLE.map(([title, body], i) => (
            <li
              key={title}
              className="grid grid-cols-[32px_minmax(140px,180px)_1fr] gap-4 py-3 first:pt-0 last:pb-0"
            >
              <span className="mono-num text-2xs text-ink-500">
                {(i + 1).toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-ink-50">{title}</span>
              <span className="text-sm text-ink-300">{body}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section label="Interwoven Stack" last>
        <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {STACK.map(([term, def]) => (
            <div
              key={term}
              className="grid grid-cols-[minmax(140px,180px)_1fr] gap-4 border-b border-line py-2.5 last:border-b-0"
            >
              <dt className="text-sm text-ink-50">{term}</dt>
              <dd className="text-xs leading-relaxed text-ink-300">{def}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </article>
  );
}

function Section({
  label,
  children,
  last,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      className={`grid gap-5 px-6 py-7 sm:px-8 sm:py-8 lg:grid-cols-[180px_1fr] ${
        last ? "" : "hairline-b"
      }`}
    >
      <div className="label">{label}</div>
      <div>{children}</div>
    </section>
  );
}
