import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import footerImage from "../../assets/footer-welcome-transparent.png";
import logoImage from "../../assets/dolphin-logo-transparent.png";
import Icon from "./Icons";
import { companyProfile, siteNavigation } from "./siteData";

const MotionNav = motion.nav;

const productLinks = [
  { label: "Weight Calculator", to: "/volumetric-weight-calculator", icon: "calculator" },
];

const supportHighlights = [
  "Order Verification",
  "Next Day Delivery",
  "Dedicated Shipping Advisors",
  "Multi-Carrier Access",
  "RTO Reduction",
  "Shipment Security",
];

const legalItems = [
  {
    title: "Refund & Cancellation Policy",
    description: "Understand our refund and cancellation process clearly.",
  },
  {
    title: "Privacy Policy",
    description: "Learn how we handle and protect your personal data.",
  },
  {
    title: "Terms of Service",
    description: "Read the rules, guidelines, and acceptable usage.",
  },
];

function DesktopNavLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          "rounded-full px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] text-slate-900 shadow-sm"
            : "text-slate-600 hover:bg-white hover:text-slate-950",
        ].join(" ")
      }
    >
      {item.label}
    </NavLink>
  );
}

function MobileNavLink({ item, onClose }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [
          "rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] text-slate-900"
            : "bg-white text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
      onClick={onClose}
    >
      {item.label}
    </NavLink>
  );
}

function FooterShowcase() {
  return (
    <img
      src={footerImage}
      alt="Dolphin Enterprises footer preview"
      className="mx-auto w-full max-w-[18rem] object-contain sm:max-w-[22rem] lg:ml-auto lg:max-h-[22rem] lg:max-w-[23rem]"
    />
  );
}

export function SiteHeader({ menuOpen, onToggleMenu, onCloseMenu }) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-[#FBFBFB]/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
        <Link to="/" className="shrink-0">
          <img src={logoImage} alt={companyProfile.name} className="h-12 w-auto object-contain sm:h-16" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex xl:gap-3">
          {siteNavigation.map((item) => (
            <DesktopNavLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/login"
            className="hidden rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-[0_16px_32px_rgba(130,194,255,0.24)] transition hover:-translate-y-0.5 lg:inline-flex"
          >
            Login
          </Link>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 lg:hidden"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={onToggleMenu}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {menuOpen ? (
          <MotionNav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-slate-200 bg-[#FBFBFB] lg:hidden"
          >
            <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:px-6">
              {siteNavigation.map((item) => (
                <MobileNavLink key={item.to} item={item} onClose={onCloseMenu} />
              ))}
              <Link
                to="/login"
                onClick={onCloseMenu}
                className="inline-flex justify-center rounded-2xl bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Login
              </Link>
            </div>
          </MotionNav>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 overflow-hidden bg-[linear-gradient(180deg,#fff6ea_0%,#fffdf8_28%,#eef9ff_100%)]">
      <div className="relative border-t border-white/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(255,208,164,0.42),transparent_20%),radial-gradient(circle_at_82%_22%,rgba(198,231,255,0.4),transparent_18%),radial-gradient(circle_at_50%_100%,rgba(213,199,255,0.28),transparent_28%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-3xl leading-tight text-slate-950 sm:text-5xl">
              Ready to ship smarter?
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
              Get started today and transform your delivery experience with cleaner logistics,
              better visibility, and faster shipping decisions.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-[0_16px_32px_rgba(130,194,255,0.24)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                Open Auth Page
              </Link>
            </div>
          </div>

          <div className="relative z-10">
            <FooterShowcase />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr_0.95fr_0.95fr]">
          <div>
            <img src={logoImage} alt={companyProfile.name} className="h-16 w-auto object-contain" />
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-600">
              Your trusted partner in reliable, fast, and affordable delivery solutions. Seamless
              logistics to power your business growth.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <a href={`mailto:${companyProfile.email}`} className="transition hover:text-slate-950">
                Email: {companyProfile.email}
              </a>
              <a href={`tel:${companyProfile.mobile}`} className="transition hover:text-slate-950">
                Mobile: {companyProfile.mobile}
              </a>
              <a href={`tel:${companyProfile.phone.replace(/-/g, "")}`} className="transition hover:text-slate-950">
                Phone: {companyProfile.phone}
              </a>
              <p>{companyProfile.address}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Icon name="spark" className="h-4 w-4" />
              <span>Product</span>
            </div>
            <div className="mt-5 grid gap-4">
              {productLinks.map((item) => (
                <NavLink key={item.to} className="py-1.5 text-sm text-slate-600 transition hover:text-slate-950" to={item.to}>
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Icon name={item.icon} className="h-4 w-4" />
                    <span>{item.label}</span>
                  </p>
                </NavLink>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Icon name="checkCircle" className="h-4 w-4" />
              <span>Features</span>
            </div>
            <ul className="mt-5 grid gap-3">
              {supportHighlights.map((item, index) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8FD8FF_0%,#FFD8A8_100%)] text-slate-900">
                    <Icon
                      name={
                        index === 0
                          ? "shield"
                          : index === 1
                            ? "bolt"
                            : index === 2
                              ? "user"
                              : index === 3
                                ? "truck"
                                : index === 4
                                  ? "refresh"
                                  : "lock"
                      }
                      className="h-4 w-4"
                    />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Icon name="lock" className="h-4 w-4" />
              <span>Legal</span>
            </div>
            <div className="mt-5 grid gap-4">
              {legalItems.map((item) => (
                <div key={item.title} className="text-sm">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/80 pt-6 text-sm text-slate-500">
          © 2026 {companyProfile.name}. Seamless logistics to power smarter shipping operations.
        </div>
      </div>
    </footer>
  );
}
