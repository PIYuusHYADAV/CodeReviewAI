import { Simulation } from "../../../components/sim/simulation";
import { Reveal } from "../../../components/reveal";
import { Cta } from "../../../components/cta";
export default function Deployment() {
  return (
    <main className="px-6 pb-24 pt-20">
      <Reveal className="mx-auto mb-14 max-w-3xl text-center"><header>
        <h1 className="text-balance text-5xl font-semibold sm:text-6xl">
          Where each piece runs and how it ships.
        </h1>
        <p className="mt-6 text-lg text-muted">
          Step through each view with Next and Back, or press Play to watch it run.
        </p>
      </header></Reveal>
      <Simulation ids={["deploy", "docker", "cicd"]} />
      <Cta />
    </main>
  );
}
