import { Link } from "react-router-dom";
import weightCalculatorVisual from "../assets/volumetric-calculator.webp";
import { PageHero } from "../components/dolphin/PageScaffold";
import { VolumetricCalculatorCard } from "../components/dolphin/ToolCards";
import { Reveal, SectionHeading } from "../components/dolphin/primitives";

const stats = [
  { value: "5000", label: "standard divisor" },
  { value: "3", label: "dimensions required" },
  { value: "1", label: "faster planning step" },
];

function VolumetricCalculatorPage() {
  return (
    <main className="pb-16">
      <PageHero
        eyebrow="Weight Calculator"
        title="Estimate dimensional weight before you choose a courier or confirm a quote."
        description="This dedicated tool page gives teams a clean place to check volumetric weight and explain billing logic to internal teams or customers."
        primaryAction={{ label: "Check Rate Calculator", to: "/rate-calculator" }}
        stats={stats}
        visualTitle="Dimensional planning view"
        visualLabel="Weight Calculator"
        visualImage={weightCalculatorVisual}
        visualAlt="Weight calculator package dimensions"
      />

      <section className="section-transition mt-20 sm:mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <VolumetricCalculatorCard className="surface-card rounded-[2.2rem] p-6 sm:p-8" />
          </Reveal>
        </div>
      </section>

      <section className="section-transition mt-20 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="How To Use It"
              title="Use this page when carton dimensions affect the shipping decision."
              description="Dimensional weight is especially helpful when actual weight looks low but package size is large enough to change billing and courier selection."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              "Measure the outer carton dimensions in centimeters.",
              "Compare the dimensional result with actual package weight.",
              "Use the higher value when discussing likely billing impact.",
            ].map((item, index) => (
              <Reveal key={item} delay={0.05 * index}>
                <article className="surface-card rounded-[1.85rem] p-6">
                  <p className="font-display text-2xl text-slate-900">0{index + 1}</p>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/rate-calculator"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Continue to Rate Calculator
              </Link>
              <Link
                to="/tracking"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200"
              >
                Track Shipment
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

export default VolumetricCalculatorPage;
