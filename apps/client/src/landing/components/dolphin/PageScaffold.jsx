import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { Link } from "react-router-dom";
import Icon from "./Icons";
import { Reveal } from "./primitives";

const MotionArticle = motion.article;
const MotionImg = motion.img;

function ActionButton({ action, primary = false }) {
  if (!action) {
    return null;
  }

  const className = primary
    ? "inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD9A6_100%)] px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-[0_16px_34px_rgba(130,194,255,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_rgba(130,194,255,0.32)] sm:w-auto"
    : "inline-flex w-full items-center justify-center rounded-full border border-sky-200 bg-white/85 px-6 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white sm:w-auto";

  if (action.href) {
    return (
      <a className={className} href={action.href}>
        {action.label}
      </a>
    );
  }

  return (
    <Link className={className} to={action.to}>
      {action.label}
    </Link>
  );
}

function DefaultHeroVisual({ visualTitle }) {
  return (
    <div className="relative rounded-[2rem] border border-white/75 bg-white/[0.84] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Dolphin Enterprises
          </p>
          <h2 className="mt-2 font-display text-2xl text-slate-900">{visualTitle}</h2>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
          Ready to extend
        </span>
      </div>
      <div className="mt-6 grid gap-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.5rem] bg-sky-100 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-sky-700">View</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Structured</p>
          </div>
          <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Pages</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Multi-route</p>
          </div>
          <div className="rounded-[1.5rem] bg-amber-100 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-amber-700">Motion</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Framer-powered</p>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(198,231,255,0.45),rgba(255,255,255,0.95))] p-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Page canvas</span>
            <span>Placeholder visual</span>
          </div>
          <div className="mt-4 grid gap-3">
            {["Overview block", "Insight module", "Action panel"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon name={index === 0 ? "layers" : index === 1 ? "chart" : "spark"} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item}</p>
                  <p className="text-xs text-slate-500">Reusable layout component</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMediaVisual({ visualAnimationData, visualImage, visualAlt, visualTitle }) {
  if (!visualAnimationData && !visualImage) {
    return <DefaultHeroVisual visualTitle={visualTitle} />;
  }

  return (
    <div className="relative flex min-h-[18rem] items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/75 bg-white/[0.58] p-4 shadow-sm sm:min-h-[26rem] sm:rounded-[2rem] sm:p-5 lg:min-h-[30rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,221,174,0.42),transparent_26%),radial-gradient(circle_at_78%_22%,rgba(198,231,255,0.48),transparent_24%)]" />
      {visualAnimationData ? (
        <Lottie
          animationData={visualAnimationData}
          loop
          autoplay
          rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
          className="relative z-10 mx-auto w-full max-w-[22rem] sm:max-w-[30rem]"
        />
      ) : (
        <MotionImg
          src={visualImage}
          alt={visualAlt || visualTitle}
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative z-10 mx-auto w-full max-w-[16rem] object-contain drop-shadow-[0_22px_32px_rgba(15,23,42,0.16)] sm:max-w-[23rem]"
        />
      )}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  stats = [],
  visualTitle,
  visualLabel = "Page preview",
  visualAnimationData,
  visualImage,
  visualAlt,
}) {
  return (
    <section className="section-transition pt-8 sm:pt-10 lg:pt-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:px-8">
        <Reveal delay={0.04}>
          <div className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-sky-200/80 bg-white/85 px-4 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
              {eyebrow}
            </span>
            <h1 className="mt-6 font-display text-3xl leading-[1.08] text-slate-900 sm:text-5xl lg:text-[4rem]">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{description}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ActionButton action={primaryAction} primary />
              <ActionButton action={secondaryAction} />
            </div>

            {stats.length ? (
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((stat) => (
                  <MotionArticle
                    key={stat.label}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ duration: 0.25 }}
                    className="surface-card rounded-[1.75rem] p-5"
                  >
                    <p className="font-display text-2xl font-semibold text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{stat.label}</p>
                  </MotionArticle>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="hero-visual relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(198,231,255,0.5),rgba(255,221,174,0.38))] p-4 shadow-[0_26px_70px_rgba(15,23,42,0.08)] sm:rounded-[2.5rem] sm:p-6 lg:p-7">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:right-6 sm:top-6 sm:px-4 sm:text-xs">
              {visualLabel}
            </div>
            <HeroMediaVisual
              visualAnimationData={visualAnimationData}
              visualImage={visualImage}
              visualAlt={visualAlt}
              visualTitle={visualTitle}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function StatGrid({ items, dark = false }) {
  const columnsClass =
    items.length >= 4
      ? "md:grid-cols-2 xl:grid-cols-4"
      : items.length === 3
        ? "md:grid-cols-2 xl:grid-cols-3"
        : items.length === 2
          ? "md:grid-cols-2"
          : "";

  return (
    <div className={`grid gap-4 ${columnsClass}`}>
      {items.map((item, index) => (
        <Reveal key={item.label} delay={0.05 * index}>
          <MotionArticle
            whileHover={{ y: -6, scale: 1.01 }}
            transition={{ duration: 0.25 }}
            className={
              dark
                ? "rounded-[1.9rem] border border-white/10 bg-white/[0.08] p-6 backdrop-blur-sm"
                : "surface-card rounded-[1.9rem] p-6"
            }
          >
            <p className={`font-display text-4xl ${dark ? "text-white" : "text-slate-900"}`}>{item.value}</p>
            <h3 className={`mt-3 text-lg font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{item.label}</h3>
            {item.note ? (
              <p className={`mt-3 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                {item.note}
              </p>
            ) : null}
          </MotionArticle>
        </Reveal>
      ))}
    </div>
  );
}
