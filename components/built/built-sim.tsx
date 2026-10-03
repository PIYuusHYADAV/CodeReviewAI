"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  FileCode,
  Gauge,
  GitPullRequest,
  Link2,
  List,
  ListOrdered,
  Lock,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { codeLink } from "../../lib/site";
import { scenarios as base } from "../sim/data";
import type { Scenario } from "../sim/data";
import { FlowStage } from "../sim/flow-stage";
import { DECISIONS, GROUPS, INIT, SCENARIOS, defaults } from "./engine";
import type { Code, Group, Inspector, Values } from "./engine";

const NODES = base.find((s) => s.id === "journey")!.nodes;
const SPEEDS = { slow: 4200, normal: 2600, fast: 1400 } as const;
type Speed = keyof typeof SPEEDS;

const GROUP_ICON: Record<Group, typeof ShieldCheck> = {
  Normal: GitPullRequest,
  Protection: ShieldCheck,
  Failure: ShieldAlert,
};
const ROWS: { key: keyof Inspector; label: string; icon: typeof Database }[] = [
  { key: "record", label: "Review record", icon: Database },
  { key: "queue", label: "Queue (Redis)", icon: ListOrdered },
  { key: "limits", label: "Rate limits", icon: Gauge },
  { key: "cache", label: "Cache", icon: Zap },
  { key: "check", label: "Check run", icon: CheckCheck },
];
const CHIP: Record<string, string> = {
  ok: "border-good/30 bg-good/10 text-good",
  bad: "border-bad/30 bg-bad/10 text-bad",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  info: "border-brand/30 bg-brand-soft text-brand",
  mute: "border-line bg-paper text-muted",
};
const EDGE: Record<string, string> = {
  ok: "border-l-good",
  bad: "border-l-bad",
  warn: "border-l-amber-400",
  info: "border-l-brand",
};
function valueTone(v: string) {
  const s = v.toLowerCase();
  if (/failed|failure|\(over\)/.test(s)) return "bad";
  if (/neutral|pending|waiting|stale/.test(s)) return "warn";
  if (/success|completed|hit|saved result/.test(s)) return "ok";
  if (/processing|in progress|running|job|worker/.test(s)) return "info";
  return "mute";
}

function CodeLink({ code }: { code: Code }) {
  return (
    <a
      href={codeLink(code.path, code.lines)}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex max-w-full items-center gap-1.5 break-all rounded-full border border-line px-3 py-1 font-mono text-xs text-muted transition-colors hover:border-brand hover:text-brand"
    >
      <FileCode size={13} aria-hidden className="shrink-0" />
      View the code · {code.path}:{code.lines[0]}-{code.lines[1]}
      <ArrowUpRight size={12} aria-hidden className="shrink-0" />
    </a>
  );
}

export function BuiltExperience({ initialSearch }: { initialSearch?: string }) {
  const reduce = useReducedMotion();
  const simRef = useRef<HTMLDivElement>(null);
  const [sid, setSid] = useState(SCENARIOS[0].id);
  const [vals, setVals] = useState<Values>(() => defaults(SCENARIOS[0]));
  const [step, setStep] = useState(0);
  const [list, setList] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");
  const [copied, setCopied] = useState(false);

  const sc = SCENARIOS.find((s) => s.id === sid)!;
  const steps = useMemo(() => (sc.locked ? [] : sc.build(vals)), [sc, vals]);
  const last = Math.max(0, steps.length - 1);
  const at = Math.min(step, last);
  const cur = steps[at];

  const states = useMemo(() => {
    const out: Inspector[] = [];
    let s: Inspector = { ...INIT };
    for (const st of steps) {
      s = { ...s, ...st.set };
      out.push(s);
    }
    return out;
  }, [steps]);
  const insp = states[at] ?? INIT;
  const prev = at > 0 ? (states[at - 1] ?? INIT) : INIT;

  const flow = useMemo<Scenario>(
    () => ({
      id: sid,
      name: sc.name,
      blurb: sc.blurb,
      nodes: NODES,
      steps: steps.map(({ title, text, active, move, packet }) => ({ title, text, active, move, packet })),
    }),
    [sid, sc, steps],
  );

  /* The URL carries scenario, inputs and step, so a copied link reopens the same place. */
  useEffect(() => {
    const p = new URLSearchParams(initialSearch || window.location.search);
    const s = SCENARIOS.find((x) => x.id === p.get("ss"));
    if (!s) return;
    const v = defaults(s);
    for (const inp of s.inputs) {
      const o = inp.options.find((x) => x.value === p.get("i." + inp.id) && !x.locked);
      if (o) v[inp.id] = o.value;
    }
    const n = s.locked ? 1 : s.build(v).length;
    setSid(s.id);
    setVals(v);
    setStep(Math.max(0, Math.min(Number(p.get("st")) || 0, n - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("view", "security");
    p.set("ss", sid);
    p.set("st", String(at));
    for (const [k, v] of Object.entries(vals)) p.set("i." + k, v);
    window.history.replaceState(null, "", `?${p.toString()}`);
  }, [sid, at, vals]);

  /* Autoplay is off until the visitor starts it; any manual action stops it. */
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
      SPEEDS[speed],
    );
    return () => clearInterval(t);
  }, [playing, last, speed]);

  const go = (n: number) => {
    setPlaying(false);
    setStep(Math.max(0, Math.min(last, n)));
  };
  const pick = (id: string) => {
    const s = SCENARIOS.find((x) => x.id === id)!;
    setPlaying(false);
    setSid(id);
    setVals(defaults(s));
    setStep(0);
  };
  const setInput = (id: string, value: string) => {
    setPlaying(false);
    setVals((v) => ({ ...v, [id]: value }));
    setStep(0);
  };
  const reset = () => {
    setPlaying(false);
    setVals(defaults(sc));
    setStep(0);
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  const showSim = (id: string) => {
    pick(id);
    simRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div>
      <div ref={simRef} id="sim" className="mx-auto max-w-6xl scroll-mt-24">
        <p className="mb-4 text-center text-sm text-muted">
          A walkthrough of how the real system handles each case. Not live traffic.
        </p>

        <div className="mb-5 space-y-3">
          {GROUPS.map((g) => {
            const Icon = GROUP_ICON[g];
            return (
              <div key={g} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <p className="flex w-28 shrink-0 items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
                  <Icon size={14} aria-hidden className="text-brand" />
                  {g}
                </p>
                <div role="tablist" aria-label={`${g} cases`} className="flex flex-wrap gap-2">
                  {SCENARIOS.filter((s) => s.group === g).map((s) => (
                    <button
                      key={s.id}
                      role="tab"
                      aria-selected={s.id === sid}
                      onClick={() => pick(s.id)}
                      className={cn(
                        "relative rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        s.id === sid ? "border-brand/40" : "border-line hover:border-brand/40",
                      )}
                    >
                      {s.id === sid && (
                        <motion.span
                          layoutId="built-tab"
                          className="absolute inset-0 rounded-full bg-brand-soft"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                      )}
                      <span className={cn("relative flex items-center gap-1.5", s.id === sid ? "text-brand" : "text-muted hover:text-ink")}>
                        {s.locked && <Lock size={12} aria-hidden />}
                        {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div
            tabIndex={0}
            onKeyDown={(e) => {
              if (sc.locked) return;
              if (e.key === "ArrowRight") go(at + 1);
              if (e.key === "ArrowLeft") go(at - 1);
            }}
            className="relative overflow-hidden rounded-3xl border border-line bg-card/80 p-5 shadow-2xl shadow-brand/10 backdrop-blur sm:p-8"
          >
            <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-brand/20 blur-[90px]" />
            <div className="relative flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-2xl font-semibold">{sc.name}</h3>
              {!sc.locked && <span className="font-mono text-xs text-muted">{last} steps</span>}
            </div>
            <p className="relative mt-1 text-muted">{sc.blurb}</p>

            <div className="relative mt-5 grid gap-4 rounded-2xl border border-line bg-paper/60 p-4 sm:grid-cols-2">
              {sc.inputs.map((inp) => (
                <fieldset key={inp.id} className="min-w-0">
                  <legend className="mb-2 font-mono text-xs text-muted">{inp.label}</legend>
                  <div role="radiogroup" aria-label={inp.label} className="flex flex-wrap gap-1.5">
                    {inp.options.map((o) => {
                      const on = vals[inp.id] === o.value;
                      const off = !!o.locked || !!sc.locked;
                      return (
                        <button
                          key={o.value}
                          role="radio"
                          aria-checked={on}
                          disabled={off}
                          title={off ? "Coming soon" : undefined}
                          onClick={() => setInput(inp.id, o.value)}
                          className={cn(
                            "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
                            on ? "border-brand bg-brand-soft text-brand" : "border-line text-muted hover:border-brand/50 hover:text-ink",
                            off && "cursor-not-allowed opacity-45 hover:border-line hover:text-muted",
                          )}
                        >
                          {o.locked && <Lock size={11} aria-hidden />}
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
              {!sc.locked && <p className="text-xs text-muted sm:col-span-2">Changing an input restarts the walkthrough at step 0.</p>}
            </div>

            {sc.locked ? (
              <div className="relative mt-6 grid place-items-center rounded-2xl border border-dashed border-line bg-paper/50 px-6 py-14 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-brand-soft text-brand">
                  <Lock size={22} aria-hidden />
                </span>
                <p className="mt-4 text-xl font-semibold">Coming soon</p>
                <p className="mt-2 max-w-md text-muted">{sc.locked.replace(/^Coming soon\.\s*/, "")}</p>
              </div>
            ) : (
              <>
                <div className="relative mt-6">
                  {list ? (
                    <ol className="space-y-4">
                      {steps.map((s, i) => (
                        <li key={i} className={cn("border-l-2 pl-4", s.tone ? EDGE[s.tone] : "border-l-line")}>
                          <p className="font-mono text-xs text-brand">
                            {i === 0 ? "Start" : `Step ${i}`} · {s.phase}
                          </p>
                          <p className="font-medium">{s.title}</p>
                          <p className="text-muted">{s.text}</p>
                          {s.code && <CodeLink code={s.code} />}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <div className="min-w-[600px]">
                          <FlowStage sc={flow} step={at} />
                        </div>
                      </div>
                      <p className="mt-1 text-center text-xs text-muted sm:hidden">Swipe the diagram sideways, or use Read as list.</p>
                    </>
                  )}
                </div>

                {!list && cur && (
                  <div
                    aria-live="polite"
                    className={cn("relative mt-4 rounded-2xl border border-l-4 border-line bg-paper/70 p-5", cur.tone ? EDGE[cur.tone] : "border-l-line")}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-brand">{at === 0 ? "Start" : `Step ${at} of ${last}`}</span>
                      <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">{cur.phase}</span>
                      {cur.end && <span className={cn("rounded-full border px-2 py-0.5 text-xs", CHIP[cur.tone ?? "info"])}>Outcome</span>}
                    </div>
                    <motion.div
                      key={`${sid}-${at}-${JSON.stringify(vals)}`}
                      initial={reduce ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="mt-2 text-xl font-semibold">{cur.title}</p>
                      <p className="mt-1 text-muted">{cur.text}</p>
                      {cur.code && <CodeLink code={cur.code} />}
                      {cur.gloss && (
                        <p className="mt-3 rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
                          <span className="font-semibold">{cur.gloss.term}.</span> {cur.gloss.text}
                        </p>
                      )}
                    </motion.div>
                  </div>
                )}

                <div className="relative mt-5 flex items-center gap-1.5" role="group" aria-label="Jump to step">
                  {steps.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => go(i)}
                      aria-label={`Go to step ${i}: ${s.title}`}
                      aria-current={i === at}
                      className={cn("h-2 flex-1 rounded-full transition-colors", i <= at ? "bg-brand" : "bg-line hover:bg-brand/40")}
                    />
                  ))}
                </div>

                <div className="relative mt-6 flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => go(at - 1)} disabled={at === 0}>
                    <ChevronLeft size={16} /> Back
                  </Button>
                  <Button onClick={() => go(at + 1)} disabled={at === last}>
                    Next <ChevronRight size={16} />
                  </Button>
                  <Button variant="outline" onClick={() => (at === last ? (setStep(0), setPlaying(true)) : setPlaying((p) => !p))}>
                    {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? "Pause" : "Play"}
                  </Button>
                  <div role="group" aria-label="Autoplay speed" className="flex rounded-full border border-line p-0.5 text-xs">
                    {(Object.keys(SPEEDS) as Speed[]).map((s) => (
                      <button
                        key={s}
                        aria-pressed={speed === s}
                        onClick={() => setSpeed(s)}
                        className={cn("rounded-full px-3 py-1.5 capitalize transition-colors", speed === s ? "bg-brand-soft text-brand" : "text-muted hover:text-ink")}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw size={16} /> Reset
                  </Button>
                  <span className="flex-1" />
                  <Button variant="outline" onClick={() => setList((v) => !v)} aria-pressed={list}>
                    <List size={16} /> {list ? "Show diagram" : "Read as list"}
                  </Button>
                  <Button variant="outline" onClick={copy}>
                    {copied ? <Check size={16} /> : <Link2 size={16} />} {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </>
            )}
          </div>

          <aside aria-label="State inspector" className="rounded-3xl border border-line bg-card/80 p-5 lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-xs text-brand">State inspector</p>
            <p className="mt-1 text-sm text-muted">What the system holds right now. It changes only when you move a step.</p>
            <dl className="mt-4 space-y-3">
              {ROWS.map((r) => {
                const v = sc.locked ? INIT[r.key] : insp[r.key];
                const changed = !sc.locked && at > 0 && prev[r.key] !== v;
                return (
                  <div key={r.key} className="rounded-xl border border-line bg-paper/60 p-3">
                    <dt className="flex items-center gap-2 text-xs text-muted">
                      <r.icon size={14} aria-hidden className="text-brand" />
                      {r.label}
                    </dt>
                    <dd className="mt-2">
                      <motion.span
                        key={`${r.key}-${v}`}
                        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn("inline-block rounded-full border px-2.5 py-1 font-mono text-xs", CHIP[valueTone(v)], changed && "ring-2 ring-brand/40")}
                      >
                        {v}
                      </motion.span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </aside>
        </div>
      </div>

      <section aria-labelledby="decisions-title" className="mx-auto mt-28 max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="font-mono text-sm text-brand">Design decisions</p>
          <h2 id="decisions-title" className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">
            Five choices, and what each one costs.
          </h2>
          <p className="mt-4 text-lg text-muted">Each decision opens the case above that shows it.</p>
        </div>
        <ul className="space-y-4">
          {DECISIONS.map((d) => (
            <li key={d.decision} className="grid gap-4 rounded-2xl border border-line bg-card p-5 md:grid-cols-[1.1fr_1.4fr_1fr_auto] md:items-center md:gap-6">
              <p className="text-lg font-semibold">{d.decision}</p>
              <p className="text-muted">
                <span className="mb-0.5 block font-mono text-xs text-brand md:hidden">Why</span>
                {d.reason}
              </p>
              <p className="text-muted">
                <span className="mb-0.5 block font-mono text-xs text-brand md:hidden">Trade-off</span>
                {d.tradeoff}
              </p>
              <button
                onClick={() => showSim(d.shownIn)}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-brand hover:text-brand"
              >
                {d.shownLabel} <ArrowUpRight size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
