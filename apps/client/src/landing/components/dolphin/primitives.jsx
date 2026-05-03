import { motion } from "framer-motion";

const MotionDiv = motion.div;

const reveal = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function Reveal({ children, className = "", delay = 0 }) {
  return (
    <MotionDiv
      className={className}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={reveal}
    >
      {children}
    </MotionDiv>
  );
}

export function SectionHeading({ eyebrow, title, description, align = "left", tone = "dark" }) {
  const alignment = align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl";
  const eyebrowTone =
    tone === "light"
      ? "border-white/15 bg-white/10 text-sky-200"
      : "border-sky-200/80 bg-white/80 text-sky-700";
  const titleTone = tone === "light" ? "text-white" : "text-slate-900";
  const descriptionTone = tone === "light" ? "text-slate-300" : "text-slate-600";

  return (
    <div className={alignment}>
      <span
        className={`inline-flex items-center rounded-full border px-4 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] shadow-sm ${eyebrowTone}`}
      >
        {eyebrow}
      </span>
      <h2 className={`mt-5 font-display text-3xl leading-tight sm:text-4xl lg:text-[2.75rem] ${titleTone}`}>
        {title}
      </h2>
      <p className={`mt-4 text-base leading-7 sm:text-lg ${descriptionTone}`}>{description}</p>
    </div>
  );
}

export function MetricBars() {
  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <span>Operational visibility</span>
        <span>Live snapshot</span>
      </div>
      {[72, 88, 64].map((value, index) => (
        <div key={value} className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{["Order sync", "Dispatch readiness", "Delivery follow-up"][index]}</span>
            <span>{value}%</span>
          </div>
          <div className="metric-track h-2.5">
            <div
              className={`h-full ${
                index === 0 ? "metric-fill" : index === 1 ? "metric-fill-accent" : "metric-fill-soft"
              }`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ModulePreview({ title }) {
  return (
    <div className="grid-pattern rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(212,246,255,0.52))] p-4 shadow-inner">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Preview</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold text-sky-700">
          Placeholder
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <div className="h-3 rounded-full bg-slate-200/80" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-20 rounded-2xl bg-white/80" />
          <div className="h-20 rounded-2xl bg-sky-100/80" />
          <div className="h-20 rounded-2xl bg-amber-100/80" />
        </div>
        <div className="grid gap-2">
          <div className="h-2 rounded-full bg-slate-200/80" />
          <div className="h-2 w-4/5 rounded-full bg-slate-200/80" />
          <div className="h-2 w-3/5 rounded-full bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}

export function InsightPreview() {
  return (
    <div className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-white/85 p-4 shadow-sm">
      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-1 h-16 rounded-2xl bg-sky-100" />
        <div className="col-span-1 h-24 rounded-2xl bg-sky-200" />
        <div className="col-span-1 h-20 rounded-2xl bg-amber-200" />
        <div className="col-span-1 h-28 rounded-2xl bg-sky-300" />
        <div className="col-span-1 h-14 rounded-2xl bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-200/80" />
        <div className="h-2 w-4/5 rounded-full bg-slate-200/80" />
      </div>
    </div>
  );
}

export function Field({ label, name, type = "text", value, onChange, placeholder, postfix }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="relative">
        <input
          className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100 ${
            postfix ? "pr-16" : ""
          }`}
          name={name}
          type={type}
          min={type === "number" ? "0" : undefined}
          step={type === "number" ? "0.1" : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        {postfix ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
            {postfix}
          </span>
        ) : null}
      </div>
    </label>
  );
}

export function SelectField({ label, name, value, onChange, options }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <select
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        name={name}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
