#!/usr/bin/env node
/**
 * Fund the 4 OPinit system keys on Initia L1 testnet from the gas
 * station. Required before `weave rollup launch --with-config` because
 * that flow SKIPS weave's normal funding step (verified in
 * weave/models/minitia/launch.go line 2208 — when launchFromExistingConfig
 * is true, the flow goes straight to LaunchingNewMinitiaLoading and never
 * runs broadcastFundingFromGasStation).
 *
 * Symptom without this funding: `minitiad launch` fails at "ibc step 5"
 * trying to broadcast MsgCreateClient on initiation-2 with the
 * bridge_executor as signer — the chain returns "account not found"
 * because that address has never received any tokens.
 *
 * Reads:
 *   - ~/.weave/config.json     → gas station mnemonic + address (coin_type 60)
 *   - weave-rollup-config.json → 4 L1 system-key addresses
 *
 * Sends 1 INIT to each system key in a single multi-message tx to
 * minimize fees.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Coin,
  Coins,
  Fee,
  RESTClient,
  MnemonicKey,
  MsgSend,
  Wallet,
} from "@initia/initia.js";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const CONFIG = path.join(REPO_ROOT, "weave-rollup-config.json");
const WEAVE_CONFIG = path.join(os.homedir(), ".weave", "config.json");

const FUND_AMOUNT_UINIT = 1_000_000n; // 1 INIT per system key
const L1_REST = "https://rest.testnet.initia.xyz";
const L1_CHAIN_ID = "initiation-2";

if (!fs.existsSync(CONFIG)) {
  console.error("✗ weave-rollup-config.json not found. Run scripts/generate-sis-config.mjs first.");
  process.exit(1);
}
if (!fs.existsSync(WEAVE_CONFIG)) {
  console.error("✗ ~/.weave/config.json not found.");
  process.exit(1);
}

const weave = JSON.parse(fs.readFileSync(WEAVE_CONFIG, "utf8"));
const sis = JSON.parse(fs.readFileSync(CONFIG, "utf8"));

const gasMnemonic = weave?.common?.gas_station?.mnemonic;
const gasAddress = weave?.common?.gas_station?.initia_address;
if (!gasMnemonic || !gasAddress) {
  console.error("✗ gas_station.mnemonic / initia_address missing in ~/.weave/config.json");
  process.exit(1);
}

const recipients = [
  ["bridge_executor", sis.system_keys.bridge_executor.l1_address],
  ["output_submitter", sis.system_keys.output_submitter.l1_address],
  ["batch_submitter", sis.system_keys.batch_submitter.da_address],
  ["challenger", sis.system_keys.challenger.l1_address],
];

const lcd = new RESTClient(L1_REST, {
  chainId: L1_CHAIN_ID,
  gasPrices: "0.015uinit",
  gasAdjustment: "1.4",
});

// Gas station uses coin_type 60 per ~/.weave/config.json
const key = new MnemonicKey({ mnemonic: gasMnemonic, coinType: 60 });
if (key.accAddress !== gasAddress) {
  console.error(
    `✗ derived address ${key.accAddress} does not match gas-station address ${gasAddress}`
  );
  process.exit(1);
}
const wallet = new Wallet(lcd, key);

console.log("Gas station :", gasAddress);
console.log("Funding     :");
for (const [role, addr] of recipients) {
  console.log(`  - ${role.padEnd(18)} ${addr}  ← ${Number(FUND_AMOUNT_UINIT) / 1e6} INIT`);
}
console.log();

// Pre-flight balance check
const balResp = await fetch(
  `${L1_REST}/cosmos/bank/v1beta1/balances/${gasAddress}`
).then((r) => r.json());
const uinit = BigInt(
  balResp.balances?.find((b) => b.denom === "uinit")?.amount ?? "0"
);
const required = FUND_AMOUNT_UINIT * BigInt(recipients.length) + 200_000n; // +0.2 INIT for fees
if (uinit < required) {
  console.error(
    `✗ gas station has ${Number(uinit) / 1e6} INIT — need at least ${
      Number(required) / 1e6
    } INIT. Top up at https://app.testnet.initia.xyz/faucet`
  );
  process.exit(1);
}
console.log(`balance     : ${Number(uinit) / 1e6} INIT (sufficient)`);
console.log();

const msgs = recipients.map(([_, addr]) =>
  new MsgSend(
    gasAddress,
    addr,
    new Coins([new Coin("uinit", FUND_AMOUNT_UINIT.toString())])
  )
);

console.log("→ signing + broadcasting batched MsgSend …");
// Initia L1 is a MoveVM chain — every bank/MsgSend invokes Move hooks
// (object module function 16) which need ~15K-30K gas EACH. Plus the
// outer Cosmos tx overhead. Budget generously.
const gasPerSend = 200_000;
const fee = new Fee(
  gasPerSend * recipients.length + 100_000,
  `${Math.ceil((gasPerSend * recipients.length + 100_000) * 0.015)}uinit`
);
const signedTx = await wallet.createAndSignTx({ msgs, fee });
const result = await lcd.tx.broadcastSync(signedTx);

if (result.code && result.code !== 0) {
  console.error("✗ broadcast failed:", JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log(`tx hash     : ${result.txhash}`);
console.log();
console.log("waiting 10s for inclusion…");
await new Promise((r) => setTimeout(r, 10_000));

// verify
console.log("verifying balances:");
for (const [role, addr] of recipients) {
  const r = await fetch(`${L1_REST}/cosmos/bank/v1beta1/balances/${addr}`).then((r) =>
    r.json()
  );
  const a = BigInt(r.balances?.find((b) => b.denom === "uinit")?.amount ?? "0");
  console.log(`  ${role.padEnd(18)} ${Number(a) / 1e6} INIT`);
}
console.log();
console.log("done — you can now run:");
console.log("  weave rollup launch --vm move \\");
console.log("    --minitia-dir ~/.minitia-sis \\");
console.log("    --opinit-dir  ~/.opinit-sis  \\");
console.log("    --with-config ./weave-rollup-config.json -f");
