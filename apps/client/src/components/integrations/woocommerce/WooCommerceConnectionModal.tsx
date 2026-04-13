import {
  Grid,
  Typography,
  Stack,
  Card,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { FaConnectdevelop } from "react-icons/fa6";
import { type Dispatch, type SetStateAction } from "react";
import CustomDialog from "../../UI/modal/CustomModal";
import CustomIconLoadingButton from "../../UI/button/CustomLoadingButton";
import CustomInput from "../../UI/inputs/CustomInput";
import CustomSwitch from "../../UI/inputs/CustomSwitch";
import type { WooCommerceForm } from "./WooCommerceIntegration";

interface IWooCommerceConnectionModalProps {
  openModal: boolean;
  onSetOpen: () => void;
  handleConnect: () => void;
  isEditing?: boolean;
  integrating?: boolean;
  wooDetails: WooCommerceForm;
  setWooDetails: Dispatch<SetStateAction<WooCommerceForm>>;
  inputErrors?: Partial<WooCommerceForm>;
  forOnboarding?: boolean;
}

const WooCommerceConnectionModal = ({
  openModal,
  onSetOpen,
  handleConnect,
  integrating,
  wooDetails,
  setWooDetails,
  isEditing = false,
  inputErrors,
  forOnboarding = false,
}: IWooCommerceConnectionModalProps) => {
  return (
    <CustomDialog
      fullScreen={!forOnboarding && isEditing}
      width="100%"
      maxWidth={forOnboarding ? "lg" : "xl"}
      open={openModal}
      onClose={onSetOpen}
      title={
        <Stack direction="row" alignItems="center" gap={2}>
          <FaConnectdevelop />
          Connect your WooCommerce store
        </Stack>
      }
      footer={
        <Stack direction="row" spacing={2}>
          <CustomIconLoadingButton
            text="Connect"
            loadingText="Connecting..."
            loading={integrating}
            onClick={handleConnect}
          />
        </Stack>
      }
    >
      <Grid container spacing={4}>
        <Grid size={{ md: 5, xs: 12 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6" gutterBottom>
              How to get WooCommerce API credentials
            </Typography>
            <List dense>
              {[
                { primary: "1. Go to your WordPress Admin Panel" },
                { primary: "2. Navigate to WooCommerce > Settings > Advanced" },
                { primary: "3. Go to REST API and click 'Add Key'" },
                {
                  primary:
                    "4. Add a Description, select user and set Permission to 'Read/Write'",
                },
                { primary: "5. Click 'Generate API Key'" },
                {
                  primary: "6. Copy the Consumer Key & Secret shown on screen",
                },
              ].map((step, i) => (
                <ListItem key={i}>
                  <ListItemText primary={step.primary} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>

        <Grid size={{ md: 7, xs: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Enter WooCommerce Credentials
            </Typography>
            <Stack spacing={2}>
              <CustomInput
                required
                label="Store URL"
                placeholder="https://yourstore.com"
                value={wooDetails.storeUrl}
                onChange={(e) =>
                  setWooDetails((prev) => ({
                    ...prev,
                    storeUrl: e.target.value,
                  }))
                }
                error={!!inputErrors?.storeUrl}
                helperText={inputErrors?.storeUrl}
              />
              <CustomInput
                required
                label="Consumer Key"
                value={wooDetails.consumerKey}
                onChange={(e) =>
                  setWooDetails((prev) => ({
                    ...prev,
                    consumerKey: e.target.value,
                  }))
                }
                error={!!inputErrors?.consumerKey}
                helperText={inputErrors?.consumerKey}
              />
              <CustomInput
                required
                label="Consumer Secret"
                type="password"
                value={wooDetails.consumerSecret}
                onChange={(e) =>
                  setWooDetails((prev) => ({
                    ...prev,
                    consumerSecret: e.target.value,
                  }))
                }
                error={!!inputErrors?.consumerSecret}
                helperText={inputErrors?.consumerSecret}
              />
              {isEditing && !forOnboarding ? (
                <>
                  <CustomSwitch
                    label="Auto-update order status"
                    checked={!!wooDetails?.settings?.autoUpdateStatus}
                    onChange={(e) =>
                      setWooDetails((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          autoUpdateStatus: e.target.checked,
                        },
                      }))
                    }
                  />
                  <CustomSwitch
                    label="Mark COD orders as paid on delivery"
                    checked={!!wooDetails?.settings?.markCodPaid}
                    onChange={(e) =>
                      setWooDetails((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          markCodPaid: e.target.checked,
                        },
                      }))
                    }
                  />
                </>
              ) : null}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </CustomDialog>
  );
};

export default WooCommerceConnectionModal;
