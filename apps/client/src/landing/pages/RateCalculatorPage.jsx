import { Link } from "react-router-dom";
import rateCalculatorAnimation from "../assets/rate-calculator-animation.json";
import { PageHero } from "../components/dolphin/PageScaffold";
import { RateCalculatorCard } from "../components/dolphin/ToolCards";
import { Reveal, SectionHeading } from "../components/dolphin/primitives";
import { companyProfile } from "../components/dolphin/siteData";

const stats = [
  { value: "4", label: "zone scenarios" },
  { value: "3", label: "service modes" },
  { value: "1", label: "instant estimate" },
];

function RateCalculatorPage() {
  return (
    <main className="pb-16">
      <PageHero
        eyebrow="Rate Calculator"
        title="Preview shipping costs with a cleaner estimation view before dispatch starts."
        description="This page separates rate planning into its own tool so businesses can think through weight, service level, and route complexity without digging through the home page."
        primaryAction={{ label: "Request Final Pricing", href: `mailto:${companyProfile.email}` }}
        secondaryAction={{ label: "Check Weight Calculator", to: "/volumetric-weight-calculator" }}
        stats={stats}
        visualTitle="Rate planning workspace"
        visualLabel="Rate Calculator"
        visualAnimationData={rateCalculatorAnimation}
      />

      <section className="section-transition mt-20 sm:mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <RateCalculatorCard className="surface-card rounded-[2.2rem] p-6 sm:p-8" />
          </Reveal>
        </div>
      </section>

      <section className="section-transition mt-20 sm:mt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Pricing Factors"
              title="Indicative pricing becomes more useful when you understand the main drivers."
              description="The estimate on this page is designed for planning. Final rates can still move based on commercial slabs, courier rules, insurance, COD settings, and serviceability."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Weight and dimensions",
                description: "Actual weight and volumetric weight both influence what a courier may bill for.",
              },
              {
                title: "Destination zone",
                description: "Route distance and serviceability often change how base pricing behaves.",
              },
              {
                title: "Service urgency",
                description: "Faster delivery commitments usually increase the expected shipping rate.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={0.05 * index}>
                <article className="surface-card rounded-[1.85rem] p-6">
                  <h3 className="font-display text-2xl text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/tracking"
                className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-6 py-3.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Track Shipment
              </Link>
              <Link
                to="/volumetric-weight-calculator"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-200"
              >
                Check Weight Calculator
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

export default RateCalculatorPage;
