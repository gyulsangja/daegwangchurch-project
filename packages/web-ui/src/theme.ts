"use client";

import { createTheme } from "@mui/material/styles";

import { webColors } from '@daegwang/design-tokens';

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: {
      main: webColors.primary,
      dark: webColors.primaryDark,
      light: webColors.primaryLight,
      contrastText: webColors.surface,
    },
    secondary: {
      main: webColors.muted,
      dark: webColors.text,
      light: "#F5F5F4",
    },
    background: {
      default: webColors.surface,
      paper: webColors.surface,
    },
    text: {
      primary: webColors.text,
      secondary: webColors.muted,
    },
    divider: webColors.border,
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
        body: { color: webColors.text, backgroundColor: webColors.surface },
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
