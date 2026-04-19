# SIS — Demo video storyboard

Target length: **1–3 minutes** per INITIATE submission requirements (public YouTube or Loom URL — no unlisted).

Record at 1920×1080, 60fps. Voice-over in English or Indonesian (both are fine). Use a screen recorder with keystroke overlay (e.g. OBS + KeyCastr, or Loom).

---

## Scene 1 — Hook (0:00–0:10)

**Visual:** Full-screen Dashboard of the SIS app. Cursor hovers over the big textarea.

**Voice-over:**
> "Initia unlocks thousands of rollups — but users today still hop between bridges, gas tokens, and 7-day withdrawal windows. SIS collapses that to one instruction."

**On-screen text:** *Sovereign Intent Solver — one intent, every Minitia.*

---

## Scene 2 — Connect via InterwovenKit (0:10–0:20)

**Visual:**
1. Click **Connect wallet** in the header.
2. InterwovenKit modal opens.
3. Pick a wallet (Keplr / MetaMask).
4. Wallet button now shows `.init` username with the cyan `.init` chip.

**Voice-over:**
> "One click — the InterwovenKit modal handles wallet selection, and SIS resolves my Initia username."

**Annotation:** Arrow pointing at the `.init` badge.

---

## Scene 3 — Declare the intent (0:20–0:35)

**Visual:**
1. Click the **"Buy NFT cross-Minitia"** template chip — prompt auto-fills.
2. Drag the **Deadline** slider down to 60s.
3. Drag the **Max slippage** slider to 0.3%.
4. Watch the compiled Move `Intent` struct on the right-hand panel update live.

**Voice-over:**
> "I type what I want in plain English. SIS compiles it into a Move `Intent` struct — resource-safe, deadline-bounded, slippage-capped."

**Annotation:** Highlight the `reward_for_solver` line.

---

## Scene 4 — Session-key authorization + real on-chain tx (0:35–0:55)

**Visual:**
1. Click **Submit Intent**.
2. InterwovenKit tx-preview modal appears — fee estimate, memo, decoded message.
3. Sign once.
4. Button spinner: *"Signing via session key…"*.
5. Green toast: *"Intent registered on SIS Minitia · 0xabc…123"*.

**Voice-over:**
> "One signature — not one per step. The session key scopes what solvers can do, and the intent hash is registered on the SIS Minitia as a real on-chain transaction."

**Annotation:** After success, click the tx hash and cut to the Initia testnet explorer showing the tx.

---

## Scene 5 — Execution unfolds (0:55–1:10)

**Visual:**
1. Switch focus to the **Execution timeline** card.
2. Watch steps tick from "parse intent" → "session key auth" → "source pull" → "L1 route" → "Minitswap egress" → "JIT gas" → "atomic purchase" → "settlement".
3. Pan to the **Solver auction** card — highlight the winning solver.

**Voice-over:**
> "Behind the curtain: a solver auction picks the cheapest, fastest route. Minitswap skips the 7-day bridge wait. JIT gas tops up the target Minitia on the fly. Settlement is atomic, and an IBC receipt proves it."

---

## Scene 6 — The "second native feature" beat (1:10–1:20)

**Visual:**
1. Click the **Bridge** button in the header.
2. InterwovenKit's native Bridge UI opens inside SIS.
3. Close it.

**Voice-over:**
> "And when users want it explicit, SIS exposes Initia's Interwoven Bridge directly — same session, same wallet."

---

## Scene 7 — The sovereign bit (1:20–1:30)

**Visual:**
1. Switch to the **Architecture** tab.
2. Scroll through "The Brain / The Clearinghouse / The Executors" pillars.
3. Land on the VIP pool card showing MEV recaptured.

**Voice-over:**
> "Because SIS is its own Minitia — not an API — it captures routing MEV on-chain and rebates it to users and solvers through Initia's VIP program. That's what sovereign execution buys you."

**Closing card:** `SIS · github.com/<you> · sis.initia.xyz (soon)`

---

## Shot checklist before recording

- [ ] Switch browser to a **full-screen private window** (no bookmarks bar, no extension icons).
- [ ] Clear the wallet so Scene 2 shows the real connect flow.
- [ ] Pre-fund the testnet wallet with >1 INIT so `requestTxBlock` doesn't fail on gas.
- [ ] Pre-open DevTools → *Network* tab briefly to show a real RPC call (optional credibility shot).
- [ ] Turn off notifications.
- [ ] Practice once without recording so the timeline animation lands on step 5–6 during Scene 5.

---

## Submission checklist (tied to hackathon rules)

- [ ] Demo video uploaded (unlisted link) — this storyboard
- [ ] `README.md` at repo root — included
- [ ] `.initia/submission.json` at repo root — included
- [ ] Live demo URL (Vercel / Netlify / Cloudflare Pages)
- [ ] Rollup chain ID / deployment link filled in `.initia/submission.json`
- [ ] At least one example transaction link on the SIS Minitia
- [ ] Project submitted on DoraHacks BUIDL page for INITIATE
