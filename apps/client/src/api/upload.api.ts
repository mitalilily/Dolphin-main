import axiosInstance from "./axiosInstance";

export const getPresignedDownloadUrls = async (keys: string | string[]) => {
  const response = await axiosInstance.post("/uploads/presign-download-url", {
    keys,
  });

  if (Array.isArray(keys)) {
    return response.data.urls as string[];
  } else {
    return response.data.url as string;
  }
};
