import { Button, Container, TextField, Typography } from "@mui/material";
import {
  calculatorHighlights,
  shippingFields,
} from "../../utils/landingContent";
import { openClientApp } from "../../utils/appLinks";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, SectionHeader } from "./LandingPrimitives";

export default function CalculatorSection({ estimate, shippingForm, onFieldChange }) {
  return (
    <section id="calculator" className="py-14 sm:py-18">
      <Container maxWidth="xl">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <MotionDiv {...fadeUp} className="hero-panel rounded-[28px] p-5 sm:rounded-[34px] sm:p-8">
            <SectionHeader
              eyebrow="Shipping Calculator"
              title="Calculate Shipping Costs Instantly"
              description="Estimate shipping costs before creating a shipment. Compare courier pricing based on package weight, pickup location, and delivery destination."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {calculatorHighlights.map((item, index) => (
                <MotionCard
                  key={item.label}
                  delay={index * 0.05}
                  className="surface-panel rounded-[24px] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <LiteralVisual title={item.title} compact />
                    <Typography
                      className="text-right text-sm font-semibold uppercase tracking-[0.18em]"
                      sx={{ color: "#7a6e76" }}
                    >
                      {item.label}
                    </Typography>
                  </div>
                </MotionCard>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              {shippingFields.map((field) => (
                <TextField
                  key={field.key}
                  fullWidth
                  variant="outlined"
                  value={shippingForm[field.key]}
                  onChange={onFieldChange(field.key)}
                  label={field.label}
                  placeholder={field.placeholder}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "18px",
                      backgroundColor: "rgba(255,255,255,0.72)",
                    },
                  }}
                />
              ))}
            </div>

            <div className="mt-6">
              <Button
                onClick={openClientApp}
                variant="contained"
                sx={{
                  borderRadius: "999px",
                  px: 3,
                  py: 1.25,
                  backgroundColor: "#171310",
                  "&:hover": { backgroundColor: "#30262e" },
                }}
              >
                Continue In Client App
              </Button>
            </div>
          </MotionDiv>

          <MotionDiv {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
            <div className="dark-panel relative rounded-[28px] p-5 text-white sm:rounded-[34px] sm:p-8">
              <div className="calculator-pulse" />
              <Typography className="text-sm uppercase tracking-[0.25em] text-[#f1c5d1]">
                Live estimate
              </Typography>
              <Typography variant="h3" className="brand-heading-light mt-4 text-3xl sm:text-4xl">
                Cost, zone, and delivery timing in one glance
              </Typography>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <MotionCard delay={0.04} className="rounded-[26px] border border-white/10 bg-white/8 p-5">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/58">
                    Estimated Cost
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl">
                    {estimate.estimatedCost ? `Rs ${estimate.estimatedCost}` : "Rs --"}
                  </Typography>
                </MotionCard>
                <MotionCard delay={0.08} className="rounded-[26px] border border-white/10 bg-white/8 p-5">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/58">
                    Shipping Zone
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl">
                    {estimate.zoneLabel}
                  </Typography>
                </MotionCard>
                <MotionCard delay={0.12} className="rounded-[26px] border border-white/10 bg-white/8 p-5">
                  <Typography className="text-xs uppercase tracking-[0.2em] text-white/58">
                    Expected Delivery
                  </Typography>
                  <Typography variant="h4" className="mt-4 text-3xl">
                    {estimate.eta}
                  </Typography>
                </MotionCard>
              </div>

              <div className="mt-8 rounded-[28px] border border-white/10 bg-white/8 p-5">
                <Typography className="text-sm leading-8 text-white/72">
                  Shipping rates depend on package weight, pickup pincode, delivery pincode, and
                  courier lane coverage. This estimate gives your team a fast pricing view before
                  the shipment moves to booking.
                </Typography>
              </div>
            </div>
          </MotionDiv>
        </div>
      </Container>
    </section>
  );
}
