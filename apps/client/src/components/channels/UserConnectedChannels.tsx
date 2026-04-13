import { Typography, Stack } from "@mui/material";
import DataTable, { type Column } from "../../components/UI/table/DataTable";
import {
  useDeleteIntegration,
  useUserChannelIntegrations,
} from "../../hooks/Integrations/useUserChannelIntegrations";
import type { Stores } from "../../api/integrations";
import { channelIntegrationImageMapping } from "../../utils/utility";
import TableSkeleton from "../UI/table/TableSkeleton";
import { TbEditCircle } from "react-icons/tb";
import { useState } from "react";
import ShopifyConnectionModal from "../integrations/ShopifyConnectionModal";
import type { ShopifyForm } from "../integrations/ShopifyIntegration";
import { useIntegrateShopify } from "../../hooks/useIntegrations";
import { useSyncShopifyOrders } from '../../hooks/useIntegrations'
import { useAuth } from "../../context/auth/AuthContext";
import { toast } from "../UI/Toast";

const UserConnectedChannels = () => {
  const { user: userData } = useAuth();
  const { mutate: deleteIntegration, isPending: deleting } =
    useDeleteIntegration();

  const { data: stores, isLoading } = useUserChannelIntegrations();

  const { mutate: integrateShopify, isPending: integrating } =
    useIntegrateShopify();
  const { mutate: syncShopifyOrders, isPending: syncingShopify } = useSyncShopifyOrders()
  const [selectedStore, setSelectedStore] = useState<{
    platform: number | null;
    channelId: string;
  }>({ channelId: "", platform: null });

  const [details, setDetails] = useState<ShopifyForm>({
    storeUrl: "",
    apiKey: "",
    webhookSecret: "",
    adminApiAccessToken: "",
  });

  const columns: Column<Stores>[] = [
    {
      id: "id",
      label: "Channel Id",
    },
    {
      id: "name",
      label: "Store",
    },
    {
      id: "domain",
      label: "Domain",
    },
    {
      id: "platformId",
      label: "Platform",
      render: (platformId) => (
        <Stack>
          <img
            height={"30px"}
            width={"65px"}
            style={{ objectFit: "cover", borderRadius: "5px" }}
            src={channelIntegrationImageMapping[Number(platformId)]}
          />
        </Stack>
      ),
    },
    {
      id: "id",
      label: "Action",
      render: (value, row) => (
        <Stack direction="row" alignItems={"center"} spacing={1.5}>
          <Stack
            onClick={() => {
              setSelectedStore({ channelId: value, platform: row?.platformId });
              setDetails({
                ...row,
                name: row.name ?? undefined,
                storeUrl: row.domain || '',
                apiKey: String((row.metadata as { apiKey?: string } | null)?.apiKey || ''),
                adminApiAccessToken: String(
                  (row.metadata as { adminApiAccessToken?: string } | null)?.adminApiAccessToken || '',
                ),
                webhookSecret:
                  (row.metadata as { shopifyWebhookSecret?: string })?.shopifyWebhookSecret ||
                  (row.metadata as { webhookSecret?: string })?.webhookSecret ||
                  "",
              });
            }}
            sx={{ color: "#ffd25e", cursor: "pointer" }}
            direction="row"
            alignItems={"center"}
            spacing={1}
          >
            <TbEditCircle />
            <Typography fontWeight={600} fontSize={"12px"}>
              Edit
            </Typography>
          </Stack>
          {row?.platformId === 1 && (
            <Typography
              fontWeight={600}
              fontSize={"12px"}
              sx={{ color: syncingShopify ? '#9ca3af' : '#34d399', cursor: syncingShopify ? 'default' : 'pointer' }}
              onClick={() => {
                if (syncingShopify) return
                syncShopifyOrders({ limit: 100, storeId: row?.id }, {
                  onSuccess: (data: { created: number; updated: number; message: string }) => {
                    toast.open({
                      message: `Shopify sync complete: ${data?.created ?? 0} created, ${data?.updated ?? 0} updated`,
                      severity: 'success',
                    })
                  },
                  onError: (error: unknown) => {
                    const apiError = error as { response?: { data?: { error?: string } } }
                    toast.open({
                      message: apiError?.response?.data?.error || 'Failed to sync Shopify orders',
                      severity: 'error',
                    })
                  },
                })
              }}
            >
              {syncingShopify ? 'Syncing...' : 'Sync Orders'}
            </Typography>
          )}
        </Stack>
      ),
    },
  ];

  const handleUpdateShopify = () => {
    const payload = {
      ...details,
      webhookSecret:
        details.webhookSecret ||
        (details.metadata as { shopifyWebhookSecret?: string })?.shopifyWebhookSecret ||
        (details.metadata as { webhookSecret?: string })?.webhookSecret ||
        "",
      userId: userData?.userId,
    }

    integrateShopify(payload, {
      onSuccess: (data) => {
        toast.open({
          message: data?.warning ? `${data?.message}. ${data.warning}` : data?.message,
          severity: data?.warning ? "warning" : "success",
        });
        setSelectedStore({ channelId: "", platform: null });
      },
      onError: (error) => {
        console.error("Error integrating Shopify store:", error);
        toast.open({
          message: "Error integrating Shopify store",
          severity: "error",
        });
      },
    });
  };

  const handleDeleteStore = () => {
    if (!window.confirm("Are you sure you want to delete this store?")) return;

    deleteIntegration(selectedStore?.channelId, {
      onSuccess: () => {
        toast.open({
          message: "Store deleted successfully",
          severity: "success",
        });
        setSelectedStore({ channelId: "", platform: null });
      },
      onError: (error) => {
        console.error("Delete error:", error);
        toast.open({ message: "Failed to delete store", severity: "error" });
      },
    });
  };

  return (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable<Stores>
          rows={stores ?? []}
          columns={columns}
          title="Your Connected Stores"
          subTitle="Manage the stores you’ve integrated with your sales channels"
          pagination
          bgOverlayImg="/images/api-graphical.png"
          onSelectRows={(ids) => console.log("Selected store IDs:", ids)}
        />
      )}

      {selectedStore?.platform === 1 && (
        <ShopifyConnectionModal
          deleting={deleting}
          handleDelete={handleDeleteStore}
          integrating={integrating}
          handleConnect={handleUpdateShopify}
          isEditing={selectedStore?.platform ? true : false}
          setShopifyDetails={setDetails}
          shopifyDetails={details}
          openModal={selectedStore?.platform ? true : false}
          onSetOpen={() => setSelectedStore({ channelId: "", platform: null })}
        />
      )}

      {/* Add more modals here as needed */}
      {/* {selectedStore?.platformId === 2 && <WooEditModal ... />} */}
    </>
  );
};

export default UserConnectedChannels;
