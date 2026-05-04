const stripTrailingSlash = (url) => url.replace(/\/+$/, "");
const currentOrigin = () => window.location.origin;

export const CLIENT_APP_URL = stripTrailingSlash(
  import.meta.env.VITE_CLIENT_APP_URL || `${currentOrigin()}/app`,
);

export const AUTH_APP_URL = stripTrailingSlash(
  import.meta.env.VITE_AUTH_APP_URL || `${currentOrigin()}/login`,
);

export const ADMIN_APP_URL = stripTrailingSlash(
  import.meta.env.VITE_ADMIN_APP_URL || `${currentOrigin()}/admin`,
);

export const ADMIN_AUTH_URL = stripTrailingSlash(
  import.meta.env.VITE_ADMIN_AUTH_URL || `${currentOrigin()}/auth/signin`,
);

export const launchDestinations = [
  {
    label: "Client App",
    description: "Merchant dashboard, orders, billing, and shipping tools.",
    url: CLIENT_APP_URL,
  },
  {
    label: "Merchant Login",
    description: "Open the auth flow for merchants, onboarding, and account access.",
    url: AUTH_APP_URL,
  },
  {
    label: "Admin Panel",
    description: "Open the operations control layer and admin workspace.",
    url: ADMIN_AUTH_URL,
  },
];

export function openExternal(url) {
  window.location.assign(url);
}

export function openClientApp() {
  openExternal(CLIENT_APP_URL);
}

export function openAuthPortal() {
  openExternal(AUTH_APP_URL);
}

export function openAdminPortal() {
  openExternal(ADMIN_AUTH_URL);
}
