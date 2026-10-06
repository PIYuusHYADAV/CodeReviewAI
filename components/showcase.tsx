import { ScreenshotFrame } from "./screenshot-frame";

const shots = [
  { src: "review-in-progress", w: 1646, h: 676, t: "1. Instant reply", d: "A placeholder lands right away while four agents work." },
  { src: "inline-hardcoded-secret", w: 1483, h: 691, t: "2. Security agent", d: "Finds a committed live API key on the exact line." },
  { src: "inline-sql-injection", w: 1200, h: 563, t: "3. SQL injection", d: "Flags string-built queries built from user input." },
  { src: "inline-error-handling", w: 1200, h: 598, t: "4. Reliability", d: "Calls out an async function with no try/catch." },
  { src: "inline-architecture", w: 1200, h: 687, t: "5. Architecture agent", d: "Suggests decoupling database access for testability." },
  { src: "summary-findings", w: 1277, h: 641, t: "6. Scored summary", d: "One merged, severity-ranked verdict for the whole PR." },
  { src: "checks-passed", w: 1240, h: 675, t: "7. Real Check Run", d: "A clean PR finishes green: Score 10/10 in 10s." },
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
        {shots.map((s, i) => (
          <div key={s.src} className={i === 0 ? "md:col-span-2 md:mx-auto md:max-w-3xl" : ""}>
            <ScreenshotFrame src={`/screenshots/${s.src}.png`} w={s.w} h={s.h} alt={`${s.t}: ${s.d}`} />
            <h3 className="mt-4 text-lg font-semibold">{s.t}</h3>
            <p className="text-muted">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
