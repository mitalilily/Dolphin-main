import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import AdminNavbarLinks from "./AdminNavbarLinks";

const navItems = [
  { label: "Overview", path: "/admin/dashboard" },
  { label: "Orders", path: "/admin/orders" },
  { label: "Shipping", path: "/admin/couriers" },
  { label: "Finance", path: "/admin/billing-invoices" },
  { label: "Support", path: "/admin/support" },
];

export default function AdminNavbar(props) {
  const { fixed, secondary, onOpen, sidebarWidth = 275, brandText, ...rest } = props;

  const mainText = useColorModeValue("#171310", "gray.100");
  const secondaryText = useColorModeValue("#74685D", "gray.400");
  const navbarShadow = useColorModeValue(
    "0 18px 36px rgba(23,19,16,0.08)",
    "0 18px 36px rgba(0, 0, 0, 0.4)"
  );
  const defaultNavbarBg = useColorModeValue(
    "rgba(255,252,248,0.94)",
    "linear-gradient(110deg, rgba(22,18,15,0.94) 0%, rgba(34,28,24,0.94) 100%)"
  );
  const defaultNavbarBorder = useColorModeValue(
    "1px solid rgba(23,19,16,0.08)",
    "1px solid rgba(255,255,255,0.12)"
  );
  const activeBg = useColorModeValue(
    "rgba(217,121,67,0.12)",
    "rgba(255,255,255,0.08)"
  );
  const navShellBg = useColorModeValue(
    "rgba(255,255,255,0.72)",
    "rgba(255,255,255,0.06)"
  );
  const navShellBorder = useColorModeValue(
    "rgba(23,19,16,0.08)",
    "rgba(255,255,255,0.12)"
  );
  const navbarBg = secondary ? "transparent" : defaultNavbarBg;
  const navbarBorder = secondary ? "none" : defaultNavbarBorder;

  return (
    <Flex
      position={fixed || !secondary ? "fixed" : "absolute"}
      boxShadow={secondary ? "none" : navbarShadow}
      bg={navbarBg}
      border={navbarBorder}
      backdropFilter={secondary ? "none" : "blur(14px)"}
      transition="all 0.3s ease"
      alignItems="center"
      borderRadius="20px"
      minH="64px"
      left={{ base: "10px", md: "14px", xl: `${sidebarWidth + 24}px` }}
      right="14px"
      px={{ base: "12px", md: "16px" }}
      py="8px"
      top="12px"
    >
      <Flex
        w="100%"
        flexDirection={{ base: "row", "2xl": "row" }}
        alignItems="center"
        justify="space-between"
        gap={{ base: 2, "2xl": 3 }}
      >
        <Flex
          direction="row"
          align="center"
          minW={0}
          w={{ base: "auto", "2xl": "auto" }}
          flex={{ "2xl": "0 1 280px" }}
          gap="12px"
        >
          <Box
            as="img"
            src="/skyrush-logo.png"
            alt="SkyRush Express Courier"
            h="30px"
            w="118px"
            objectFit="contain"
          />
          <Box minW={0} display={{ base: "none", md: "block" }}>
            <Text
              fontSize="10px"
              fontWeight="800"
              letterSpacing="0.14em"
              textTransform="uppercase"
              color={secondaryText}
            >
              Admin Panel
            </Text>
            <Text
              fontSize="sm"
              fontWeight="800"
              color={mainText}
              noOfLines={1}
            >
              {brandText || "Dashboard"}
            </Text>
          </Box>
        </Flex>

        <HStack
          display={{ base: "none", "2xl": "flex" }}
          spacing={1}
          px="6px"
          py="4px"
          borderRadius="999px"
          border="1px solid"
          borderColor={navShellBorder}
          bg={navShellBg}
        >
          {navItems.map((item) => (
            <NavLink key={item.label} to={item.path}>
              <Button
                variant="ghost"
                borderRadius="999px"
                px="12px"
                minH="34px"
                fontSize="13px"
                fontWeight="700"
                color={mainText}
                _hover={{ bg: activeBg }}
              >
                {item.label}
              </Button>
            </NavLink>
          ))}
        </HStack>

        <HStack
          ms={{ base: 0, "2xl": "auto" }}
          spacing={2}
          align="center"
          justify="flex-end"
          w={{ base: "auto", "2xl": "auto" }}
          flexShrink={0}
        >
          <AdminNavbarLinks
            onOpen={onOpen}
            logoText={props.logoText}
            secondary={secondary}
            fixed={fixed}
            {...rest}
          />
        </HStack>
      </Flex>
    </Flex>
  );
}

AdminNavbar.propTypes = {
  variant: PropTypes.string,
  secondary: PropTypes.bool,
  fixed: PropTypes.bool,
  onOpen: PropTypes.func,
  sidebarWidth: PropTypes.number,
};
