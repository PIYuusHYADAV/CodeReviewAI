"use client";
import { useLayoutEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { GitPullRequest, ShieldCheck } from "lucide-react";

import { Simulation } from "../sim/simulation";
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
  const reduce = useReducedMotion();
  const [view, setView] = useState<View>("workflow");
  const [seed, setSeed] = useState("");

  /* Read the link before the workflow simulation's own effects rewrite the URL. */
  useLayoutEffect(() => {
    const q = window.location.search;
    const sp = new URLSearchParams(q);
    if (sp.get("view") === "security") {
      sp.delete("view");
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
              className="relative rounded-xl px-3 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/60 sm:px-5"
            >
              {on && (
                <motion.span
                  layoutId="hiw-pill"
                  className="absolute inset-0 rounded-xl border border-brand/40 bg-brand-soft"
                  transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                />
              )}
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

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={view}
          role="tabpanel"
          id="hiw-panel"
          aria-labelledby={`hiw-tab-${view}`}
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === "workflow" ? (
            <>
              <Simulation ids={["journey"]} />
              <div className="mt-28">
                <Pipeline />
              </div>
            </>
          ) : (
            <SecurityView seed={seed} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
