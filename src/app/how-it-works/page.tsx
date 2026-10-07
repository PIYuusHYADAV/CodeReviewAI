import { Reveal } from "../../../components/reveal";
import { Cta } from "../../../components/cta";
import { VideoSlot } from "../../../components/video-slot";
import { HowItWorksViews } from "../../../components/built/how-it-works-views";
export default function HowItWorks() {
  return (
    <main className="px-6 pb-24 pt-20">
      <Reveal className="mx-auto mb-10 max-w-3xl text-center"><header>
        <h1 className="text-balance text-5xl font-semibold sm:text-6xl">
          How it works, and how it stays safe.
        </h1>
        <p className="mt-6 text-lg text-muted">
          Watch the walkthrough, then choose a view: the request path from start to finish, or the security and fault tolerance behind it.
        </p>
      </header></Reveal>
      <section className="mx-auto mb-20 max-w-4xl">
        <VideoSlot />
      </section>
      <HowItWorksViews />
      <Cta />
    </main>
  );
}
