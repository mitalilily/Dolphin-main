import { Box, Chip, Container, Typography } from "@mui/material";
import {
  dashboardCapabilities,
  featureList,
  trackingStages,
  workflowSteps,
} from "../../utils/landingContent";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, SectionHeader } from "./LandingPrimitives";

const analyticsPulse = [
  {
    label: "On-time deliveries",
    value: "96%",
    width: "96%",
    fill: "linear-gradient(90deg, #56c0a5, #9fe2cf)",
  },
  {
    label: "Auto-assigned lanes",
    value: "84%",
    width: "84%",
    fill: "linear-gradient(90deg, #f1d1bb, #d97943)",
  },
  {
    label: "Label turnaround",
    value: "12 min",
    width: "72%",
    fill: "linear-gradient(90deg, #ffffff, #f1d1bb)",
  },
];

const queueItems = [
  "3 pickups waiting for approval",
  "COD reconciliation synced 6 minutes ago",
  "North zone switched to the fastest courier lane",
];

const commandMetrics = [
  { value: "312", label: "Active shipments" },
  { value: "18", label: "Orders awaiting pickup" },
  { value: "4.8/5", label: "Courier health score" },
];

export default function OperationsSections() {
  return (
    <>
      <section id="features" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Features"
              title="Everything You Need to Manage Shipping"
              description="From rate comparison to tracking and COD visibility, every step is designed to help shipping teams move faster with fewer manual tasks."
              align="center"
            />
          </MotionDiv>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureList.map((feature, index) => {
              const darkCard = index === 1 || index === 4;

              return (
                <MotionCard
                  key={feature.title}
                  delay={index * 0.05}
                  className={`${darkCard ? "dark-panel text-white" : "feature-card surface-panel"} rounded-[30px] p-6`}
                >
                  {!darkCard ? (
                    <>
                      <div className="feature-orb orb-primary" />
                      <div className="feature-orb orb-secondary" />
                    </>
                  ) : null}

                  <div className="flex items-start justify-between gap-4">
                    <LiteralVisual title={feature.title} compact />
                    <Chip
                      label={`0${index + 1}`}
                      sx={{
                        borderRadius: "999px",
                        backgroundColor: darkCard ? "rgba(255,255,255,0.12)" : "#fff3dc",
                        color: darkCard ? "#ffffff" : "#7c5d2f",
                        fontWeight: 700,
                      }}
                    />
                  </div>

                  <Typography
                    variant="h5"
                    className={`mt-6 text-2xl ${darkCard ? "brand-heading-light" : ""}`}
                  >
                    {feature.title}
                  </Typography>
                  <Typography
                    className={`mt-3 text-sm leading-7 sm:text-base ${darkCard ? "text-white/74" : ""}`}
                    sx={darkCard ? undefined : { color: "#615961" }}
                  >
                    {feature.description}
                  </Typography>
                </MotionCard>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="How It Works"
              title="Ship in Four Simple Steps"
              description="Your team can move from order intake to delivery tracking without switching tabs or rebuilding the process for every courier."
              align="center"
            />
          </MotionDiv>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {workflowSteps.map((step, index) => (
              <MotionCard
                key={step.title}
                delay={index * 0.06}
                className="surface-panel rounded-[28px] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <Chip
                    label={step.step}
                    sx={{
                      borderRadius: "999px",
                      backgroundColor: "#fff1f5",
                      color: "#9b3150",
                      fontWeight: 700,
                    }}
                  />
                  <LiteralVisual title={step.title} compact />
                </div>
                <Typography variant="h6" className="mt-5 text-xl">
                  {step.title}
                </Typography>
                <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                  {step.description}
                </Typography>
              </MotionCard>
            ))}
          </div>

          <div className="flowchart-grid mt-10 lg:grid-cols-[1fr_80px_1fr_80px_1fr_80px_1fr]">
            {workflowSteps.map((step, index) => (
              <Box key={step.title} className="contents">
                <MotionDiv
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="surface-panel rounded-[24px] p-4"
                >
                  <Typography
                    className="text-sm font-semibold uppercase tracking-[0.18em]"
                    sx={{ color: "#9b3150" }}
                  >
                    {step.step}
                  </Typography>
                  <Typography variant="h6" className="mt-3 text-lg">
                    {step.title}
                  </Typography>
                </MotionDiv>
                {index < workflowSteps.length - 1 ? (
                  <>
                    <div className="hidden self-center lg:block">
                      <div className="flow-line" />
                    </div>
                    <div className="lg:hidden">
                      <div className="flow-line" />
                    </div>
                  </>
                ) : null}
              </Box>
            ))}
          </div>
        </Container>
      </section>

      <section id="analytics" className="py-14 sm:py-18">
        <Container maxWidth="xl">
          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
            <MotionDiv {...fadeUp}>
              <div className="dark-panel rounded-[28px] p-5 text-white sm:rounded-[34px] sm:p-8">
                <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                    <Typography className="text-sm uppercase tracking-[0.24em] text-[#f1d1bb]">
                      Operations pulse
                    </Typography>
                    <Typography variant="h3" className="brand-heading-light mt-4 text-3xl sm:text-4xl">
                      A dashboard feel before the user even enters the app.
                    </Typography>

                    <div className="mt-6 grid gap-4">
                      {analyticsPulse.map((item, index) => (
                        <div key={item.label} className="rounded-[22px] border border-white/8 bg-white/6 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <Typography className="text-sm text-white/72">
                              {item.label}
                            </Typography>
                            <Typography className="text-sm font-semibold text-white">
                              {item.value}
                            </Typography>
                          </div>
                          <div className="metric-rail mt-3 bg-white/10">
                            <MotionDiv
                              initial={{ width: 0 }}
                              whileInView={{ width: item.width }}
                              viewport={{ once: true, amount: 0.3 }}
                              transition={{ duration: 0.85, delay: index * 0.08 + 0.12 }}
                              className="metric-fill"
                              style={{ background: item.fill }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[28px] border border-white/10 bg-white/8 p-5">
                      <Typography className="text-xs uppercase tracking-[0.22em] text-white/45">
                        Live queue
                      </Typography>
                      <div className="mt-5 grid gap-3">
                        {queueItems.map((item, index) => (
                          <MotionDiv
                            key={item}
                            initial={{ opacity: 0, x: 18 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.25 }}
                            transition={{ duration: 0.45, delay: index * 0.06 }}
                            className="rounded-[22px] border border-white/8 bg-white/6 px-4 py-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[#56c0a5]" />
                              <Typography className="text-sm leading-7 text-white/72">
                                {item}
                              </Typography>
                            </div>
                          </MotionDiv>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                      {commandMetrics.map((item, index) => (
                        <MotionCard
                          key={item.label}
                          delay={0.16 + index * 0.05}
                          className="rounded-[24px] border border-white/10 bg-white/8 p-4"
                        >
                          <Typography className="text-xs uppercase tracking-[0.2em] text-white/45">
                            {item.label}
                          </Typography>
                          <Typography variant="h4" className="mt-3 text-3xl text-white">
                            {item.value}
                          </Typography>
                        </MotionCard>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <SectionHeader
                eyebrow="Analytics"
                title="Complete Control Over Your Shipments"
                description="Get full visibility into your logistics operations with powerful analytics and shipment tracking tools. Monitor courier performance, delivery success rates, and shipping costs in real time so you can optimize your fulfillment strategy."
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {dashboardCapabilities.map((item, index) => (
                  <MotionCard
                    key={item.title}
                    delay={index * 0.05}
                    className="surface-panel rounded-[26px] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <LiteralVisual title={item.title} compact />
                      <Chip
                        label={index === 2 ? "Live savings" : "Live view"}
                        sx={{
                          borderRadius: "999px",
                          backgroundColor: "#f5ebf0",
                          color: "#8b415b",
                          fontWeight: 700,
                        }}
                      />
                    </div>
                    <Typography variant="h6" className="mt-5 text-xl">
                      {item.title}
                    </Typography>
                    <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                      {item.description}
                    </Typography>
                  </MotionCard>
                ))}
              </div>
            </MotionDiv>
          </div>
        </Container>
      </section>

      <section id="tracking" className="py-14 sm:py-18">
        <Container maxWidth="lg">
          <MotionDiv {...fadeUp}>
            <SectionHeader
              eyebrow="Order Tracking"
              title="Track every stage with one clean timeline"
              description="As the page scrolls, each milestone steps into view so buyers and operations teams can understand exactly where the shipment stands."
              align="center"
            />
          </MotionDiv>

          <div className="relative mt-12 grid gap-6 sm:gap-8">
            <div className="absolute left-[18px] top-0 h-full w-[2px] bg-gradient-to-b from-[#9b3150] via-[#56c0a5] to-[#9b3150] md:hidden" />
            <div className="absolute left-1/2 top-0 hidden h-full w-[2px] -translate-x-1/2 bg-gradient-to-b from-[#9b3150] via-[#56c0a5] to-[#9b3150] md:block" />

            {trackingStages.map((stage, index) => {
              const onLeft = index % 2 === 0;

              return (
                <div
                  key={stage.title}
                  className="relative grid items-center gap-5 pl-10 md:grid-cols-[1fr_40px_1fr] md:pl-0"
                >
                  <div className="absolute left-[10px] top-8 z-10 h-4 w-4 rounded-full border-4 border-[#f7efe6] bg-[#56c0a5] shadow-[0_0_0_6px_rgba(86,192,165,0.12)] md:hidden" />
                  <div
                    className={`${onLeft ? "md:col-start-1" : "md:col-start-3 md:order-3"}`}
                  >
                    <MotionDiv
                      initial={{ opacity: 0, x: onLeft ? -48 : 48, scale: 0.92 }}
                      whileInView={{ opacity: 1, x: 0, scale: 1 }}
                      viewport={{ once: true, amount: 0.35 }}
                      transition={{
                        duration: 0.55,
                        delay: index * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="surface-panel rounded-[24px] p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <LiteralVisual title="Real-Time Shipment Tracking" compact />
                        <Chip
                          label={stage.title}
                          sx={{
                            borderRadius: "999px",
                            backgroundColor: "#eef8f4",
                            color: "#2e826e",
                            fontWeight: 700,
                          }}
                        />
                      </div>
                      <Typography variant="h6" className="mt-5 text-xl">
                        {stage.title}
                      </Typography>
                      <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                        {stage.description}
                      </Typography>
                    </MotionDiv>
                  </div>

                  <div className="relative hidden h-full items-center justify-center md:flex">
                    <MotionDiv
                      initial={{ scale: 0.7, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.4, delay: index * 0.05 + 0.12 }}
                      className="z-10 h-4 w-4 rounded-full border-4 border-[#f7efe6] bg-[#56c0a5] shadow-[0_0_0_6px_rgba(86,192,165,0.12)]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
