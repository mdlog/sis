import { Wallet, ArrowLeftRight } from "lucide-react";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { truncate } from "@initia/utils";
import { cn } from "../lib/cn";

export function WalletButton({ className }: { className?: string }) {
  const { address, username, openConnect, openWallet, openBridge } = useInterwovenKit();

  if (!address) {
    return (
      <button onClick={openConnect} className={cn("btn-secondary", className)}>
        <Wallet className="h-3.5 w-3.5" />
        Connect
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        onClick={() =>
          openBridge({
            srcChainId: "initiation-2",
            srcDenom: "uinit",
            dstChainId: "minimove-2",
            dstDenom: "uinit",
          })
        }
        className="btn-secondary hidden sm:inline-flex"
        title="Interwoven Bridge"
      >
        <ArrowLeftRight className="h-3.5 w-3.5" />
        Bridge
      </button>
      <button onClick={openWallet} className="btn-secondary" title="Open wallet">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        <span className="mono-num text-xs">{username ?? truncate(address)}</span>
        {username && (
          <span className="hidden rounded border border-accent/30 bg-accent/5 px-1 text-2xs text-accent sm:inline">
            .init
          </span>
        )}
      </button>
    </div>
  );
}
