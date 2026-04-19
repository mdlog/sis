import { useQuery } from "@tanstack/react-query";
import { callView, encodeU64 } from "./chain";
import { IS_MODULE_DEPLOYED } from "./config";

// ---- View response shapes ---------------------------------------------------

export type IntentStatus = 0 | 1 | 2 | 3;

export const STATUS_LABEL: Record<IntentStatus, string> = {
  0: "Pending",
  1: "Claimed",
  2: "Settled",
  3: "Refunded",
};

export type IntentView = {
  id: string;
  owner: string;
  source_minitia: string;
  target_minitia: string;
  desired_asset: string;
  min_receive: string;
  slippage_bps: string;
  reward_uinit: string;
  deadline: string;
  status: IntentStatus;
  solver: { vec: [string] | [] };
  proof_hash: number[] | string;
  created_at: string;
  claimed_at: string;
  settled_at: string;
};

export type SolverStatView = {
  solver: string;
  intents_claimed: string;
  intents_settled: string;
  intents_refunded: string;
  total_earned_uinit: string;
  last_active_at: string;
};

export type RegistryStats = {
  total_intents: string;
  total_settled: string;
  total_refunded: string;
  total_reward_paid_uinit: string;
  pending_count: string;
};

// ---- Hooks ------------------------------------------------------------------

/**
 * Pending (un-claimed) intents, newest first. Polled every 4s.
 * Returns an empty array (and flags `enabled=false`) when the module
 * is not yet deployed so components can render a placeholder instead.
 */
export function usePendingIntents(limit = 20) {
  return useQuery({
    queryKey: ["sis", "pending", limit],
    enabled: IS_MODULE_DEPLOYED,
    refetchInterval: 4_000,
    queryFn: () => callView<IntentView[]>("list_pending", [encodeU64(limit)]),
  });
}

/**
 * Most-recent intents across all statuses, newest first.
 * Used by the Live Intents Feed.
 */
export function useRecentIntents(limit = 10) {
  return useQuery({
    queryKey: ["sis", "recent", limit],
    enabled: IS_MODULE_DEPLOYED,
    refetchInterval: 4_000,
    queryFn: () => callView<IntentView[]>("list_recent", [encodeU64(limit)]),
  });
}

/** Global registry counters. */
export function useRegistryStats() {
  return useQuery({
    queryKey: ["sis", "stats"],
    enabled: IS_MODULE_DEPLOYED,
    refetchInterval: 5_000,
    queryFn: () => callView<RegistryStats>("stats"),
  });
}

/** Top solvers by cumulative earnings / settlement count. */
export function useSolverLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ["sis", "leaderboard", limit],
    enabled: IS_MODULE_DEPLOYED,
    refetchInterval: 8_000,
    queryFn: () => callView<SolverStatView[]>("leaderboard", [encodeU64(limit)]),
  });
}

/** Single intent by numeric id — used to track the user's submitted intent. */
export function useIntent(id: number | null) {
  return useQuery({
    queryKey: ["sis", "intent", id],
    enabled: IS_MODULE_DEPLOYED && id !== null,
    refetchInterval: 3_000,
    queryFn: () => callView<IntentView>("get_intent", [encodeU64(id ?? 0)]),
  });
}
