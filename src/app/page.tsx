import { Hero } from "../../components/hero";
import { HomeSections } from "../../components/home-sections";
import { Cta } from "../../components/cta";
export default function Home() {
  return (
    <main>
      <Hero />
      <HomeSections />
      <div className="pb-24">
        <Cta />
      </div>
    </main>
  );
}
