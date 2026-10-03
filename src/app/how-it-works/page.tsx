import { Reveal } from "../../../components/reveal";
import { Cta } from "../../../components/cta";
import { VideoSlot } from "../../../components/video-slot";
import { HowItWorksViews } from "../../../components/built/how-it-works-views";
export default function HowItWorks() {
  return (
    <main className="px-6 pb-24 pt-20">
      <Reveal className="mx-auto mb-14 max-w-3xl text-center"><header>
        <h1 className="text-balance text-5xl font-semibold sm:text-6xl">
          What happens after you open a pull request.
        </h1>
        <p className="mt-6 text-lg text-muted">
          From the moment a PR opens to the review appearing on your lines,
          here&apos;s every step, with nothing hidden.
        </p>
      </header></Reveal>
      <HowItWorksViews />
      <section className="mx-auto mt-32 max-w-3xl">
        <VideoSlot />
      </section>
      <Cta />
    </main>
  );
}
