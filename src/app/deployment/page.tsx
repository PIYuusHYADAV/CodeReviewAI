import { Reveal } from "../../../components/reveal";
import { Cta } from "../../../components/cta";
import { DeploymentOverview } from "../../../components/deployment-overview";
export default function Deployment() {
  return (
    <main className="px-6 pb-24 pt-20">
      <Reveal className="mx-auto mb-14 max-w-3xl text-center"><header>
        <h1 className="text-balance text-5xl font-semibold sm:text-6xl">
          Where each piece runs and how it ships.
        </h1>
        <p className="mt-6 text-lg text-muted">
          Six platforms, one gated pipeline, and containers for running it all locally.
        </p>
      </header></Reveal>
      <DeploymentOverview />
      <Cta />
    </main>
  );
}
