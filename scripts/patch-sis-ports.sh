#!/usr/bin/env bash
# Watches ~/.minitia-sis/config/{app,config}.toml and the moment they're
# created, rewrites the listen-addresses to non-default ports so SIS can
# coexist with another Minitia using the standard ports.
#
# Run this in the background BEFORE `weave rollup launch -f`:
#
#   ./scripts/patch-sis-ports.sh &
#   weave rollup launch ... -f
#
# Port map:
#   1317 → 1318  (REST/API)
#   9090 → 9094  (gRPC)
#   9091 → 9095  (gRPC-Web)
#   26656 → 26658  (P2P)
#   26657 → 26659  (RPC)
#   26658 → 26688  (proxy_app/abci)   — note: 26658 is config.toml's proxy_app default; map to 26688 to keep clear of P2P at 26658
#   26660 → 26662  (prometheus)
#   6060  → 6063   (pprof)

set -u

DIR="$HOME/.minitia-sis/config"
APP="$DIR/app.toml"
CFG="$DIR/config.toml"

patch_app() {
  sed -i -E '
    s|"tcp://0\.0\.0\.0:1317"|"tcp://0.0.0.0:1318"|g;
    s|"0\.0\.0\.0:9090"|"0.0.0.0:9094"|g;
    s|"0\.0\.0\.0:9091"|"0.0.0.0:9095"|g;
    s|"127\.0\.0\.1:6060"|"127.0.0.1:6063"|g;
  ' "$1"
}

patch_cfg() {
  # config.toml uses tcp:// prefixes for laddr. proxy_app on 26658, abci listener separate; map carefully.
  sed -i -E '
    s|"tcp://127\.0\.0\.1:26658"|"tcp://127.0.0.1:26688"|g;
    s|"tcp://0\.0\.0\.0:26656"|"tcp://0.0.0.0:26668"|g;
    s|"tcp://0\.0\.0\.0:26657"|"tcp://0.0.0.0:26669"|g;
    s|"tcp://127\.0\.0\.1:26657"|"tcp://127.0.0.1:26669"|g;
    s|":26660"|":26662"|g;
    s|"http://0\.0\.0\.0:26657"|"http://0.0.0.0:26669"|g;
    s|"http://localhost:26657"|"http://localhost:26669"|g;
  ' "$1"
}

echo "[patcher] watching $DIR …"

# Wait for app.toml then patch (with a 60s timeout)
for _ in $(seq 1 600); do
  if [ -f "$APP" ]; then
    patch_app "$APP"
    echo "[patcher] ✓ patched app.toml ports (REST 1318 / gRPC 9094 / gRPC-web 9095)"
    break
  fi
  sleep 0.1
done

for _ in $(seq 1 600); do
  if [ -f "$CFG" ]; then
    patch_cfg "$CFG"
    echo "[patcher] ✓ patched config.toml ports (RPC 26669 / P2P 26668 / proxy 26688 / metrics 26662)"
    break
  fi
  sleep 0.1
done

# Also patch client.toml so subsequent minitiad CLI calls use the new RPC
CLIENT="$DIR/client.toml"
if [ -f "$CLIENT" ]; then
  sed -i -E 's|"tcp://localhost:26657"|"tcp://localhost:26669"|g' "$CLIENT"
fi

echo "[patcher] done — SIS will bind to non-default ports for the rest of the launch"
