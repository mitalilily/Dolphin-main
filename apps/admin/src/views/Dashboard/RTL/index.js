// Chakra imports
import {
  Flex,
  Grid,
  Image,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
// assets
import peopleImage from "assets/img/people-image.png";
import logoChakra from "assets/svg/logo-white.svg";
import BarChart from "components/Charts/BarChart";
import LineChart from "components/Charts/LineChart";
// Custom icons
import {
  CartIcon,
  DocumentIcon,
  GlobeIcon,
  WalletIcon,
} from "components/Icons/Icons.js";
import React from "react";
import { rtlDashboardTableData, rtlTimelineData } from "variables/general";
import ActiveUsers from "../Dashboard/components/ActiveUsers";
import BuiltByDevelopers from "../Dashboard/components/BuiltByDevelopers";
import MiniStatistics from "../Dashboard/components/MiniStatistics";
import OrdersOverview from "../Dashboard/components/OrdersOverview";
import Projects from "../Dashboard/components/Projects";
import SalesOverview from "../Dashboard/components/SalesOverview";
import WorkWithTheRockets from "../Dashboard/components/WorkWithTheRockets";

export default function Dashboard() {
  // Chakra Color Mode

  const iconBoxInside = useColorModeValue("white", "white");

  return (
    <Flex flexDirection='column' pt={{ base: "120px", md: "75px" }}>
      <SimpleGrid columns={{ sm: 1, md: 2, xl: 4 }} spacing='24px'>
        <MiniStatistics
          title={"Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª"}
          amount={"$53,000"}
          percentage={55}
          icon={<WalletIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
        />
        <MiniStatistics
          title={"Ø¹Ù…Ù„Ø§Ø¡ Ø¬Ø¯Ø¯"}
          amount={"2,300"}
          percentage={5}
          icon={<GlobeIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
        />
        <MiniStatistics
          title={"Ù…Ø³ØªØ®Ø¯Ù…Ùˆ Ø§Ù„ÙŠÙˆÙ…"}
          amount={"+3,020"}
          percentage={-14}
          icon={<DocumentIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
        />
        <MiniStatistics
          title={"Ø£Ù…ÙˆØ§Ù„ Ø§Ù„ÙŠÙˆÙ…"}
          amount={"$173,000"}
          percentage={8}
          icon={<CartIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
        />
      </SimpleGrid>
      <Grid
        templateColumns={{ md: "1fr", lg: "1.8fr 1.2fr" }}
        templateRows={{ md: "1fr auto", lg: "1fr" }}
        my='26px'
        gap='24px'>
        <BuiltByDevelopers
          title={"Ø¨Ù†Ø§Ù‡Ø§ Ø§Ù„Ù…Ø·ÙˆØ±ÙˆÙ†"}
          name={"Ù„ÙˆØ­Ø© Ù…Ø¹Ù„ÙˆÙ…Ø§Øª SkyRush Express Courier"}
          description={
            "Ù…Ù† Ø§Ù„Ø£Ù„ÙˆØ§Ù† ÙˆØ§Ù„Ø¨Ø·Ø§Ù‚Ø§Øª ÙˆØ§Ù„Ø·Ø¨Ø§Ø¹Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø¹Ù†Ø§ØµØ± Ø§Ù„Ù…Ø¹Ù‚Ø¯Ø© ØŒ Ø³ØªØ¬Ø¯ Ø§Ù„ÙˆØ«Ø§Ø¦Ù‚ Ø§Ù„ÙƒØ§Ù…Ù„Ø©."
          }
          image={
            <Image
              src={logoChakra}
              alt='chakra image'
              minWidth={{ md: "300px", lg: "auto" }}
            />
          }
        />
        <WorkWithTheRockets
          backgroundImage={peopleImage}
          title={"Ø§Ù„Ø¹Ù…Ù„ Ù…Ø¹ Ø§Ù„ØµÙˆØ§Ø±ÙŠØ®"}
          description={
            "ØªÙƒÙˆÙŠÙ† Ø§Ù„Ø«Ø±ÙˆØ© Ù‡Ùˆ Ù„Ø¹Ø¨Ø© Ø«ÙˆØ±ÙŠØ© Ø­Ø¯ÙŠØ«Ø© Ø°Ø§Øª Ù…Ø­ØµÙ„Ø© Ø¥ÙŠØ¬Ø§Ø¨ÙŠØ©. Ø§Ù„Ø£Ù…Ø± ÙƒÙ„Ù‡ ÙŠØªØ¹Ù„Ù‚ Ø¨Ù…Ù† ÙŠØºØªÙ†Ù… Ø§Ù„ÙØ±ØµØ© Ø£ÙˆÙ„Ø§Ù‹."
          }
        />
      </Grid>
      <Grid
        templateColumns={{ sm: "1fr", lg: "1.3fr 1.7fr" }}
        templateRows={{ sm: "repeat(2, 1fr)", lg: "1fr" }}
        gap='24px'
        mb={{ lg: "26px" }}>
        <ActiveUsers
          title={"Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ø§Ù„Ù†Ø´Ø·ÙŠÙ†"}
          percentage={23}
          chart={<BarChart />}
        />
        <SalesOverview
          title={"Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª"}
          percentage={5}
          chart={<LineChart />}
        />
      </Grid>
      <Grid
        templateColumns={{ sm: "1fr", md: "1fr 1fr", lg: "2fr 1fr" }}
        templateRows={{ sm: "1fr auto", md: "1fr", lg: "1fr" }}
        gap='24px'>
        <Projects
          title={"Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹"}
          amount={30}
          captions={["Companies", "Members", "Budget", "Completion"]}
          data={rtlDashboardTableData}
        />
        <OrdersOverview
          title={"Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„Ø·Ù„Ø¨Ø§Øª"}
          amount={30}
          data={rtlTimelineData}
        />
      </Grid>
    </Flex>
  );
}
