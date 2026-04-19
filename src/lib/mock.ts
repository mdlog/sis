export type Minitia = {
  id: string;
  name: string;
  category: "DeFi" | "Gaming" | "NFT" | "Social" | "Infra" | "SIS";
  tvl: string;
  vm: "MoveVM" | "EVM" | "WasmVM";
  color: string;
  coord: { x: number; y: number };
};

export const MINITIAS: Minitia[] = [
  { id: "initia", name: "Initia L1 Hub", category: "Infra", tvl: "$482M", vm: "MoveVM", color: "#6366f1", coord: { x: 50, y: 50 } },
  { id: "sis", name: "SIS Minitia", category: "SIS", tvl: "$18M", vm: "MoveVM", color: "#22d3ee", coord: { x: 50, y: 15 } },
  { id: "milkyway", name: "MilkyWay DeFi", category: "DeFi", tvl: "$124M", vm: "MoveVM", color: "#34d399", coord: { x: 15, y: 30 } },
  { id: "civitia", name: "Civitia Game", category: "Gaming", tvl: "$38M", vm: "WasmVM", color: "#f59e0b", coord: { x: 85, y: 30 } },
  { id: "nftflow", name: "NFTFlow", category: "NFT", tvl: "$26M", vm: "MoveVM", color: "#ec4899", coord: { x: 15, y: 75 } },
  { id: "trade", name: "TradeFi L2", category: "DeFi", tvl: "$201M", vm: "EVM", color: "#a855f7", coord: { x: 85, y: 75 } },
  { id: "social", name: "Yaps.Social", category: "Social", tvl: "$4M", vm: "MoveVM", color: "#60a5fa", coord: { x: 50, y: 88 } },
];

export type Solver = {
  id: string;
  handle: string;
  reputation: number;
  successRate: number;
  avgLatencyMs: number;
  intentsSolved: number;
  earningsINIT: number;
  vipTier: "Bronze" | "Silver" | "Gold" | "Platinum";
};

export const SOLVERS: Solver[] = [
  { id: "s1", handle: "omnirouter.move", reputation: 98.4, successRate: 99.7, avgLatencyMs: 410, intentsSolved: 28_412, earningsINIT: 14_882, vipTier: "Platinum" },
  { id: "s2", handle: "jitboy.eth", reputation: 96.1, successRate: 99.2, avgLatencyMs: 520, intentsSolved: 19_033, earningsINIT: 9_104, vipTier: "Gold" },
  { id: "s3", handle: "minitswap-wolf", reputation: 94.8, successRate: 98.9, avgLatencyMs: 610, intentsSolved: 14_290, earningsINIT: 6_731, vipTier: "Gold" },
  { id: "s4", handle: "dusk.opbot", reputation: 92.0, successRate: 97.4, avgLatencyMs: 720, intentsSolved: 9_812, earningsINIT: 4_120, vipTier: "Silver" },
  { id: "s5", handle: "ibc-nomad", reputation: 89.6, successRate: 96.1, avgLatencyMs: 880, intentsSolved: 7_140, earningsINIT: 2_640, vipTier: "Silver" },
  { id: "s6", handle: "cheap.bid", reputation: 82.3, successRate: 93.2, avgLatencyMs: 1_210, intentsSolved: 3_284, earningsINIT: 1_008, vipTier: "Bronze" },
];

export type IntentTemplate = {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  from: string;
  to: string;
};

export const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    id: "nft-crosschain",
    label: "Buy NFT cross-Minitia",
    prompt: "Buy the cheapest Genesis Sword on NFTFlow using my USDC on MilkyWay DeFi",
    icon: "Gem",
    from: "milkyway",
    to: "nftflow",
  },
  {
    id: "yield-rotate",
    label: "Rotate yield to best APY",
    prompt: "Move my staked INIT from MilkyWay to wherever APY is highest, max slippage 0.5%",
    icon: "TrendingUp",
    from: "milkyway",
    to: "trade",
  },
  {
    id: "game-topup",
    label: "Top up game wallet",
    prompt: "Fill my Civitia game wallet with 50 INIT for gas and 200 GOLD tokens from TradeFi",
    icon: "Gamepad2",
    from: "trade",
    to: "civitia",
  },
  {
    id: "social-tip",
    label: "Tip across Minitias",
    prompt: "Send 10 USDC to @yapmaster on Yaps.Social using my TradeFi balance",
    icon: "Coins",
    from: "trade",
    to: "social",
  },
];

export type RouteHop = {
  step: number;
  label: string;
  detail: string;
  venue: "SIS" | "Initia L1" | "Minitswap" | "IBC" | "OP Bridge" | "Target";
  estimatedMs: number;
  costINIT: number;
};

export const SAMPLE_ROUTE: RouteHop[] = [
  { step: 1, label: "Parse intent", detail: "MoveVM reasoning engine compiles intent → execution graph", venue: "SIS", estimatedMs: 180, costINIT: 0.0 },
  { step: 2, label: "Session key auth", detail: "Single signature authorizes scoped multi-chain execution", venue: "SIS", estimatedMs: 40, costINIT: 0.0 },
  { step: 3, label: "Source pull: MilkyWay DeFi", detail: "Withdraw 250 USDC via OPinit hook", venue: "Minitswap", estimatedMs: 820, costINIT: 0.02 },
  { step: 4, label: "L1 route via InitiaDEX", detail: "USDC → ibcOpINIT through enshrined liquidity pool", venue: "Initia L1", estimatedMs: 640, costINIT: 0.03 },
  { step: 5, label: "Minitswap instant egress", detail: "Virtual pool skips 7-day challenge window", venue: "Minitswap", estimatedMs: 310, costINIT: 0.01 },
  { step: 6, label: "JIT gas on NFTFlow", detail: "Converts 0.4 USDC → native gas at execution", venue: "Target", estimatedMs: 220, costINIT: 0.005 },
  { step: 7, label: "Atomic NFT purchase", detail: "Solver submits buy + delivers Genesis Sword #842", venue: "Target", estimatedMs: 480, costINIT: 0.008 },
  { step: 8, label: "Settlement + proof", detail: "IBC receipt posted to SIS Minitia, solver reward released", venue: "SIS", estimatedMs: 260, costINIT: 0.0 },
];

export type LiveIntent = {
  id: string;
  user: string;
  summary: string;
  valueUSD: number;
  status: "Bidding" | "Executing" | "Settled" | "Refunded";
  progress: number;
  solver?: string;
  ageSec: number;
};

export const LIVE_INTENTS: LiveIntent[] = [
  { id: "0x9f..a1", user: "0x7A..42e", summary: "Buy NFT cross-Minitia (MilkyWay → NFTFlow)", valueUSD: 248.12, status: "Executing", progress: 72, solver: "omnirouter.move", ageSec: 8 },
  { id: "0x31..4c", user: "0x1b..c99", summary: "Yield rotate → best APY", valueUSD: 12_480.5, status: "Bidding", progress: 14, ageSec: 2 },
  { id: "0xa2..77", user: "0x9d..aa1", summary: "Top up Civitia game wallet", valueUSD: 62.4, status: "Settled", progress: 100, solver: "jitboy.eth", ageSec: 43 },
  { id: "0xc4..09", user: "0x22..bb0", summary: "Tip 10 USDC on Yaps.Social", valueUSD: 10, status: "Settled", progress: 100, solver: "minitswap-wolf", ageSec: 61 },
  { id: "0xde..12", user: "0xff..1a3", summary: "Swap ibcOpINIT → USDC (MilkyWay)", valueUSD: 3_204.0, status: "Executing", progress: 41, solver: "omnirouter.move", ageSec: 4 },
];

export const STATS = {
  intents24h: 41_882,
  volume24h: "$12.4M",
  avgFinalitySec: 3.8,
  activeSolvers: 147,
  mevRecaptured: "$182K",
};
