import { ArrowRight, Boxes, Rocket, Server } from "lucide-react";

const PLATFORMS = [
  { name: "Vercel", role: "Web service", note: "Next.js app and webhook endpoint" },
  { name: "Render", role: "Worker", note: "Its own Dockerfile; up to 3 jobs at once" },
  { name: "Upstash", role: "Redis", note: "Queue, rate limits, 24-hour cache" },
  { name: "Supabase", role: "Postgres", note: "Review records and waiters" },
  { name: "Groq · Gemini", role: "Models", note: "Four agents plus the aggregator" },
  { name: "GitHub", role: "App + Actions", note: "Where it starts, ends, and is tested" },
];

const PIPELINE = ["Push to main", "Type check", "Tests", "Build", "Deploy hook"];

const containers = [
  "Dockerfile builds the web image",
  "Dockerfile.worker builds the worker image",
  "docker-compose runs both next to Redis 7 and Postgres 16, with persistent volumes",
];

export function DeploymentOverview() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-3xl border border-line bg-card p-7">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Server size={20} className="text-brand" aria-hidden /> Where each piece runs</h2>
        <p className="mt-1 text-muted">Six platforms, each doing one job, talking over the network.</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <li key={p.name} className="rounded-2xl border border-line bg-paper p-4">
              <p className="font-mono text-xs text-brand">{p.role}</p>
              <p className="mt-1 font-semibold">{p.name}</p>
              <p className="mt-1 text-sm text-muted">{p.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-line bg-card p-7">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Rocket size={20} className="text-brand" aria-hidden /> CI/CD</h2>
        <p className="mt-1 text-muted">
          Only a change that passes every check ships. Automatic deploys from Git are switched off, so the pipeline is the only way to production.
        </p>
        <ol className="mt-6 flex flex-wrap items-center gap-2">
          {PIPELINE.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-full border border-line bg-paper px-4 py-1.5 font-mono text-xs">{s}</span>
              {i < PIPELINE.length - 1 && <ArrowRight size={14} className="text-muted" aria-hidden />}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-muted">
          A second scheduled workflow runs every day at 02:00 UTC and reconciles reviews that got stuck in progress.
        </p>
      </section>

      <section className="rounded-3xl border border-line bg-card p-7">
        <h2 className="flex items-center gap-2 text-xl font-semibold"><Boxes size={20} className="text-brand" aria-hidden /> Containers</h2>
        <ul className="mt-4 space-y-2 text-muted">
          {containers.map((c) => (
            <li key={c} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />{c}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
