import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { SiShopify } from "react-icons/si";
import { useState } from "react";
import { useIntegrateShopify } from "../../hooks/useIntegrations";
import { toast } from "../UI/Toast";
import { useAuth } from "../../context/auth/AuthContext";
import ShopifyConnectionModal from "./ShopifyConnectionModal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface IShopifyIntegrationProps {
  fullWidth?: boolean;
  forOnboarding?: boolean;
  fromChannelList?: boolean;
}

export interface ShopifyForm {
  storeUrl: string;
  apiKey: string;
  webhookSecret?: string;
  name?: string;
  adminApiAccessToken: string;
  hostName?: string;
  domain?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
  userId?: string;
  status?: "active" | "inactive";
  settings?: {
    fulfillTrigger?: string;
    customerNotifyOnFulfill?: string;
    orderTagsToFetch?: string;
    codTags?: string;
    prepaidTags?: string;
    autoUpdateShipmentStatus?: boolean;
    autoCancelOrders?: boolean;
    markCodPaidOnDelivery?: boolean;
  };
}
export default function ShopifyIntegration({
  fullWidth,
  forOnboarding = false,
  fromChannelList = false,
}: IShopifyIntegrationProps) {
  const { user: userData } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [openModal, setOpenModal] = useState<boolean>(false);

  const [shopifyDetails, setShopifyDetails] = useState<ShopifyForm>({
    storeUrl: "",
    apiKey: "",
    webhookSecret: "",
    adminApiAccessToken: "",
    userId: "",
    status: "active",
    settings: {
      fulfillTrigger: "do_not_fulfill",
      customerNotifyOnFulfill: "do_not_notify",
    },
  });

  const [inputErrors, setInputErrors] = useState<{
    adminApiAccessToken?: string;
    apiKey?: string;
    storeUrl?: string;
    webhookSecret?: string;
  }>({
    adminApiAccessToken: undefined,
    apiKey: undefined,
    storeUrl: undefined,
    webhookSecret: undefined,
  });

  const { mutate: integrateShopify, isPending: integrating } =
    useIntegrateShopify();

  const validateFields = () => {
    const errors: typeof inputErrors = {
      adminApiAccessToken: "",
      apiKey: "",
      storeUrl: "",
      webhookSecret: "",
    };

    if (!shopifyDetails.storeUrl.trim()) {
      errors.storeUrl = "Store URL is required";
    } else if (
      !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shopifyDetails.storeUrl.trim())
    ) {
      errors.storeUrl =
        "Enter a valid Shopify URL (e.g., mystore.myshopify.com)";
    }

    if (!shopifyDetails.apiKey.trim()) {
      errors.apiKey = "API Key is required";
    }

    if (!shopifyDetails.adminApiAccessToken.trim()) {
      errors.adminApiAccessToken = "Admin API Token is required";
    }

    if (!String(shopifyDetails.webhookSecret || "").trim()) {
      errors.webhookSecret = "Webhook Secret is required";
    }

    // if (!shopifyDetails.hostName.trim()) {
    //   errors.hostName = "Host Name is required";
    // }

    setInputErrors(errors);
    return Object.values(errors).every((val) => val === "");
  };
  const handleConnect = () => {
    if (!validateFields()) return;

    integrateShopify(
      { ...shopifyDetails, userId: userData?.userId },
      {
        onSuccess: (data) => {
          toast.open({
            message: data?.warning ? `${data?.message}. ${data.warning}` : data?.message,
            severity: data?.warning ? "warning" : "success",
          });
          setOpenModal(false);
          if (!forOnboarding && !fromChannelList) {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
          }
          if (fromChannelList && !forOnboarding) {
            navigate("/channels/connected");
          }
        },
        onError: (error) => {
          console.error("Error integrating Shopify store:", error);
          toast.open({
            message: "Error integrating Shopify store",
            severity: "error",
          });
        },
      }
    );
  };

  const isConnected: boolean = userData?.salesChannels?.shopify;

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          bgcolor: "transparent",
          borderColor: "rgba(255,255,255,0.1)",
          color: "inherit",
          height: "100%",
          width: fullWidth ? "100%" : "auto",

          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
          <Box display="flex" justifyContent="center" mb={1}>
            <SiShopify size={28} />
          </Box>
          <Typography fontWeight={600}>Shopify</Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            size="small"
            variant={"contained"}
            color={isConnected && forOnboarding ? "success" : "inherit"}
            onClick={() => setOpenModal(true)}
            fullWidth={isMobile}
          >
            {forOnboarding && isConnected ? "Connected" : "Connect"}
          </Button>
        </CardActions>
      </Card>

      <ShopifyConnectionModal
        handleConnect={handleConnect}
        inputErrors={inputErrors as ShopifyForm}
        integrating={integrating}
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        setShopifyDetails={setShopifyDetails}
        shopifyDetails={shopifyDetails}
        forOnboarding={forOnboarding}
      />
    </>
  );
}
