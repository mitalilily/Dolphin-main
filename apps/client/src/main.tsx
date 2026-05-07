import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App.tsx";
import "./index.css";
import theme from "./theme/theme.ts";
import { CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./components/UI/Toast.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/auth/AuthContext.tsx";
import ErrorBoundary from "./components/UI/ErrorBoundary.tsx";
import { installChunkLoadRecovery } from "./utils/chunkRecovery.ts";

const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || "";

installChunkLoadRecovery();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {clientId ? (
        <GoogleOAuthProvider clientId={clientId}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <ToastProvider />
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <App />
              </AuthProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      ) : (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider />
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      )}
    </ErrorBoundary>
  </StrictMode>
);
