import { useMemo, useState } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CalculatorSection from "../components/landing/CalculatorSection";
import CommerceSections from "../components/landing/CommerceSections";
import HeroSection from "../components/landing/HeroSection";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import { FloatingBackdrop, MotionProvider } from "../components/landing/LandingPrimitives";
import OperationsSections from "../components/landing/OperationsSections";
import SocialSections from "../components/landing/SocialSections";
import { footerGroups, footerMeta, navigationLinks } from "../utils/landingContent";
import theme from "../utils/muiTheme";
import { calculateShippingEstimate } from "../utils/shippingCalculator";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    packageWeight: "",
    pickupPincode: "",
    deliveryPincode: "",
  });

  const estimate = useMemo(() => calculateShippingEstimate(shippingForm), [shippingForm]);

  const handleFieldChange = (key) => (event) => {
    setShippingForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MotionProvider>
        <div className="page-shell min-h-screen">
          <FloatingBackdrop />
          <LandingHeader
            menuOpen={menuOpen}
            navigationLinks={navigationLinks}
            onToggleMenu={() => setMenuOpen((open) => !open)}
            onCloseMenu={() => setMenuOpen(false)}
          />

          <main id="top">
            <HeroSection />
            <CommerceSections />
            <OperationsSections />
            <CalculatorSection
              estimate={estimate}
              shippingForm={shippingForm}
              onFieldChange={handleFieldChange}
            />
            <SocialSections />
          </main>

          <LandingFooter footerGroups={footerGroups} footerMeta={footerMeta} />
        </div>
      </MotionProvider>
    </ThemeProvider>
  );
}

export default LandingPage;
