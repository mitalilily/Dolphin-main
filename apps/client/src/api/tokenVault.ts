// src/api/tokenVault.ts
let access = "";
let refresh = "";

/** Read the latest tokens (kept in‑memory + localStorage) */
export const getAuthTokens = () => {
  const accessToken = access || localStorage.getItem("cc_access") || ""
  const refreshToken = refresh || localStorage.getItem("cc_refresh") || ""
  
  // Update in-memory cache if found in localStorage
  if (!access && accessToken) access = accessToken
  if (!refresh && refreshToken) refresh = refreshToken
  
  return { accessToken, refreshToken }
}

/** Save (and persist) a new token pair */
export const setAuthTokens = (a: string, r: string) => {
  access = a;
  refresh = r;
  localStorage.setItem("cc_access", a);
  localStorage.setItem("cc_refresh", r);
};

/** Wipe everything */
export const clearAuthTokens = () => {
  access = "";
  refresh = "";
  localStorage.removeItem("cc_access");
  localStorage.removeItem("cc_refresh");
};
