import { Check, X } from "lucide-react";

import { Reveal } from "../reveal";

/* Each card shows the end state of its scenario as a small static picture. */

function Retries() {
  const tone = ["bad", "bad", "good", "idle", "idle"] as const;
  return (
    <div className="flex items-center gap-2">
      {tone.map((t, i) => (
        <div key={i} className={`flex flex-col items-center gap-1 ${t === "idle" ? "opacity-30" : ""}`}>
          <span className={`grid size-9 place-items-center rounded-full border text-xs ${t === "bad" ? "border-bad/40 bg-bad/10 text-bad" : t === "good" ? "border-good/40 bg-good/10 text-good" : "border-line text-muted"}`}>
            {t === "bad" ? <X size={14} /> : t === "good" ? <Check size={14} /> : i + 1}
          </span>
          <span className="font-mono text-[10px] text-muted">{i === 0 ? "now" : `+${5 * 2 ** (i - 1)}s`}</span>
        </div>
      ))}
    </div>
  );
}

function Dedup() {
  return (
    <div className="relative flex h-14 items-center justify-center gap-3 font-mono text-xs">
      <span className="rounded-lg border border-line bg-paper px-3 py-1.5">push #1 · a91f</span>
      <span className="rounded-lg border border-line bg-paper px-3 py-1.5">push #2 · a91f</span>
      <span className="absolute -bottom-3 rounded-full border border-good/40 bg-good/10 px-3 py-0.5 text-good">1 review · 0 extra AI calls</span>
    </div>
  );
}

function Stuck() {
  return (
    <div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-line">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-brand to-bad" />
        <span className="absolute inset-y-0 left-[60%] w-px bg-white/70" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted"><span>0 min</span><span>15 min · stale</span><span>20</span></div>
      <p className="mt-2 text-center font-mono text-xs text-good">abandoned → queued again</p>
    </div>
  );
}

function Isolated() {
  const rows = [true, true, false, true];
  return (
    <div className="space-y-1.5">
      {rows.map((ok, i) => (
        <div key={i} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 font-mono text-xs ${ok ? "border-good/30 bg-good/10 text-good" : "border-bad/30 bg-bad/10 text-bad"}`}>
          <span>inline comment {i + 1}</span>
          <span>{ok ? "posted" : "failed · others unaffected"}</span>
        </div>
      ))}
    </div>
  );
}

function Decoupled() {
  return (
    <div className="space-y-2 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="w-14 text-muted">Web</span>
        <div className="h-2.5 w-[18%] rounded-full bg-good" />
        <span className="text-good">replied</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-14 text-muted">Worker</span>
        <div className="h-2.5 w-[78%] rounded-full bg-brand" />
      </div>
    </div>
  );
}

function FailOpen() {
  return (
    <div className="flex items-center justify-center gap-3 font-mono text-xs">
      <span className="rounded-lg border border-bad bg-paper px-3 py-2">Redis hiccup</span>
      <span className="h-px w-8 bg-good" />
      <span className="rounded-lg border border-good/40 bg-good/10 px-3 py-2 text-good">review still runs</span>
    </div>
  );
}

const CARDS = [
  { title: "Retries with backoff", problem: "The AI provider times out.", fix: "Up to 5 attempts, waiting 5s, 10s, 20s… between each. Permanent failures are recorded in the database, not lost.", Viz: Retries },
  { title: "Never review twice", problem: "Two PRs land together with identical code.", fix: "Reviews are keyed to the tree SHA. If identical PRs arrive at the same moment, an atomic database claim picks one owner; the others wait and get the same result on their own PR.", Viz: Dedup },
  { title: "Self-healing stuck jobs", problem: "A worker dies mid-review.", fix: "A record stuck over 15 minutes counts as abandoned and is queued again. A nightly sweep requeues anything still stale.", Viz: Stuck },
  { title: "Failures stay contained", problem: "One inline comment can't be posted.", fix: "Comments are posted independently. One failure never takes down the rest of the review.", Viz: Isolated },
  { title: "Fast replies, slow work apart", problem: "A review takes a minute; GitHub waits seconds.", fix: "The web service answers immediately and queues the job. A separate worker (3 at a time) does the slow AI work.", Viz: Decoupled },
  { title: "Fails open, not shut", problem: "The rate limiter's Redis call errors.", fix: "The limiter lets the event through rather than blocking developers. Availability beats strictness here.", Viz: FailOpen },
] as const;

export function Resilience() {
  return (
    <section>
      <Reveal className="mx-auto mb-12 max-w-3xl text-center">
        <p className="font-mono text-sm text-brand">Fault tolerance</p>
        <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Built assuming things will break.</h2>
        <p className="mt-4 text-lg text-muted">Six failure modes, and what the system does about each one.</p>
      </Reveal>
      <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
        {CARDS.map((c) => (
          <article key={c.title} className="flex h-full flex-col rounded-3xl border border-line bg-card p-6 transition-colors hover:border-brand/40">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-bad/30 bg-bad/10 px-3 py-1 text-xs text-bad">If: {c.problem}</p>
            <h3 className="mt-4 text-2xl font-semibold">{c.title}</h3>
            <p className="mt-2 flex-1 text-muted">{c.fix}</p>
            <div className="mt-6 rounded-2xl border border-line bg-paper/70 p-4 pb-5"><c.Viz /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
