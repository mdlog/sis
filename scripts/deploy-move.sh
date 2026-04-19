#!/usr/bin/env bash
# Deploy sis::intent_registry to the SIS Minitia.
# Prerequisites:
#   1. `weave init` has created a Minitia and gas-station keyring entry.
#   2. The wallet is funded via https://app.testnet.initia.xyz/faucet.
#   3. Chain ID is exported via env or passed as CHAIN_ID.
#
# After success this script patches .initia/submission.json with the
# deployed_address (publisher hex) and rollup_chain_id.

set -euo pipefail

CHAIN_ID="${CHAIN_ID:-}"
KEY_NAME="${KEY_NAME:-gas-station}"
KEYRING_BACKEND="${KEYRING_BACKEND:-test}"

if [ -z "${CHAIN_ID}" ]; then
  echo "error: CHAIN_ID env var required (e.g. sis-testnet-1)" >&2
  exit 1
fi

command -v minitiad >/dev/null 2>&1 || {
  echo "error: minitiad CLI not found. Install via weave." >&2
  exit 1
}
command -v jq >/dev/null 2>&1 || {
  echo "error: jq not found." >&2
  exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MOVE_DIR="${ROOT_DIR}/move"
SUBMISSION_FILE="${ROOT_DIR}/.initia/submission.json"

BECH32="$(minitiad keys show "${KEY_NAME}" --keyring-backend "${KEYRING_BACKEND}" -a)"
HEX="0x$(minitiad keys parse "${BECH32}" --output json | jq -r '.bytes' | tr '[:upper:]' '[:lower:]')"

echo "publisher bech32 : ${BECH32}"
echo "publisher hex    : ${HEX}"
echo "chain id         : ${CHAIN_ID}"
echo "move package     : ${MOVE_DIR}"
echo

cd "${MOVE_DIR}"

echo "→ minitiad move deploy"
minitiad move deploy \
  --build \
  --language-version=2.1 \
  --named-addresses "sis=${HEX}" \
  --from "${KEY_NAME}" \
  --keyring-backend "${KEYRING_BACKEND}" \
  --chain-id "${CHAIN_ID}" \
  --gas auto --gas-adjustment 1.4 --yes

echo
echo "→ patching .initia/submission.json"
TMP="$(mktemp)"
jq \
  --arg addr "${HEX}" \
  --arg chain "${CHAIN_ID}" \
  '.deployed_address = $addr | .rollup_chain_id = $chain' \
  "${SUBMISSION_FILE}" > "${TMP}"
mv "${TMP}" "${SUBMISSION_FILE}"

echo
echo "deployed_address : ${HEX}"
echo "rollup_chain_id  : ${CHAIN_ID}"
echo
echo "next:"
echo "  export VITE_SIS_MODULE_ADDRESS=${HEX}"
echo "  export VITE_SIS_CHAIN_ID=${CHAIN_ID}"
echo "  npm run dev"
