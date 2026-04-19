import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Coins, Gauge, Radio, Trophy } from "lucide-react";
import { Shell } from "./components/Shell";
import { IntentComposer } from "./components/IntentComposer";
import { SolverAuction } from "./components/SolverAuction";
import { ExecutionTimeline } from "./components/ExecutionTimeline";
import { NetworkMap } from "./components/NetworkMap";
import { SolverLeaderboard } from "./components/SolverLeaderboard";
import { LiveIntentsFeed } from "./components/LiveIntentsFeed";
import { ArchitectureDocs } from "./components/ArchitectureDocs";
import { StatTile } from "./components/ui/StatTile";
import { useRegistryStats } from "./lib/queries";
import { IS_MODULE_DEPLOYED } from "./lib/config";
import { STATS } from "./lib/mock";

type Tab = "home" | "network" | "solvers" | "docs";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [activeStep, setActiveStep] = useState(5);
  const { data: stats } = useRegistryStats();

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveStep((s) => (s >= 8 ? 3 : s + 1));
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const tiles = buildTiles(stats);

  return (
    <Shell tab={tab} onTab={setTab}>
      <AnimatePresence mode="wait">
        {tab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <IntentComposer onSubmit={() => setActiveStep(3)} />

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {tiles.map((t) => (
                <StatTile key={t.label} {...t} />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <div className="space-y-6 lg:col-span-3">
                <ExecutionTimeline activeStep={activeStep} />
                <LiveIntentsFeed />
              </div>
              <div className="space-y-6 lg:col-span-2">
                <SolverAuction />
                <NetworkMap />
              </div>
            </div>
          </motion.div>
        )}

        {tab === "network" && (
          <motion.div
            key="network"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            <div className="lg:col-span-2">
              <NetworkMap />
            </div>
            <LiveIntentsFeed />
          </motion.div>
        )}

        {tab === "solvers" && (
          <motion.div
            key="solvers"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            <SolverAuction />
            <SolverLeaderboard />
          </motion.div>
        )}

        {tab === "docs" && (
          <motion.div
            key="docs"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <ArchitectureDocs />
          </motion.div>
        )}
      </AnimatePresence>
    </Shell>
  );
}

type Tile = {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
};

function buildTiles(stats: ReturnType<typeof useRegistryStats>["data"]): Tile[] {
  const iconIntent = <Activity className="h-3.5 w-3.5" />;
  const iconCoin = <Coins className="h-3.5 w-3.5" />;
  const iconGauge = <Gauge className="h-3.5 w-3.5" />;
  const iconRadio = <Radio className="h-3.5 w-3.5" />;
  const iconTrophy = <Trophy className="h-3.5 w-3.5" />;

  if (IS_MODULE_DEPLOYED && stats) {
    const totalIntents = Number(stats.total_intents);
    const totalSettled = Number(stats.total_settled);
    const pending = Number(stats.pending_count);
    const paidInit = Number(BigInt(stats.total_reward_paid_uinit)) / 1_000_000;
    const refunded = Number(stats.total_refunded);
    return [
      { label: "Total intents", value: totalIntents.toLocaleString(), delta: "on-chain", icon: iconIntent },
      { label: "Settled", value: totalSettled.toLocaleString(), delta: `${refunded} refunded`, icon: iconGauge },
      { label: "Pending now", value: pending.toLocaleString(), delta: "awaiting solver", icon: iconRadio },
      {
        label: "Paid to solvers",
        value: paidInit >= 1 ? `${paidInit.toFixed(2)} INIT` : `${stats.total_reward_paid_uinit} uinit`,
        delta: "reward_uinit",
        icon: iconCoin,
      },
      {
        label: "Settle rate",
        value: totalIntents === 0 ? "—" : `${Math.round((totalSettled / totalIntents) * 100)}%`,
        delta: "lifetime",
        icon: iconTrophy,
      },
    ];
  }

  return [
    { label: "Intents · 24h", value: STATS.intents24h.toLocaleString(), delta: "demo data", icon: iconIntent },
    { label: "Volume · 24h", value: STATS.volume24h, delta: "demo data", icon: iconCoin },
    { label: "Avg finality", value: `${STATS.avgFinalitySec}s`, delta: "demo data", icon: iconGauge },
    { label: "Active solvers", value: String(STATS.activeSolvers), delta: "demo data", icon: iconRadio },
    { label: "MEV recaptured", value: STATS.mevRecaptured, delta: "demo data", icon: iconTrophy },
  ];
}
