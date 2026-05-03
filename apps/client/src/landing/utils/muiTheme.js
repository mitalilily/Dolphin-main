import { createTheme } from "@mui/material/styles";

const headingFont = '"Poppins", "Segoe UI", sans-serif';
const bodyFont = '"Poppins", "Segoe UI", sans-serif';

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#D97943",
    },
    secondary: {
      main: "#171310",
    },
    background: {
      default: "#f7efe6",
      paper: "#ffffff",
    },
    text: {
      primary: "#171310",
      secondary: "#6c625b",
    },
  },
  typography: {
    fontFamily: bodyFont,
    h1: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.072em",
      lineHeight: 0.92,
    },
    h2: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.06em",
      lineHeight: 0.98,
    },
    h3: {
      fontFamily: headingFont,
      fontWeight: 800,
      letterSpacing: "-0.04em",
      lineHeight: 1.05,
    },
    h4: {
      fontFamily: headingFont,
      fontWeight: 700,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      fontFamily: bodyFont,
    },
  },
  shape: {
    borderRadius: 18,
  },
});

export default theme;
