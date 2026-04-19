import { motion } from "framer-motion";
import { MINITIAS } from "../lib/mock";
import { CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

export function NetworkMap({
  sourceId = "milkyway",
  targetId = "nftflow",
}: {
  sourceId?: string;
  targetId?: string;
}) {
  const hub = MINITIAS.find((m) => m.id === "initia")!;
  const sis = MINITIAS.find((m) => m.id === "sis")!;
  const source = MINITIAS.find((m) => m.id === sourceId) ?? MINITIAS[2];
  const target = MINITIAS.find((m) => m.id === targetId) ?? MINITIAS[4];

  return (
    <div className="card">
      <CardHeader
        title="Omnitia network"
        subtitle="Live route: Minitswap → L1 Hub → target Minitia"
        right={<Badge tone="neutral">7 rollups · 1 hub</Badge>}
      />

      <div className="surface-subtle relative aspect-[4/3] w-full overflow-hidden rounded-lg">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* faint hub connections */}
          {MINITIAS.filter((m) => m.id !== "initia").map((m) => (
            <line
              key={m.id}
              x1={hub.coord.x}
              y1={hub.coord.y}
              x2={m.coord.x}
              y2={m.coord.y}
              stroke="#1a1d22"
              strokeWidth="0.25"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* SIS supervision */}
          <line
            x1={sis.coord.x}
            y1={sis.coord.y}
            x2={hub.coord.x}
            y2={hub.coord.y}
            stroke="#99ffb2"
            strokeOpacity="0.25"
            strokeWidth="0.3"
            strokeDasharray="0.6 0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* active flow source → hub → target */}
          <motion.path
            d={`M ${source.coord.x} ${source.coord.y} Q ${hub.coord.x} ${hub.coord.y - 6} ${hub.coord.x} ${hub.coord.y}`}
            fill="none"
            stroke="#99ffb2"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          <motion.path
            d={`M ${hub.coord.x} ${hub.coord.y} Q ${hub.coord.x} ${hub.coord.y + 6} ${target.coord.x} ${target.coord.y}`}
            fill="none"
            stroke="#99ffb2"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.6 }}
          />
        </svg>

        {MINITIAS.map((m) => {
          const isHub = m.id === "initia";
          const isSIS = m.id === "sis";
          const isSource = m.id === source.id;
          const isTarget = m.id === target.id;
          const highlight = isSource || isTarget || isHub || isSIS;
          return (
            <div
              key={m.id}
              className="absolute"
              style={{
                left: `${m.coord.x}%`,
                top: `${m.coord.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`grid place-items-center rounded-md font-mono text-2xs transition-colors ${
                    isHub
                      ? "h-10 w-10 border border-accent/40 bg-accent/[0.08] text-accent"
                      : isSIS
                      ? "h-9 w-9 border border-accent/30 bg-bg-raised text-accent"
                      : highlight
                      ? "h-8 w-8 border border-ink-400 bg-bg-raised text-ink-100"
                      : "h-7 w-7 border border-line bg-bg-raised text-ink-400"
                  }`}
                  title={m.name}
                >
                  {m.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 3)}
                </div>
                <div className="text-center text-2xs leading-tight text-ink-300">
                  {m.name}
                  <div className="text-[9px] text-ink-500">
                    {m.vm} · {m.tvl}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <Badge tone="accent">Active route</Badge>
          <Badge tone="neutral">L1 routing</Badge>
          <Badge tone="neutral">SIS supervision</Badge>
        </div>
      </div>
    </div>
  );
}
