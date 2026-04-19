/**
 * SIS reference solver bot.
 *
 * Lifecycle:
 *   1. Poll `sis::intent_registry::list_pending` every POLL_INTERVAL_MS.
 *   2. For each pending intent that hasn't been attempted: call `claim_intent`.
 *   3. Wait EXECUTE_LATENCY_MS to simulate off-chain execution
 *      (routing through Minitswap + target-Minitia tx).
 *   4. Call `settle_intent` with the sha256 of the simulated off-chain proof.
 *
 * Production note: a real solver performs step 3 against live Minitswap +
 * target-chain RPCs, records the real tx hash as the proof, and may lose
 * stake if it fails to settle before the intent deadline.
 */

import "dotenv/config";
import { createHash } from "node:crypto";
import {
  bcs,
  LCDClient,
  MnemonicKey,
  MsgExecute,
  Wallet,
} from "@initia/initia.js";

const env = (k: string, def?: string) => {
  const v = process.env[k];
  if (!v && def === undefined) throw new Error(`missing env ${k}`);
  return v ?? def!;
};

const CHAIN_ID = env("SIS_CHAIN_ID", "sis-testnet-1");
const REST_URL = env("SIS_REST_URL", "http://localhost:1317");
const MODULE_ADDRESS = env("SIS_MODULE_ADDRESS");
const MODULE_NAME = env("SIS_MODULE_NAME", "intent_registry");
const MNEMONIC = env("SOLVER_MNEMONIC");
const POLL_MS = Number(env("POLL_INTERVAL_MS", "3000"));
const LATENCY_MS = Number(env("EXECUTE_LATENCY_MS", "800"));

if (/^0x0+$/.test(MODULE_ADDRESS)) {
  console.error("SIS_MODULE_ADDRESS is the zero default — deploy the module first.");
  process.exit(1);
}

const lcd = new LCDClient(REST_URL, {
  chainId: CHAIN_ID,
  gasPrices: "0.015uinit",
  gasAdjustment: "1.4",
});
const key = new MnemonicKey({ mnemonic: MNEMONIC });
const wallet = new Wallet(lcd, key);

const attempted = new Set<string>();

type RawIntent = {
  id: string;
  owner: string;
  source_minitia: string;
  target_minitia: string;
  deadline: string;
  status: number;
  reward_uinit: string;
};

async function listPending(limit = 20): Promise<RawIntent[]> {
  const res = await fetch(`${REST_URL}/initia/move/v1/view`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      address: MODULE_ADDRESS,
      module_name: MODULE_NAME,
      function_name: "list_pending",
      type_args: [],
      args: [u64Arg(limit)],
    }),
  });
  if (!res.ok) throw new Error(`list_pending: ${res.status} ${await res.text()}`);
  const json = await res.json();
  const parsed: RawIntent[] =
    typeof json.data === "string" ? JSON.parse(json.data) : json.data;
  return parsed;
}

function u64Arg(n: number | bigint): string {
  return "0x" + Buffer.from(bcs.u64().serialize(BigInt(n)).toBytes()).toString("hex");
}

async function broadcast(msg: MsgExecute, label: string): Promise<string> {
  const tx = await wallet.createAndSignTx({ msgs: [msg] });
  const result = await lcd.tx.broadcastSync(tx);
  if ((result as { code?: number }).code && (result as { code?: number }).code !== 0) {
    throw new Error(`${label} failed: ${JSON.stringify(result)}`);
  }
  return result.txhash;
}

async function claimIntent(id: bigint): Promise<string> {
  const msg = new MsgExecute(
    wallet.key.accAddress,
    MODULE_ADDRESS,
    MODULE_NAME,
    "claim_intent",
    [],
    [bcs.u64().serialize(id).toBase64()]
  );
  return broadcast(msg, `claim_intent(${id})`);
}

async function settleIntent(id: bigint, proof: Uint8Array): Promise<string> {
  const msg = new MsgExecute(
    wallet.key.accAddress,
    MODULE_ADDRESS,
    MODULE_NAME,
    "settle_intent",
    [],
    [
      bcs.u64().serialize(id).toBase64(),
      bcs.vector(bcs.u8()).serialize(Array.from(proof)).toBase64(),
    ]
  );
  return broadcast(msg, `settle_intent(${id})`);
}

function simulateProof(intent: RawIntent): Uint8Array {
  const payload = `${intent.id}|${intent.source_minitia}→${intent.target_minitia}|${Date.now()}`;
  return createHash("sha256").update(payload).digest();
}

async function processIntent(intent: RawIntent) {
  const id = BigInt(intent.id);
  const key = intent.id;
  if (attempted.has(key)) return;
  attempted.add(key);

  const deadline = Number(intent.deadline);
  const now = Math.floor(Date.now() / 1000);
  if (now > deadline - 5) {
    console.log(`skip  #${id} — too close to deadline (${deadline - now}s left)`);
    return;
  }

  try {
    const claimHash = await claimIntent(id);
    console.log(`claim #${id} → ${claimHash}`);
  } catch (err) {
    console.error(`claim #${id} error:`, (err as Error).message);
    return;
  }

  await sleep(LATENCY_MS);

  try {
    const proof = simulateProof(intent);
    const settleHash = await settleIntent(id, proof);
    console.log(
      `settle #${id} → ${settleHash} · reward ${Number(intent.reward_uinit) / 1_000_000} INIT`
    );
  } catch (err) {
    console.error(`settle #${id} error:`, (err as Error).message);
  }
}

async function tick() {
  try {
    const pending = await listPending(20);
    if (pending.length === 0) return;
    // One at a time to keep sequence numbers happy
    for (const intent of pending) {
      await processIntent(intent);
    }
  } catch (err) {
    console.error("tick error:", (err as Error).message);
  }
}

async function main() {
  console.log("SIS solver bot starting");
  console.log(`  chain    : ${CHAIN_ID}`);
  console.log(`  rest     : ${REST_URL}`);
  console.log(`  module   : ${MODULE_ADDRESS}::${MODULE_NAME}`);
  console.log(`  solver   : ${wallet.key.accAddress}`);
  console.log(`  poll ms  : ${POLL_MS}`);
  console.log();

  // Loop forever.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await tick();
    await sleep(POLL_MS);
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
