#!/usr/bin/env node
/**
 * Generate weave-rollup-config.json from the committed template.
 *
 * - Reads the gas station L1 address from ~/.weave/config.json (the one
 *   `weave init` already produced — we never touch its mnemonic).
 * - Generates 5 fresh BIP39 mnemonics (one per OPinit/validator role) using
 *   cosmjs Secp256k1HdWallet at HD path m/44'/118'/0'/0/0 with bech32
 *   prefix "init". Why coin_type 118 and *not* 60: weave's
 *   cosmosutils.RecoverKeyFromMnemonic defaults to coin_type 118 +
 *   key-type secp256k1 for every system key except the gas station.
 *   Using coin_type 60 / eth_secp256k1 here would derive different
 *   addresses than minitiad's keyring import, causing
 *   "address mismatch for key Validator" at rollup launch time.
 * - Writes weave-rollup-config.json — gitignored, contains secrets.
 *
 * After running this you can launch the SIS Minitia non-interactively:
 *
 *   weave rollup launch \
 *     --vm move \
 *     --minitia-dir ~/.minitia-sis \
 *     --opinit-dir  ~/.opinit-sis  \
 *     --with-config ./weave-rollup-config.json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Secp256k1HdWallet } from "@cosmjs/amino";
import { stringToPath } from "@cosmjs/crypto";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const TEMPLATE = path.join(REPO_ROOT, "weave-rollup-config.template.json");
const OUTPUT = path.join(REPO_ROOT, "weave-rollup-config.json");
const WEAVE_CONFIG = path.join(os.homedir(), ".weave", "config.json");

if (!fs.existsSync(WEAVE_CONFIG)) {
  console.error(
    "✗ ~/.weave/config.json not found.\n" +
      "  Run `weave init` once to bootstrap the gas station first."
  );
  process.exit(1);
}
if (fs.existsSync(OUTPUT)) {
  console.error(
    `✗ ${path.relative(REPO_ROOT, OUTPUT)} already exists.\n` +
      "  Move or delete it first if you want to regenerate."
  );
  process.exit(1);
}

const weave = JSON.parse(fs.readFileSync(WEAVE_CONFIG, "utf8"));
const gasStationL1 = weave?.common?.gas_station?.initia_address;
if (!gasStationL1) {
  console.error("✗ gas_station.initia_address missing from ~/.weave/config.json");
  process.exit(1);
}

const template = JSON.parse(fs.readFileSync(TEMPLATE, "utf8"));
delete template._comment;

async function newKey() {
  const wallet = await Secp256k1HdWallet.generate(24, {
    prefix: "init",
    hdPaths: [stringToPath("m/44'/118'/0'/0/0")],
  });
  const [acct] = await wallet.getAccounts();
  return { addr: acct.address, mnemonic: wallet.mnemonic };
}

const validator = await newKey();
const bridgeExecutor = await newKey();
const outputSubmitter = await newKey();
const batchSubmitter = await newKey();
const challenger = await newKey();

template.system_keys = {
  validator: {
    l1_address: validator.addr,
    l2_address: validator.addr,
    mnemonic: validator.mnemonic,
  },
  bridge_executor: {
    l1_address: bridgeExecutor.addr,
    l2_address: bridgeExecutor.addr,
    mnemonic: bridgeExecutor.mnemonic,
  },
  output_submitter: {
    l1_address: outputSubmitter.addr,
    l2_address: outputSubmitter.addr,
    mnemonic: outputSubmitter.mnemonic,
  },
  batch_submitter: {
    da_address: batchSubmitter.addr,
    mnemonic: batchSubmitter.mnemonic,
  },
  challenger: {
    l1_address: challenger.addr,
    l2_address: challenger.addr,
    mnemonic: challenger.mnemonic,
  },
};

template.genesis_accounts = [
  { address: gasStationL1, coins: "1000000000000uinit" },
  { address: validator.addr, coins: "0uinit" },
  { address: bridgeExecutor.addr, coins: "0uinit" },
  { address: outputSubmitter.addr, coins: "0uinit" },
  { address: challenger.addr, coins: "0uinit" },
  { address: batchSubmitter.addr, coins: "0uinit" },
];

fs.writeFileSync(OUTPUT, JSON.stringify(template, null, 2) + "\n", { mode: 0o600 });

console.log("✓ wrote", path.relative(REPO_ROOT, OUTPUT), "(mode 0600, gitignored)");
console.log();
console.log("system keys (cosmjs Secp256k1HdWallet, m/44'/118'/0'/0/0, prefix init):");
console.log("  validator        :", validator.addr);
console.log("  bridge_executor  :", bridgeExecutor.addr);
console.log("  output_submitter :", outputSubmitter.addr);
console.log("  batch_submitter  :", batchSubmitter.addr);
console.log("  challenger       :", challenger.addr);
console.log();
console.log("gas station (from ~/.weave/config.json):", gasStationL1);
console.log();
console.log("next:");
console.log("  weave rollup launch \\");
console.log("    --vm move \\");
console.log("    --minitia-dir ~/.minitia-sis \\");
console.log("    --opinit-dir  ~/.opinit-sis  \\");
console.log("    --with-config ./weave-rollup-config.json");
