import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteFooter, SiteHeader } from "./SiteChrome";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="site-shell min-h-screen bg-transparent text-slate-900">
      <ScrollToTop />
      <SiteHeader
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((current) => !current)}
        onCloseMenu={() => setMenuOpen(false)}
      />
      <Outlet />
      <SiteFooter />
    </div>
  );
}

export default MainLayout;
