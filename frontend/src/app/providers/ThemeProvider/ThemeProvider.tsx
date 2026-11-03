import React from "react";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import theme from "../../config/theme";

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>;
