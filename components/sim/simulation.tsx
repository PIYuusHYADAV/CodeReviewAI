"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  List,
  Link2,
  Check,
  Play,
  Pause,
} from "lucide-react";

import { Button } from "../ui/button";

import { cn } from "../../lib/utils";
import { scenarios } from "./data";
import { FlowStage } from "./flow-stage";

/* Visitor-governed: loads paused at step 0. Nothing plays until the visitor presses Play; any manual action stops it. */
export function Simulation({ ids }: { ids?: string[] }) {
  const list_ = scenarios.filter((s) => !ids || ids.includes(s.id));
  const [sid, setSid] = useState(list_[0].id);
  const [step, setStep] = useState(0);
  const [list, setList] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sc = list_.find((s) => s.id === sid)!;
  const last = sc.steps.length - 1;
  const cur = sc.steps[step];

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = list_.find((x) => x.id === p.get("s"));
    if (s) {
      setSid(s.id);
      setStep(Math.min(Number(p.get("step")) || 0, s.steps.length - 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    window.history.replaceState(null, "", `?s=${sid}&step=${step}`);
  }, [sid, step]);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setStep((s) => {
          if (s >= last) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      2600,
    );
    return () => clearInterval(t);
  }, [playing, last]);

  const go = (n: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, n)));
  };
  const pick = (id: string) => {
    setPlaying(false);
    setSid(id);
    setStep(0);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(step + 1);
        if (e.key === "ArrowLeft") go(step - 1);
      }}
      className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-card/80 p-5 shadow-2xl shadow-brand/10 backdrop-blur sm:p-8"
    >
      <div
        aria-hidden
        className="absolute -right-24 -top-24 size-72 rounded-full bg-brand/20 blur-[90px]"
      />
      {list_.length > 1 && (
        <div role="tablist" className="relative flex flex-wrap gap-2">
          {list_.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === sid}
              onClick={() => pick(s.id)}
              className="relative rounded-full px-4 py-2 text-sm font-medium"
            >
              {s.id === sid && (
                <motion.span
                  layoutId="sim-tab"
                  className="absolute inset-0 rounded-full bg-brand-soft"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span
                className={cn(
                  "relative",
                  s.id === sid ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                {s.name}
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="relative mt-3 text-sm text-muted">
        {sc.blurb} Press Play, or step through it yourself. A walkthrough of the real system, not live traffic.
      </p>

      <div className="relative mt-6">
        {list ? (
          <ol className="space-y-4">
            {sc.steps.map((s, i) => (
              <li key={s.title}>
                <p className="font-medium">
                  {i}. {s.title}
                </p>
                <p className="text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <FlowStage sc={sc} step={step} />
        )}
      </div>

      {!list && (
        <div
          aria-live="polite"
          className="relative mt-4 rounded-2xl border border-line bg-paper/70 p-5"
        >
          <p className="font-mono text-xs text-brand">
            Step {step} of {last}
          </p>
          <p className="mt-1 text-xl font-semibold">{cur.title}</p>
          <p className="mt-1 text-muted">{cur.text}</p>
        </div>
      )}

      <div
        className="relative mt-5 flex items-center gap-1.5"
        role="group"
        aria-label="Jump to step"
      >
        {sc.steps.map((s, i) => (
          <button
            key={s.title}
            onClick={() => go(i)}
            aria-label={`Go to step ${i}: ${s.title}`}
            aria-current={i === step}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors",
              i <= step ? "bg-brand" : "bg-line hover:bg-brand/40",
            )}
          />
        ))}
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          onClick={() => go(step - 1)}
          disabled={step === 0}
        >
          <ChevronLeft size={16} /> Back
        </Button>
        <Button onClick={() => go(step + 1)} disabled={step === last}>
          Next <ChevronRight size={16} />
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            step === last
              ? (setStep(0), setPlaying(true))
              : setPlaying((p) => !p)
          }
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setPlaying(false);
            setStep(0);
          }}
        >
          <RotateCcw size={16} /> Reset
        </Button>
        <span className="flex-1" />
        <Button
          variant="outline"
          onClick={() => setList((v) => !v)}
          aria-pressed={list}
        >
          <List size={16} /> {list ? "Show diagram" : "Read as list"}
        </Button>
        <Button variant="outline" onClick={copy}>
          {copied ? <Check size={16} /> : <Link2 size={16} />}{" "}
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
    </div>
  );
}
