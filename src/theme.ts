"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: "#1599AC",
      dark: "#117F90",
      light: "#DDF4F6",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#66615E",
      dark: "#262321",
      light: "#F5F5F4",
    },
    background: {
      default: "#FFFFFF",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#262321",
      secondary: "#66615E",
    },
    divider: "#E7E5E4",
    error: { main: "#B42318" },
  },
  typography: {
    fontFamily:
      '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "-0.01em",
    },
    h1: { fontWeight: 800, letterSpacing: "-0.05em" },
    h2: { fontWeight: 800, letterSpacing: "-0.04em" },
    h3: { fontWeight: 800, letterSpacing: "-0.03em" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { color: "#262321", backgroundColor: "#FFFFFF" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 12,
          paddingInline: 20,
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: "1px solid #E7E5E4",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 12, minHeight: 44 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 700 },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 800, backgroundColor: "#F5F5F4" },
      },
    },
  },
});

export default theme;
