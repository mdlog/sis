# Sovereign Intent Solver (SIS)

> One intent. Any outcome. Executed across every Minitia.
>
> Submission for **INITIATE: The Initia Hackathon** — [dorahacks.io/hackathon/initiate](https://dorahacks.io/hackathon/initiate)

SIS is a **sovereign meta-rollup** (Minitia) that turns the user experience from *"navigate between chains"* into *"resolve an outcome"* with a single intent. Users declare what they want on the SIS Minitia; a permissionless solver network competes to execute, and on-chain settlement records every lifecycle transition.

This submission follows the [official Initia hackathon guides](https://docs.initia.xyz/hackathon/get-started) — `weave init` for the rollup, `minitiad move deploy` for the module, InterwovenKit for the frontend.

---

## Hackathon alignment

| Requirement | How SIS satisfies it | Path |
|---|---|---|
| Deployed on a real Initia rollup | SIS runs as its own Minitia (MoveVM), chain ID set at `weave init` time | `.initia/submission.json.rollup_chain_id` |
| Uses `@initia/interwovenkit-react` | Wallet connect, bridge UX, tx signing, `.init` username — all through InterwovenKit | [src/providers.tsx](src/providers.tsx), [src/components/WalletButton.tsx](src/components/WalletButton.tsx) |
| Implements a native feature | **Auto-signing** (session keys via `autoSign.enable(...)`). Bridge and Usernames also wired | [src/components/IntentComposer.tsx](src/components/IntentComposer.tsx) |
| `.initia/submission.json` with required schema | All 10 fields present: `project_name`, `repo_url`, `commit_sha`, `rollup_chain_id`, `deployed_address`, `vm`, `native_feature`, `core_logic_path`, `native_feature_frontend_path`, `demo_video_url` | [.initia/submission.json](.initia/submission.json) |
| 1–3 minute demo video | Storyboard in [DEMO.md](DEMO.md) | — |

---

## End-to-end flow

```
┌──────────┐  create_intent    ┌──────────────────────┐  claim    ┌────────────┐
│   User   │ ───────────────▶  │  sis::intent_registry │ ◀──────── │  Solver    │
│ (browser)│   MsgExecute      │        (Move)         │            │  (bot)     │
└──────────┘   auto-sign       │                       │            └────────────┘
     ▲                         │  list_pending #[view] │                  │
     │                         │  get_intent    #[view]│                  │
     │        real-time        │  leaderboard   #[view]│     settle       │
     └─────── queries ────────▶│  stats         #[view]│ ◀─ proof_hash ───┘
                               └──────────────────────┘
```

---

## Repository layout

```
.
├── .initia/submission.json          # Hackathon submission manifest (required 10 fields)
├── move/
│   ├── Move.toml                    # Package descriptor
│   └── sources/intent_registry.move # The on-chain heart — create/claim/settle/refund + events + views
├── bots/solver/
│   ├── package.json
│   └── src/index.ts                 # Reference solver bot (poll → claim → settle)
├── scripts/deploy-move.sh           # Wrapper for `minitiad move deploy` + submission.json patch
├── src/
│   ├── providers.tsx                # Wagmi + QueryClient + InterwovenKit (enableAutoSign, customChain)
│   ├── lib/config.ts                # Single source of truth for chain/module env vars
│   ├── lib/chain.ts                 # RESTClient + `callView()` helper
│   ├── lib/queries.ts               # TanStack Query hooks: pending, recent, stats, leaderboard
│   └── components/IntentComposer.tsx# The native-feature frontend — MsgExecute + autoSign session
├── DEMO.md                          # 1–3 minute video storyboard
└── .env.example                     # All VITE_* env vars the frontend reads
```

---

## Running end to end (from a clean machine)

Follow the same 11-step official flow at [docs.initia.xyz/hackathon/get-started](https://docs.initia.xyz/hackathon/get-started).

### 1. Prerequisites

- Docker Desktop
- Go 1.22+
- Node 20+
- `weave` CLI ([install guide](https://docs.initia.xyz/developers/developer-guides/tools/clis/weave-cli/installation))
- `minitiad` CLI (installed by `weave`)
- `jq`

### 2. Launch the SIS Minitia (non-interactive)

This repo ships a generator so you don't have to walk through the interactive
`weave init` for the rollup. The Minitia runs in **isolated dirs** (`~/.minitia-sis`,
`~/.opinit-sis`) so it never collides with another Minitia you may already have.

```bash
# 2a. Bootstrap the gas station (one-time, interactive — only the first time you ever use weave)
weave init

# 2b. Generate fresh OPinit/validator system keys + the launch config
node scripts/generate-sis-config.mjs
# → produces weave-rollup-config.json (gitignored, mode 0600)

# 2c. Launch the rollup non-interactively
weave rollup launch \
  --vm move \
  --minitia-dir ~/.minitia-sis \
  --opinit-dir  ~/.opinit-sis  \
  --with-config ./weave-rollup-config.json

# 2d. Start the OPinit Executor + IBC Relayer (still in isolated dirs)
weave opinit init executor --opinit-dir ~/.opinit-sis
weave opinit start executor -d --opinit-dir ~/.opinit-sis
weave relayer init    && weave relayer start -d
```

The chain id is `sis-testnet-1` (set in `weave-rollup-config.template.json`).

### 3. Fund the gas station

Copy your `gas-station` address, then:

```
https://app.testnet.initia.xyz/faucet
```

### 4. Deploy the Move module

```bash
export CHAIN_ID=sis-testnet-1
./scripts/deploy-move.sh
```

The script runs `minitiad move deploy`, reads back the publisher hex, and patches `.initia/submission.json` with both `deployed_address` and `rollup_chain_id`.

### 5. Configure the frontend

```bash
cp .env.example .env
# Set VITE_SIS_MODULE_ADDRESS to the hex printed by deploy-move.sh
# Set VITE_SIS_CHAIN_ID to the same chain id
```

### 6. Start the dashboard

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Connect wallet → toggle **Auto-sign session** → submit an intent → watch `Live intents` show your `#0` intent in `Pending`.

### 7. Start the solver bot

```bash
cd bots/solver
cp .env.example .env
# Set SOLVER_MNEMONIC and SIS_MODULE_ADDRESS
npm install
npm start
```

Within seconds you'll see `claim #0 → <hash>` then `settle #0 → <hash>`; the dashboard's Live Intents panel moves the intent to `Settled` and the Leaderboard gains a row.

### 8. Record the demo video

Follow [DEMO.md](DEMO.md). Must be 1–3 minutes, public YouTube or Loom.

### 9. Submit

```bash
git rev-parse HEAD   # paste into .initia/submission.json.commit_sha
```

Fill the remaining submission fields (`repo_url`, `demo_video_url`), commit, push, submit on DoraHacks.

---

## What's real vs. what's mocked

| Dashboard panel | Source when module deployed |
|---|---|
| `Total intents` / `Settled` / `Pending now` / `Paid to solvers` / `Settle rate` stat tiles | `sis::intent_registry::stats()` view, polled every 5s |
| `Live intents` feed | `sis::intent_registry::list_recent(10)` view, polled every 4s |
| `Solver leaderboard` | `sis::intent_registry::leaderboard(10)` view, polled every 8s |
| `Submit Intent` | `MsgExecute create_intent` via InterwovenKit `requestTxSync` with auto-sign |
| `Auto-sign session` toggle | `autoSign.enable(CHAIN_ID, { permissions: [...] })` |
| `Bridge` button | `openBridge(...)` — native Interwoven Bridge flow |
| `.init` username badge | `useInterwovenKit().username` |

Still illustrative (clearly labeled "demo"):

- `Execution timeline` — animated step progression for storytelling
- `Solver auction` — design-time bid board (real auction module is v2 scope)
- `Omnitia network map` — TVL / Minitia list from design-time data

When `VITE_SIS_MODULE_ADDRESS` is still the zero default, every real panel falls back to demo data and shows a `demo` badge — the dashboard is always honest about its source.

---

## Licence

MIT — see [LICENSE](LICENSE) (to be added).

Built on the [Initia Interwoven Stack](https://initia.xyz).
