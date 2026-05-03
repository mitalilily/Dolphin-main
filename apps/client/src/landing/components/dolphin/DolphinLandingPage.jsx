import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Link } from "react-router-dom";
import deliveryAnimationUrl from "../../assets/delivery-animation.json?url";
import Icon from "./Icons";
import { companyProfile } from "./siteData";
import { Reveal, SectionHeading } from "./primitives";

const MotionArticle = motion.article;

const primaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-6 py-4 text-sm font-semibold text-slate-900 shadow-[0_18px_34px_rgba(130,194,255,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_40px_rgba(130,194,255,0.3)] sm:w-auto";

const secondaryButtonClass =
  "inline-flex w-full items-center justify-center rounded-2xl border border-sky-200 bg-white/85 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white sm:w-auto";

const platformBadges = [
  { label: "Shopify", icon: "shoppingBag", shell: "bg-white/88" },
  { label: "WooCommerce", icon: "store", shell: "bg-[#eef8ff]" },
  { label: "Amazon", icon: "globe", shell: "bg-[#fff8ef]" },
  { label: "Flipkart", icon: "package", shell: "bg-[#f4fbff]" },
  { label: "Magento", icon: "layers", shell: "bg-white/88" },
  { label: "BigCommerce", icon: "shoppingBag", shell: "bg-[#eef8ff]" },
  { label: "Wix", icon: "spark", shell: "bg-[#fff8ef]" },
  { label: "Blue Dart", icon: "route", shell: "bg-[#f4fbff]" },
  { label: "Delhivery", icon: "truck", shell: "bg-white/88" },
  { label: "XpressBees", icon: "bolt", shell: "bg-[#eef8ff]" },
  { label: "FedEx", icon: "rocket", shell: "bg-[#fff8ef]" },
  { label: "Ecom Express", icon: "clock", shell: "bg-[#f4fbff]" },
];

const featureCards = [
  {
    title: "Order Management",
    description:
      "Auto-synchronise orders across multiple channels and ship them effortlessly from one unified dashboard.",
    icon: "layers",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(198,231,255,0.46))]",
  },
  {
    title: "Next-Day Delivery",
    description:
      "Convert more website visitors into customers and level up your delivery experience with fast shipping.",
    icon: "bolt",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,221,174,0.38))]",
  },
  {
    title: "Order Verification",
    description:
      "Verify orders and addresses before shipping to optimise your delivery rate and reduce RTO.",
    icon: "shield",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(212,246,255,0.54))]",
  },
  {
    title: "Order Tracking",
    description:
      "Real-time shipment tracking for sellers and customers, keeping everyone updated on delivery status.",
    icon: "search",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(198,231,255,0.42))]",
  },
  {
    title: "Channel Connections",
    description:
      "Connect your Shopify, WooCommerce, Amazon, Flipkart and more so orders sync across channels seamlessly.",
    icon: "globe",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,221,174,0.34))]",
  },
  {
    title: "Courier Connections",
    description:
      "Integrated with 27+ top couriers like Blue Dart, Delhivery, XpressBees and more for flexible shipping.",
    icon: "truck",
    shell:
      "bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(212,246,255,0.48))]",
  },
];

const valueCards = [
  {
    title: "Multi-Channel Integration",
    description:
      "Connect Shopify, WooCommerce, Amazon, Flipkart and more so every selling channel lives in one place.",
    icon: "globe",
    shell:
      "bg-[linear-gradient(135deg,rgba(198,231,255,0.5),rgba(255,255,255,0.95))]",
  },
  {
    title: "27+ Courier Partners",
    description:
      "Work with Blue Dart, Delhivery, XpressBees, FedEx and more from one shipping workspace.",
    icon: "truck",
    shell:
      "bg-[linear-gradient(135deg,rgba(255,221,174,0.42),rgba(255,255,255,0.95))]",
  },
  {
    title: "Auto Order Sync",
    description:
      "Orders from all channels flow into the dashboard automatically so your team can ship faster.",
    icon: "refresh",
    shell:
      "bg-[linear-gradient(135deg,rgba(212,246,255,0.58),rgba(255,255,255,0.95))]",
  },
  {
    title: "Automated Label Generation",
    description:
      "Labels are prepared using your preferred courier logic so operators spend less time repeating manual tasks.",
    icon: "package",
    shell:
      "bg-[linear-gradient(135deg,rgba(198,231,255,0.46),rgba(255,255,255,0.95))]",
  },
  {
    title: "Unified Dashboard",
    description:
      "Manage orders, shipments, analytics, and delivery updates from a single operational view.",
    icon: "chart",
    shell:
      "bg-[linear-gradient(135deg,rgba(255,221,174,0.34),rgba(255,255,255,0.95))]",
  },
];

const insightCards = [
  {
    title: "Delivery Performance",
    description: "Track delivery metrics and courier performance in real-time.",
    icon: "chart",
  },
  {
    title: "Financial Analytics",
    description: "Monitor courier costs, COD collection, and RTO trends.",
    icon: "coins",
  },
  {
    title: "Customer Metrics",
    description: "Access detailed reports on customer satisfaction and order trends.",
    icon: "checkCircle",
  },
];

const ecommerceCards = [
  {
    title: "Automatic Order Sync",
    description: "Orders from all connected channels are automatically synced to your dashboard.",
    icon: "refresh",
  },
  {
    title: "AWB Number Update",
    description: "AWB numbers are automatically updated back to your store or marketplace.",
    icon: "package",
  },
  {
    title: "Real-time Tracking Updates",
    description: "Shipment tracking updates are synced in real-time to keep customers informed.",
    icon: "bell",
  },
];

const dashboardBars = [
  "h-16 bg-[#8FD8FF]",
  "h-24 bg-[#FFD8A8]",
  "h-20 bg-[#BEEBFF]",
  "h-32 bg-[#9BCBFF]",
  "h-[5.4rem] bg-[#FDE7C5]",
  "h-28 bg-[#CFEFFF]",
  "h-[6.5rem] bg-[#FFCFA0]",
];

function ActionAnchor({ href, to, children, className }) {
  if (to) {
    return (
      <Link className={className} to={to}>
        {children}
      </Link>
    );
  }

  return (
    <a className={className} href={href}>
      {children}
    </a>
  );
}

function HeroVisual({ animationData, animationError }) {
  return (
    <div className="relative flex min-h-[18rem] items-center justify-center sm:min-h-[26rem] lg:min-h-[36rem]">
      <div className="absolute inset-0 rounded-[2.8rem] bg-[radial-gradient(circle_at_18%_18%,rgba(198,231,255,0.8),transparent_26%),radial-gradient(circle_at_80%_26%,rgba(255,221,174,0.7),transparent_24%),radial-gradient(circle_at_48%_82%,rgba(212,246,255,0.75),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.76),rgba(255,255,255,0.16))]" />
      <div className="absolute inset-6 rounded-[2.4rem] bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:28px_28px]" />
      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          className="relative z-10 mx-auto w-full max-w-[34rem]"
        />
      ) : (
        <div className="relative z-10 flex h-[18rem] w-full max-w-[32rem] items-center justify-center rounded-[2rem] border border-white/70 bg-white/70 backdrop-blur-md sm:h-[26rem] lg:h-[30rem]">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              {animationError ? "Animation unavailable" : "Loading animation"}
            </p>
            <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-slate-600">
              {animationError
                ? "The delivery visual could not be loaded right now."
                : "Preparing the hero animation for your storefront."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSection({ animationData, animationError }) {
  return (
    <section className="section-transition pt-10 sm:pt-14">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:px-8">
        <Reveal delay={0.04}>
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
              Built for high-growth eCommerce teams
            </span>
            <h1 className="mt-6 font-display text-4xl leading-[1] text-slate-950 sm:text-6xl sm:leading-[0.95] lg:text-[5.45rem]">
              <span className="block">Smart Shipping</span>
              <span className="mt-2 block">For Smarter Sellers</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
              Simplify your logistics with an all-in-one shipping platform built to connect your
              store, optimize deliveries, and reduce costs.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <ActionAnchor to="/login" className={primaryButtonClass}>
                Open Auth Page
              </ActionAnchor>
              <Link to="/login" className={secondaryButtonClass}>
                Login
              </Link>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <HeroVisual animationData={animationData} animationError={animationError} />
        </Reveal>
      </div>
    </section>
  );
}

function PlatformsSection() {
  const outerBadges = platformBadges.slice(0, 8);
  const innerBadges = platformBadges.slice(8);
  const getOrbitPosition = (index, total, radius) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;

    return {
      left: `${50 + Math.cos(angle) * radius}%`,
      top: `${50 + Math.sin(angle) * radius}%`,
    };
  };

  return (
    <section className="section-transition mt-24 sm:mt-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Trusted by Leading Platforms"
            title="Seamlessly integrate with 10+ eCommerce platforms and courier services."
            description="A clean connection layer keeps your stores, marketplaces, and logistics partners working from the same shipment picture."
          />
        </Reveal>

        <Reveal delay={0.14}>
          <div className="platform-orbit" aria-label="Supported platforms and courier services">
            <div className="platform-orbit__ring platform-orbit__ring--outer" />
            <div className="platform-orbit__ring platform-orbit__ring--inner" />

            <div className="platform-orbit__rotor platform-orbit__rotor--outer">
              {outerBadges.map((item, index) => (
                <div
                  key={item.label}
                  className="platform-orbit__position"
                  style={getOrbitPosition(index, outerBadges.length, 40)}
                >
                  <span className="platform-orbit__badge">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="platform-orbit__rotor platform-orbit__rotor--inner">
              {innerBadges.map((item, index) => (
                <div
                  key={item.label}
                  className="platform-orbit__position"
                  style={getOrbitPosition(index, innerBadges.length, 25)}
                >
                  <span className="platform-orbit__badge">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function PowerfulFeaturesSection() {
  return (
    <section className="section-transition mt-24 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-[radial-gradient(circle_at_top_left,rgba(255,221,174,0.34),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,251,255,0.88))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[2.7rem] sm:p-8 lg:p-10">
          <Reveal>
            <SectionHeading
              eyebrow="Powerful Features"
              title="Everything you need to streamline your shipping operations and grow your business."
              description="Every card is shaped to support a real operational need, from cleaner order intake to faster delivery follow-up and smarter courier selection."
              align="center"
            />
          </Reveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature, index) => (
              <Reveal key={feature.title} delay={0.05 * index}>
                <MotionArticle
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                  className={`h-full rounded-[1.6rem] border border-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-7 ${feature.shell}`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                    <Icon name={feature.icon} />
                  </span>
                  <h3 className="mt-5 font-display text-2xl text-slate-950">{feature.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{feature.description}</p>
                </MotionArticle>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.14} className="mt-10 flex justify-center">
            <Link to="/login" className={secondaryButtonClass}>
              Estimate Shipping Rate
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function WhatYouGetSection() {
  return (
    <section className="section-transition mt-24 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(212,246,255,0.32)),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:auto,26px_26px,26px_26px] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[2.7rem] sm:p-8 lg:p-10">
          <div className="grid gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:items-start">
            <Reveal>
              <div className="rounded-[1.75rem] border border-white/90 bg-white/85 p-5 shadow-sm sm:rounded-[2.35rem] sm:p-8 lg:p-10">
                <SectionHeading
                  eyebrow="What You Get"
                  title="Everything you need to streamline your shipping operations in one powerful platform."
                  description="The platform is designed to keep operations simple, connected, and easier to scale as order volume grows."
                />
                <ActionAnchor to="/login" className={`${primaryButtonClass} mt-8`}>
                  Open Auth Page
                </ActionAnchor>
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-2">
              {valueCards.map((item, index) => (
                <Reveal key={item.title} delay={0.05 * index}>
                  <MotionArticle
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                    className={`h-full rounded-[1.6rem] border border-white/90 p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:rounded-[2rem] sm:p-7 ${item.shell} ${
                      index === valueCards.length - 1 ? "md:col-span-2" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-900 shadow-sm">
                        <Icon name={item.icon} />
                      </span>
                      <div>
                        <h3 className="font-display text-2xl text-slate-950">{item.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </MotionArticle>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsDashboard() {
  return (
    <div className="rounded-[2.45rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(198,231,255,0.55),rgba(255,221,174,0.4))] p-6 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Analytics dashboard
          </p>
          <h3 className="mt-3 font-display text-3xl text-slate-950">Operational snapshot</h3>
        </div>
        <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm">
          Live
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ["92%", "On-time delivery"],
          ["18%", "Lower RTO drift"],
          ["24/7", "Courier visibility"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-[1.6rem] border border-white/90 bg-white/85 p-4 shadow-sm">
            <p className="font-display text-3xl text-slate-950">{value}</p>
            <p className="mt-2 text-sm text-slate-600">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[1.85rem] border border-white/90 bg-white/78 p-5">
        <div className="flex items-end gap-3">
          {dashboardBars.map((barClass, index) => (
            <div key={`${barClass}-${index}`} className={`flex-1 rounded-t-[1rem] ${barClass}`} />
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#eef8ff] px-4 py-3 text-sm text-slate-600">Delivery performance trends</div>
          <div className="rounded-2xl bg-[#fff8ef] px-4 py-3 text-sm text-slate-600">COD and cost movement</div>
          <div className="rounded-2xl bg-[#effcff] px-4 py-3 text-sm text-slate-600">Customer experience signals</div>
        </div>
      </div>
    </div>
  );
}

function InsightsSection() {
  return (
    <section className="section-transition mt-24 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-[radial-gradient(circle_at_18%_18%,rgba(198,231,255,0.52),transparent_24%),radial-gradient(circle_at_78%_20%,rgba(255,221,174,0.46),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(246,251,255,0.92))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[2.7rem] sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.84fr_1fr] lg:items-center">
            <Reveal>
              <div>
                <SectionHeading
                  eyebrow="Unlock Actionable Insights"
                  title="Make data-driven decisions with real-time shipping intelligence."
                  description="Make data-driven decisions with real-time insights on delivery performance, courier costs, COD collection, RTO trends, and customer satisfaction metrics."
                />

                <div className="mt-8 grid gap-4">
                  {insightCards.map((card, index) => (
                    <Reveal key={card.title} delay={0.05 * index}>
                      <div className="rounded-[1.6rem] border border-white/90 bg-white/88 p-5 shadow-sm sm:rounded-[1.85rem]">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(198,231,255,0.92),rgba(255,221,174,0.82))] text-slate-900">
                            <Icon name={card.icon} />
                          </span>
                          <div>
                            <h3 className="font-display text-2xl text-slate-950">{card.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <ActionAnchor to="/login" className={`${primaryButtonClass} mt-8`}>
                  Open Auth Page
                </ActionAnchor>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <AnalyticsDashboard />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommercePanel() {
  return (
    <div className="rounded-[2rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(212,246,255,0.4),rgba(198,231,255,0.32))] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.08)] sm:rounded-[2.45rem] sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.8rem] border border-white/90 bg-white/88 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Store connections
          </p>
          <div className="mt-4 grid gap-3">
            {["Shopify", "WooCommerce", "Amazon", "Flipkart"].map((label, index) => (
              <div
                key={label}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <Icon
                    name={index === 0 ? "shoppingBag" : index === 1 ? "store" : index === 2 ? "globe" : "package"}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </span>
                <span className="rounded-full bg-[#D4F6FF] px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-700">
                  Synced
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.8rem] border border-white/90 bg-[linear-gradient(135deg,rgba(255,221,174,0.62),rgba(198,231,255,0.58))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Shipment updates
          </p>
          <div className="mt-4 space-y-3">
            {[
              ["AWB linked", "Store order updated"],
              ["Manifest ready", "Courier allocation completed"],
              ["Tracking live", "Customer timeline synced"],
            ].map(([title, detail], index) => (
              <div key={title} className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Icon name={index === 0 ? "package" : index === 1 ? "checkCircle" : "bell"} className="h-4 w-4" />
                  <span>{title}</span>
                </p>
                <p className="mt-1 text-sm text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.8rem] border border-white/90 bg-white/80 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {["Orders received", "AWB sent back", "Tracking synced"].map((item, index) => (
            <div key={item} className="rounded-2xl bg-[linear-gradient(135deg,rgba(198,231,255,0.36),rgba(255,255,255,0.95))] px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Step 0{index + 1}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EcommerceSection() {
  return (
    <section className="section-transition mt-24 sm:mt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(255,221,174,0.24)),linear-gradient(135deg,rgba(255,255,255,0.2),rgba(198,231,255,0.18))] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[2.7rem] sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1fr] lg:items-center">
            <Reveal>
              <div>
                <SectionHeading
                  eyebrow="eCommerce Integration"
                  title="Connect Your Stores and Marketplaces"
                  description="Connect with Shopify, WooCommerce, Magento, BigCommerce, Wix and more. Automatically sync orders, update AWB numbers, and track shipments in real-time."
                />

                <div className="mt-8 grid gap-4">
                  {ecommerceCards.map((item, index) => (
                    <Reveal key={item.title} delay={0.05 * index}>
                      <div className="rounded-[1.6rem] border border-white/90 bg-white/88 p-5 shadow-sm sm:rounded-[1.85rem]">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(255,221,174,0.88),rgba(198,231,255,0.88))] text-slate-900">
                            <Icon name={item.icon} />
                          </span>
                          <div>
                            <h3 className="font-display text-2xl text-slate-950">{item.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>

                <ActionAnchor to="/login" className={`${primaryButtonClass} mt-8`}>
                  Open Auth Page
                </ActionAnchor>
              </div>
            </Reveal>

            <Reveal delay={0.14}>
              <CommercePanel />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function DolphinLandingPage() {
  const [animationData, setAnimationData] = useState(null);
  const [animationError, setAnimationError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadAnimation() {
      try {
        const response = await fetch(deliveryAnimationUrl);

        if (!response.ok) {
          throw new Error("Failed to load animation");
        }

        const data = await response.json();

        if (isMounted) {
          setAnimationData(data);
          setAnimationError(false);
        }
      } catch {
        if (isMounted) {
          setAnimationError(true);
        }
      }
    }

    loadAnimation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main id="home" className="pb-16">
      <HeroSection animationData={animationData} animationError={animationError} />
      <PlatformsSection />
      <PowerfulFeaturesSection />
      <WhatYouGetSection />
      <InsightsSection />
      <EcommerceSection />
    </main>
  );
}

export default DolphinLandingPage;
