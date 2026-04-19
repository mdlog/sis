import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  Zap,
  ZapOff,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { bcs } from "@initia/initia.js";
import { MsgExecute } from "@initia/initia.proto/initia/move/v1/tx";
import { INTENT_TEMPLATES, MINITIAS } from "../lib/mock";
import { cn } from "../lib/cn";
import {
  SIS_CHAIN_ID,
  SIS_GAS_DENOM,
  SIS_MODULE_ADDRESS,
  SIS_MODULE_NAME,
  IS_MODULE_DEPLOYED,
} from "../lib/config";

type TxState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "success"; hash: string }
  | { status: "error"; message: string };

export function IntentComposer({ onSubmit }: { onSubmit: (prompt: string) => void }) {
  const {
    address,
    openConnect,
    requestTxSync,
    autoSign,
  } = useInterwovenKit();
  const autoSignEnabled = Boolean(autoSign?.isEnabledByChain?.[SIS_CHAIN_ID]);
  void SIS_GAS_DENOM;

  const [prompt, setPrompt] = useState(INTENT_TEMPLATES[0].prompt);
  const [deadline, setDeadline] = useState(120);
  const [slippage, setSlippage] = useState(0.5);
  const [reward, setReward] = useState(0.25);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const activeTemplate = INTENT_TEMPLATES.find((t) => t.prompt === prompt);
  const fromMinitia = MINITIAS.find((m) => m.id === (activeTemplate?.from ?? "milkyway"))!;
  const toMinitia = MINITIAS.find((m) => m.id === (activeTemplate?.to ?? "nftflow"))!;

  const rewardUinit = BigInt(Math.round(reward * 1_000_000));
  const slippageBps = Math.round(slippage * 100);

  async function toggleAutoSign() {
    if (!autoSign) return;
    if (autoSignEnabled) {
      await autoSign.disable(SIS_CHAIN_ID);
    } else {
      // InterwovenKit derives the permission scope from the provider's
      // `enableAutoSign` config (set in providers.tsx); the runtime API
      // takes only the chain id.
      await autoSign.enable(SIS_CHAIN_ID);
    }
  }

  async function handleSubmit() {
    if (!address) {
      openConnect();
      return;
    }
    if (!IS_MODULE_DEPLOYED) {
      setTx({
        status: "error",
        message:
          "Module not deployed yet. Run `scripts/deploy-move.sh` and set VITE_SIS_MODULE_ADDRESS.",
      });
      return;
    }
    setTx({ status: "signing" });
    try {
      const args = [
        bcs.string().serialize(fromMinitia.id).toBase64(),
        bcs.string().serialize(toMinitia.id).toBase64(),
        bcs.string().serialize(prompt).toBase64(),
        bcs.u64().serialize(1n).toBase64(), // min_receive — TODO: derive from quote
        bcs.u64().serialize(BigInt(slippageBps)).toBase64(),
        bcs.u64().serialize(rewardUinit).toBase64(),
        bcs.u64().serialize(BigInt(deadline)).toBase64(),
      ].map((b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

      const transactionHash = await requestTxSync({
        chainId: SIS_CHAIN_ID,
        messages: [
          {
            typeUrl: "/initia.move.v1.MsgExecute",
            value: MsgExecute.fromPartial({
              sender: address,
              moduleAddress: SIS_MODULE_ADDRESS,
              moduleName: SIS_MODULE_NAME,
              functionName: "create_intent",
              typeArgs: [],
              args,
            }),
          },
        ],
      });
      setTx({ status: "success", hash: transactionHash });
      onSubmit(prompt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setTx({ status: "error", message });
    }
  }

  return (
    <section className="surface rounded-2xl">
      <div className="px-6 pb-5 pt-6 sm:px-8 sm:pt-8">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink-50 sm:text-2xl">
          Declare an outcome.
          <span className="text-ink-400"> We route it across every Minitia.</span>
        </h1>
      </div>

      <div className="hairline-t grid gap-0 lg:grid-cols-[1fr_300px]">
        <div className="px-6 py-5 sm:px-8">
          <label className="label">Intent</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="input mt-2 resize-none font-mono text-[13px] leading-relaxed"
            placeholder='"Buy the cheapest Genesis Sword on NFTFlow using my USDC on MilkyWay DeFi"'
          />

          <div className="mt-3 flex flex-wrap gap-1.5">
            {INTENT_TEMPLATES.map((t) => {
              const active = prompt === t.prompt;
              return (
                <button
                  key={t.id}
                  onClick={() => setPrompt(t.prompt)}
                  className={cn(
                    "chip",
                    active && "border-accent/40 bg-accent/[0.06] text-accent"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="mt-5 inline-flex items-center gap-1 text-xs text-ink-400 hover:text-ink-200"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showAdvanced && "rotate-180"
              )}
            />
            Advanced
          </button>

          <AnimatePresence initial={false}>
            {showAdvanced && (
              <motion.div
                key="adv"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <Field label="Deadline" suffix="s" value={deadline} min={30} max={600} step={15} onChange={setDeadline} />
                  <Field label="Slippage" suffix="%" value={slippage} min={0.1} max={5} step={0.1} onChange={setSlippage} />
                  <Field label="Solver reward" suffix="INIT" value={reward} min={0.05} max={2} step={0.05} onChange={setReward} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="hairline-t border-line px-6 py-5 sm:px-8 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <span className="label">Compiled</span>
            <span className="font-mono text-2xs text-ink-500">intent_registry</span>
          </div>
          <pre className="mt-2 overflow-x-auto font-mono text-[11.5px] leading-5 text-ink-300">
            <code>
{`source  ${fromMinitia.id}
target  ${toMinitia.id}
slip    ${slippageBps} bps
reward  ${reward.toFixed(2)} INIT
expire  ${deadline}s`}
            </code>
          </pre>

          <button
            type="button"
            onClick={toggleAutoSign}
            disabled={!address || !autoSign}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-2xs transition disabled:opacity-40",
              autoSignEnabled
                ? "border-accent/40 bg-accent/[0.06] text-accent"
                : "border-line bg-bg-subtle text-ink-300 hover:border-line-strong"
            )}
            title={
              autoSignEnabled
                ? "Auto-signing enabled — subsequent submits skip the wallet prompt"
                : "Enable auto-signing to submit without per-tx confirmation"
            }
          >
            <span className="flex items-center gap-1.5">
              {autoSignEnabled ? <Zap className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
              Auto-sign session
            </span>
            <span className="font-mono">{autoSignEnabled ? "on" : "off"}</span>
          </button>
        </aside>
      </div>

      <div className="hairline-t flex flex-wrap items-center justify-between gap-3 px-6 py-4 sm:px-8">
        <div className="text-xs text-ink-400">
          <span className="mono-num text-ink-100">~3.8s</span> finality
          <span className="mx-2 text-ink-600">·</span>
          <span className="mono-num text-ink-100">{rewardUinit.toString()} uinit</span> reward
          <span className="mx-2 text-ink-600">·</span>
          <span className="text-accent">auto-sign {autoSignEnabled ? "active" : "idle"}</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={tx.status === "signing"}
          className="btn-primary"
        >
          {tx.status === "signing" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {autoSignEnabled ? "Submitting…" : "Signing…"}
            </>
          ) : !address ? (
            <>
              Connect to submit
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Submit Intent
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {tx.status === "success" && (
        <div className="hairline-t flex items-center gap-2 px-6 py-3 text-xs text-accent sm:px-8">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Intent registered on SIS Minitia
          <span className="text-ink-500">·</span>
          <span className="mono-num text-ink-200">
            {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
          </span>
        </div>
      )}
      {tx.status === "error" && (
        <div className="hairline-t flex items-start gap-2 px-6 py-3 text-xs text-rose-300 sm:px-8">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="break-words">{tx.message}</span>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  suffix: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="mono-num text-xs text-ink-100">
          {value}
          <span className="ml-0.5 text-ink-500">{suffix}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 h-1 w-full cursor-pointer appearance-none rounded bg-line accent-accent"
      />
    </div>
  );
}
