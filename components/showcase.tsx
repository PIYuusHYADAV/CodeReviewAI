import { ScreenshotFrame } from "./screenshot-frame";

const shots = [
  { src: "review-in-progress", w: 1646, h: 676, t: "1. Instant reply", d: "A placeholder lands right away while four agents work." },
  { src: "inline-hardcoded-secret", w: 1483, h: 691, t: "2. Finds a real problem", d: "A committed live API key, flagged on the exact line." },
  { src: "summary-findings", w: 1277, h: 641, t: "3. Scored summary", d: "One merged, severity-ranked verdict for the whole PR." },
  { src: "checks-passed", w: 1240, h: 675, t: "4. A real Check Run", d: "A clean PR finishes green: Score 10/10 in 10s." },
];

export function Showcase() {
  return (
    <section id="output" className="mx-auto max-w-6xl px-6">
      <div className="mb-12 text-center">
        <p className="font-mono text-sm text-brand">Real output</p>
        <h2 className="mt-2 text-balance text-4xl font-semibold sm:text-5xl">Not mockups. Real pull requests.</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Every screenshot below is the app reviewing a real PR on GitHub.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {shots.map((s) => (
          <div key={s.src}>
            <ScreenshotFrame src={`/screenshots/${s.src}.png`} w={s.w} h={s.h} alt={`${s.t}: ${s.d}`} />
            <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
            <p className="text-muted">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
