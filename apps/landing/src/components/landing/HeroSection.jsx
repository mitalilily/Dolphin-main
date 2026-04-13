import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { Button, Chip, Container, Typography } from "@mui/material";
import {
  heroContent,
  heroHighlights,
  heroQuickTools,
} from "../../utils/landingContent";
import {
  launchDestinations,
  openAdminPortal,
  openAuthPortal,
  openClientApp,
} from "../../utils/appLinks";
import { fadeUp, LiteralVisual, MotionCard, MotionDiv, ToolIcon } from "./LandingPrimitives";

export default function HeroSection() {
  return (
    <section className="pt-8 pb-14 sm:pt-12 sm:pb-20">
      <Container maxWidth="xl">
        <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
          <MotionDiv {...fadeUp} className="hero-panel rounded-[28px] p-5 sm:rounded-[34px] sm:p-8 lg:p-10">
            <div className="pill-row">
              <span>Merchant login</span>
              <span>Client workspace</span>
              <span>Admin control</span>
            </div>

            <Typography
              variant="h1"
              className="brand-heading mt-6 max-w-4xl text-4xl leading-[1.02] sm:text-6xl lg:text-[4.8rem]"
            >
              {heroContent.headline}
            </Typography>

            <Typography
              className="mt-6 max-w-2xl text-base leading-8 sm:text-lg"
              sx={{ color: "#5d5861" }}
            >
              {heroContent.subheading}
            </Typography>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={openAuthPortal}
                variant="contained"
                endIcon={<EastRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 3.1,
                  py: 1.35,
                  backgroundColor: "#171310",
                  "&:hover": { backgroundColor: "#30262e" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.primaryCta}
              </Button>
              <Button
                onClick={openClientApp}
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 3.1,
                  py: 1.35,
                  borderColor: "rgba(217, 121, 67, 0.32)",
                  color: "#181318",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.secondaryCta}
              </Button>
              <Button
                onClick={openAdminPortal}
                variant="text"
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  px: 1,
                  color: "#6d6157",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {heroContent.tertiaryCta}
              </Button>
            </div>

            <Typography className="mt-6 text-sm sm:text-base" sx={{ color: "#6a5f67" }}>
              {heroContent.trustLine}
            </Typography>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {launchDestinations.map((item, index) => (
                <MotionCard
                  key={item.label}
                  delay={index * 0.05}
                  className="launcher-tile p-4"
                >
                  <Typography
                    className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                    sx={{ color: "#D97943" }}
                  >
                    {item.label}
                  </Typography>
                  <Typography className="mt-3 text-sm leading-7" sx={{ color: "#625b63" }}>
                    {item.description}
                  </Typography>
                </MotionCard>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {heroQuickTools.map((tool, index) => (
                <MotionCard
                  key={tool.title}
                  delay={index * 0.06}
                  className="tool-card surface-panel rounded-[26px] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f8e8db] text-[#D97943]">
                      <ToolIcon icon={tool.icon} size={24} />
                    </div>
                    <Chip
                      label={tool.metric}
                      sx={{
                        borderRadius: "999px",
                        backgroundColor: "#fff4df",
                        color: "#73552f",
                        fontWeight: 700,
                      }}
                    />
                  </div>
                  <Typography variant="h6" className="mt-4 text-xl">
                    {tool.title}
                  </Typography>
                  <Typography className="mt-2 text-sm leading-7" sx={{ color: "#625b63" }}>
                    {tool.description}
                  </Typography>
                </MotionCard>
              ))}
            </div>
          </MotionDiv>

          <MotionDiv
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            className="hero-panel rounded-[28px] p-4 sm:rounded-[34px] sm:p-6"
          >
            <div className="hero-stage p-4 sm:p-5">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-[1.05fr_0.95fr]">
                  <div className="surface-panel rounded-[26px] p-5">
                    <Typography
                      className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                      sx={{ color: "#D97943" }}
                    >
                      Main link experience
                    </Typography>
                    <Typography
                      variant="h3"
                      className="brand-heading mt-4 text-3xl sm:text-[2.6rem]"
                    >
                      One polished front door.
                    </Typography>
                    <Typography className="mt-4 text-sm leading-7" sx={{ color: "#625b63" }}>
                      Share one public URL, then send merchants, teams, and admins into the right
                      product surface in a new tab.
                    </Typography>
                  </div>

                  <div className="surface-panel rounded-[26px] p-5">
                    <Typography
                      className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
                      sx={{ color: "#7b3b52" }}
                    >
                      Launch map
                    </Typography>
                    <div className="mt-4 grid gap-3">
                      {launchDestinations.map((item) => (
                        <div key={item.label} className="hero-stat px-4 py-3">
                          <Typography variant="h6" className="text-base">
                            {item.label}
                          </Typography>
                          <Typography className="mt-1 text-sm" sx={{ color: "#6b6068" }}>
                            {item.url.replace("https://", "")}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {heroHighlights.map((item, index) => (
                    <MotionCard
                      key={item.label}
                      delay={0.12 + index * 0.05}
                      className="hero-stat p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <LiteralVisual title={item.visualTitle} compact />
                        <div className="text-right">
                          <Typography variant="h4" className="text-2xl">
                            {item.value}
                          </Typography>
                          <Typography className="text-sm" sx={{ color: "#6b6068" }}>
                            {item.label}
                          </Typography>
                        </div>
                      </div>
                    </MotionCard>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pill-row">
              <span>Client in new tab</span>
              <span>Admin in new tab</span>
              <span>Auth in new tab</span>
            </div>
          </MotionDiv>
        </div>
      </Container>
    </section>
  );
}
