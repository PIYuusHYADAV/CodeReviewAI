import { Button } from "./ui/button";
import { Reveal } from "./reveal";
import { Github } from "./github-icon";

export function Cta() {
  return (
    <Reveal><section id="install" className="mx-auto mt-32 max-w-4xl px-6 text-center">
      <div className="relative overflow-hidden rounded-[2rem] border border-line bg-card px-8 py-16">
        <div
          aria-hidden
          className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand/30 blur-[100px]"
        />
        <h2 className="relative text-balance text-4xl font-semibold sm:text-5xl">
          Install it on any repo you maintain.
        </h2>
        <div className="relative mt-8 flex flex-wrap justify-center gap-4">
          <Button size="lg" asChild>
            <a href="https://github.com/apps/aicodereview001">
              <Github size={18} /> Install on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section></Reveal>
  );
}
