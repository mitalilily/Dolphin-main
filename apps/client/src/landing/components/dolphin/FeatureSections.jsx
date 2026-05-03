import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { analyticsCards, faqs, featureGrid, snapshotStats } from "./content";
import Icon from "./Icons";
import { InsightPreview, Reveal, SectionHeading } from "./primitives";
import { ShippingToolPlaceholders } from "./ToolCards";

const MotionArticle = motion.article;
const MotionDiv = motion.div;

export function FeaturesSection() {
  return (
    <section id="why-us" className="section-transition mt-20 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Why Choose Us"
            title="Capabilities that help teams ship smarter without adding complexity."
            description="The feature set stays focused on practical shipping needs such as speed, coverage, visibility, customer updates, and lower operational friction."
            align="center"
          />
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {featureGrid.map((feature, index) => (
            <Reveal key={feature.title} delay={0.05 * index}>
              <MotionArticle
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.25 }}
                className="surface-card h-full rounded-[1.85rem] p-6"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(198,231,255,0.9),rgba(255,221,174,0.82))] text-slate-900 shadow-sm">
                  <Icon name={feature.icon} />
                </span>
                <h3 className="mt-5 font-display text-2xl text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </MotionArticle>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ToolsSection() {
  return (
    <section id="shipping-tools" className="section-transition mt-20 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,rgba(198,231,255,0.3),rgba(255,255,255,0.88),rgba(212,246,255,0.4))] p-6 shadow-[0_30px_80px_rgba(15,44,67,0.08)] sm:p-8 lg:p-10">
          <Reveal>
            <SectionHeading
              eyebrow="Shipping Tools"
              title="Quick estimators that make planning easier before you book."
              description="Useful helpers for checking volumetric weight and indicative rate movement while teams prepare shipments."
            />
          </Reveal>

          <div className="mt-10">
            <ShippingToolPlaceholders />
          </div>
        </div>
      </div>
    </section>
  );
}

export function SnapshotSection() {
  return (
    <section id="snapshot" className="section-transition mt-20 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(198,231,255,0.48),rgba(255,221,174,0.36))] px-6 py-8 shadow-[0_28px_80px_rgba(10,30,46,0.12)] sm:px-8 lg:px-10 lg:py-10">
          <Reveal>
            <SectionHeading
              eyebrow="Platform Snapshot"
              title="A compact view of how the platform stays focused on shipping outcomes."
              description="The product direction centers on clarity, operational speed, and practical tools that make day-to-day dispatch work easier to manage."
            />
          </Reveal>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {snapshotStats.map((stat, index) => (
              <Reveal key={stat.label} delay={0.06 * index}>
                <MotionArticle
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                  className="h-full rounded-[1.9rem] border border-white/80 bg-white/78 p-6 shadow-sm backdrop-blur-sm"
                >
                  <p className="font-display text-4xl text-slate-900">{stat.value}</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{stat.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{stat.note}</p>
                </MotionArticle>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsSection() {
  return (
    <section id="analytics" className="section-transition mt-20 sm:mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Analytics and Insights"
            title="Visibility layers that help teams react faster and plan with more confidence."
            description="These insight-focused cards show how the interface can surface trends, delivery signals, and cost patterns without overwhelming the user."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          {analyticsCards.map((card, index) => (
            <Reveal key={card.title} delay={0.08 * index}>
              <MotionArticle
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.25 }}
                className="surface-card h-full rounded-[2rem] p-6"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                    <Icon name={card.icon} />
                  </span>
                  <h3 className="font-display text-2xl text-slate-900">{card.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{card.description}</p>
                <div className="mt-6">
                  <InsightPreview />
                </div>
                <ul className="mt-6 grid gap-3">
                  {card.metrics.map((metric) => (
                    <li key={metric} className="flex items-start gap-3 text-sm text-slate-600">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-sky-300 to-amber-200" />
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </MotionArticle>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <section id="faq" className="section-transition mt-20 sm:mt-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="FAQ"
            title="Answers for teams exploring a more streamlined shipping setup."
            description="A few quick clarifications around the shipping aggregator approach, feature coverage, and future expansion."
            align="center"
          />
        </Reveal>

        <div className="mt-10 grid gap-4">
          {faqs.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <Reveal key={item.question} delay={0.05 * index}>
                <MotionArticle layout className="surface-card rounded-[1.85rem] px-6 py-5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${index}`}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  >
                    <span className="font-display text-xl text-slate-900">{item.question}</span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                      <Icon name={isOpen ? "minus" : "plus"} className="h-4 w-4" />
                    </span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen ? (
                      <MotionDiv
                        id={`faq-panel-${index}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-4 text-sm leading-7 text-slate-600">{item.answer}</p>
                      </MotionDiv>
                    ) : null}
                  </AnimatePresence>
                </MotionArticle>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
