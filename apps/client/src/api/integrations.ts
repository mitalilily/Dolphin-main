import type { BigCommerceForm } from "../components/integrations/bigcommerce/BigCommeceIntegration";
import type { ShopifyForm } from "../components/integrations/ShopifyIntegration";
import type { WixForm } from "../components/integrations/wix/WixIntegration";
import type { WooCommerceForm } from "../components/integrations/woocommerce/WooCommerceIntegration";
import axiosInstance from "./axiosInstance";

export interface Stores {
  id: string; // store id from platform
  name: string | null;
  userId: string;
  domain: string;
  platformId: number;
  timezone: string | null;
  country: string | null;
  currency: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}
export const integrateShopifyStore = async (params: ShopifyForm) => {
  const { data } = await axiosInstance.post(
    "/integrations/shopify-auth",
    params
  );
  return data;
};

export const getUserStoreIntegrations = async (): Promise<Stores[]> => {
  const res = await axiosInstance.get(`/user/integrations`);
  return res.data.data;
};

export const connectWooCommerce = async (payload: WooCommerceForm) => {
  const response = await axiosInstance.post(
    "/integrations/woocommerce-auth",
    payload
  );
  return response.data;
};

export const connectMagento = async (payload: {
  storeUrl: string;
  accessToken: string;
  userId: string;
}) => {
  const res = await axiosInstance.post("/integrations/magento-auth", payload);
  return res.data;
};

export const connectBigCommerce = async (payload: BigCommerceForm) => {
  const res = await axiosInstance.post("/bigcommerce-auth", payload);
  return res.data;
};

export const integrateWixStore = async (data: WixForm) => {
  const response = await axiosInstance.post("/integrations/wix-auth", data);
  return response.data;
};

export const syncShopifyOrders = async (payload?: { limit?: number; storeId?: string }) => {
  const response = await axiosInstance.post('/integrations/shopify/sync-orders', {
    limit: payload?.limit ?? 50,
    storeId: payload?.storeId,
  })
  return response.data
}
