import { Copy, Filter, Gauge, KeyRound } from "lucide-react";

import { Reveal } from "../reveal";

const LAYERS = [
  { icon: KeyRound, name: "Signed webhooks", block: "Forged request → 401", text: "Every request must carry GitHub's HMAC-SHA256 signature, checked with a constant-time compare. A fake request is rejected before any work happens, so it can never spend model credits." },
  { icon: Filter, name: "Event filtering", block: "Wrong event → ignored", text: "POST only. Just opened and updated pull requests count; drafts and [WIP] titles are skipped. Everything else is dropped with no side effects." },
  { icon: Gauge, name: "Rate limiting", block: "Burst → turned away", text: "Redis counts events: 3 per pull request and 20 per repo each minute. A noisy repo can't drown the queue or run up the AI bill." },
  { icon: Copy, name: "Deduplication", block: "Same code → reused", text: "One review per repo and tree SHA, enforced by a unique database record and a deterministic job ID. Identical code is never reviewed twice." },
] as const;

/* Four layers, in the order a request meets them. Static cards: nothing to scroll through. */
export function DefenseLayers() {
  return (
    <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
      {LAYERS.map((l, i) => (
        <li key={l.name} className="flex flex-col rounded-2xl border border-line bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <l.icon size={20} aria-hidden />
            </span>
            <span className="font-mono text-xs text-muted">Layer {i + 1}</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">{l.name}</h3>
          <p className="mt-2 flex-1 text-muted">{l.text}</p>
          <p className="mt-4 w-fit rounded-full border border-bad/30 bg-bad/10 px-2.5 py-0.5 font-mono text-xs text-bad">
            {l.block}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function DefenseIntro() {
  return (
    <Reveal className="mx-auto mb-10 max-w-3xl text-center">
      <p className="font-mono text-sm text-brand">Security</p>
      <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Four layers stand between the internet and the AI bill.</h2>
      <p className="mt-4 text-lg text-muted">Every request passes these in order. A forged or noisy one is stopped at the first layer that rejects it.</p>
    </Reveal>
  );
}
