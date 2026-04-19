import { type ReactNode } from "react";
import {
  LayoutDashboard,
  Network,
  Gavel,
  BookOpen,
  Github,
  ExternalLink,
} from "lucide-react";
import { cn } from "../lib/cn";
import { Badge, Dot } from "./ui/Badge";
import { WalletButton } from "./WalletButton";

type Tab = "home" | "network" | "solvers" | "docs";

export function Shell({
  tab,
  onTab,
  children,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="hairline-b sticky top-0 z-30 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="text-sm font-medium tracking-[-0.01em] text-ink-50">
                SIS
              </span>
              <span className="hidden text-xs text-ink-400 md:inline">
                · Sovereign Intent Solver
              </span>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              <TabBtn active={tab === "home"} onClick={() => onTab("home")} icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
                Dashboard
              </TabBtn>
              <TabBtn active={tab === "network"} onClick={() => onTab("network")} icon={<Network className="h-3.5 w-3.5" />}>
                Network
              </TabBtn>
              <TabBtn active={tab === "solvers"} onClick={() => onTab("solvers")} icon={<Gavel className="h-3.5 w-3.5" />}>
                Solvers
              </TabBtn>
              <TabBtn active={tab === "docs"} onClick={() => onTab("docs")} icon={<BookOpen className="h-3.5 w-3.5" />}>
                Architecture
              </TabBtn>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone="neutral" className="hidden md:inline-flex">
              <Dot tone="accent" />
              <span className="font-mono text-2xs">initiation-2</span>
            </Badge>
            <WalletButton />
          </div>
        </div>

        <nav className="hairline-t flex items-center gap-1 overflow-x-auto px-4 py-2 md:hidden">
          <TabBtn active={tab === "home"} onClick={() => onTab("home")} icon={<LayoutDashboard className="h-3.5 w-3.5" />}>
            Dashboard
          </TabBtn>
          <TabBtn active={tab === "network"} onClick={() => onTab("network")} icon={<Network className="h-3.5 w-3.5" />}>
            Network
          </TabBtn>
          <TabBtn active={tab === "solvers"} onClick={() => onTab("solvers")} icon={<Gavel className="h-3.5 w-3.5" />}>
            Solvers
          </TabBtn>
          <TabBtn active={tab === "docs"} onClick={() => onTab("docs")} icon={<BookOpen className="h-3.5 w-3.5" />}>
            Architecture
          </TabBtn>
        </nav>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6">{children}</main>

      <footer className="hairline-t mt-10">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-4 py-5 text-2xs text-ink-500 sm:px-6">
          <div className="flex items-center gap-3">
            <span>SIS · built on the Initia Interwoven Stack</span>
            <span className="text-ink-600">·</span>
            <span>Submission for INITIATE — Season 1</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://initia.xyz" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink-300">
              initia.xyz <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://dorahacks.io/hackathon/initiate" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-ink-300">
              INITIATE <ExternalLink className="h-3 w-3" />
            </a>
            <a href="#" className="inline-flex items-center gap-1 hover:text-ink-300">
              <Github className="h-3 w-3" /> source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-ink-800 text-ink-50"
          : "text-ink-400 hover:bg-ink-800/70 hover:text-ink-100"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-label="SIS">
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="5"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="1.2"
      />
      <path
        d="M7 15.5 L12 6 L17 15.5"
        stroke="#99ffb2"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.5" r="1.2" fill="#99ffb2" />
    </svg>
  );
}
