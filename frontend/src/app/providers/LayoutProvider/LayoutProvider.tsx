import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { Footer } from "../../../widgets/layout/Footer";
import { Header } from "../../../widgets/layout/Header";

export const LayoutProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const location = useLocation();
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const hideFooter =
    location.pathname === "/projects" || location.pathname === "/settings";

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ height: 64, flexShrink: 0 }}>
        <Header />
      </Box>
      <AnimatePresence mode="wait" initial>
        <Box key={location.pathname} sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        {!hideFooter && (
          <Box sx={{ height: isMobile ? 64 : 120, flexShrink: 0 }}>
            <Footer />
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
};
