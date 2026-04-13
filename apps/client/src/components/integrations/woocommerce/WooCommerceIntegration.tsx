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
import { SiWoo } from "react-icons/si";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/auth/AuthContext";
import { toast } from "../../UI/Toast";
import WooCommerceConnectionModal from "./WooCommerceConnectionModal";
import { useIntegrateWooCommerce } from "../../../hooks/useIntegrations";

export interface WooCommerceForm {
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  userId?: string;
  status?: "active" | "inactive";
  settings?: {
    autoUpdateStatus?: boolean;
    markCodPaid?: boolean;
  };
}

interface IWooCommerceIntegrationProps {
  fullWidth?: boolean;
  forOnboarding?: boolean;
  fromChannelList?: boolean;
}

export default function WooCommerceIntegration({
  fullWidth,
  forOnboarding = false,
  fromChannelList = false,
}: IWooCommerceIntegrationProps) {
  const { user } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [wooDetails, setWooDetails] = useState<WooCommerceForm>({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    userId: user?.userId ?? "",
    status: "active",
  });

  const [inputErrors, setInputErrors] = useState<Partial<WooCommerceForm>>({});
  const { mutate: integrateWooCommerce, isPending: integrating } =
    useIntegrateWooCommerce();

  const validateFields = () => {
    const errors: Partial<WooCommerceForm> = {};
    if (!wooDetails.storeUrl.trim()) {
      errors.storeUrl = "Store URL is required";
    } else if (!/^https?:\/\/.+/.test(wooDetails.storeUrl)) {
      errors.storeUrl = "Enter a valid URL with http or https";
    }
    if (!wooDetails.consumerKey.trim()) {
      errors.consumerKey = "Consumer Key is required";
    }
    if (!wooDetails.consumerSecret.trim()) {
      errors.consumerSecret = "Consumer Secret is required";
    }
    setInputErrors(errors);
    return Object.values(errors).every((val) => !val);
  };

  const handleConnect = () => {
    if (!validateFields()) return;
    console.log("woo", wooDetails);
    integrateWooCommerce(
      { ...wooDetails },
      {
        onSuccess: (data) => {
          toast.open({ message: data.message, severity: "success" });
          setOpenModal(false);
          if (!forOnboarding && !fromChannelList) {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
          }
          if (fromChannelList && !forOnboarding) {
            navigate("/channels/connected");
          }
        },
        onError: () => {
          toast.open({
            message: "Error connecting WooCommerce store",
            severity: "error",
          });
        },
      }
    );
  };

  const isConnected: boolean = user?.salesChannels?.woocommerce;

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
            <SiWoo size={28} />
          </Box>
          <Typography fontWeight={600}>WooCommerce</Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button
            size="small"
            variant="contained"
            color={isConnected && forOnboarding ? "success" : "inherit"}
            onClick={() => setOpenModal(true)}
            fullWidth={isMobile}
          >
            {forOnboarding && isConnected ? "Connected" : "Connect"}
          </Button>
        </CardActions>
      </Card>

      <WooCommerceConnectionModal
        openModal={openModal}
        onSetOpen={() => setOpenModal(false)}
        wooDetails={wooDetails}
        setWooDetails={setWooDetails}
        inputErrors={inputErrors}
        handleConnect={handleConnect}
        integrating={integrating}
        forOnboarding={forOnboarding}
      />
    </>
  );
}
