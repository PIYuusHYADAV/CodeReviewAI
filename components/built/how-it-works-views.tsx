"use client";
import { useLayoutEffect, useState } from "react";
import { GitPullRequest, ShieldCheck } from "lucide-react";

import { Architecture } from "../architecture";
import { Pipeline } from "../pipeline";
import { SecurityView } from "./security-view";
import { cn } from "../../lib/utils";

type View = "workflow" | "security";
const TABS = [
  { id: "workflow", label: "Workflow", sub: "Every step of a review", icon: GitPullRequest },
  { id: "security", label: "Security & fault tolerance", sub: "What protects it, and what happens when things break", icon: ShieldCheck },
] as const;

/* The visitor chooses the lens. Only the chosen view is mounted, so the two simulations never share URL state. */
export function HowItWorksViews() {
  const [view, setView] = useState<View>("workflow");
  const [seed, setSeed] = useState("");

  /* Read the link before the workflow simulation's own effects rewrite the URL. */
  useLayoutEffect(() => {
    const q = window.location.search;
    const sp = new URLSearchParams(q);
    if (sp.get("view") === "security") {
      sp.delete("view");
      /* Reading the shared link has to happen after mount, before the URL is rewritten. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSeed(sp.toString() ? q : "");
      setView("security");
    }
  }, []);

  const choose = (v: View) => {
    setSeed("");
    setView(v);
    window.history.replaceState(null, "", v === "security" ? "?view=security" : window.location.pathname);
  };

  return (
    <div>
      <div
        role="tablist"
        aria-label="Choose a view"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") choose("security");
          if (e.key === "ArrowLeft") choose("workflow");
        }}
        className="relative mx-auto mb-14 grid max-w-3xl grid-cols-2 gap-1 rounded-2xl border border-line bg-card/80 p-1.5 backdrop-blur"
      >
        {TABS.map((t) => {
          const on = view === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              id={`hiw-tab-${t.id}`}
              aria-selected={on}
              aria-controls="hiw-panel"
              tabIndex={on ? 0 : -1}
              onClick={() => choose(t.id)}
              className={cn(
                "relative rounded-xl border px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 sm:px-5",
                on ? "border-brand/40 bg-brand-soft" : "border-transparent hover:bg-card",
              )}
            >
              <span className="relative flex items-center gap-2.5">
                <t.icon size={20} aria-hidden className={cn("shrink-0", on ? "text-brand" : "text-muted")} />
                <span>
                  <span className={cn("block text-sm font-semibold sm:text-base", on ? "text-ink" : "text-muted")}>{t.label}</span>
                  <span className="mt-0.5 hidden text-xs text-muted sm:block">{t.sub}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div key={view} role="tabpanel" id="hiw-panel" aria-labelledby={`hiw-tab-${view}`} className="animate-in fade-in duration-300 motion-reduce:animate-none">
        {view === "workflow" ? (
          <>
            <Architecture />
            <div className="mt-28">
              <Pipeline />
            </div>
          </>
        ) : (
          <SecurityView seed={seed} />
        )}
      </div>
    </div>
  );
}
