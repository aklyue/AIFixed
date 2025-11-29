import React from "react";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { ReactComponent as LogoPC } from "../../../shared/assets/logo/logo-pc.svg";
import { ReactComponent as LogoPhone } from "../../../shared/assets/logo/logo-phone.svg";

export const Footer: React.FC = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));

  return (
    <Box
      bgcolor={"#FCFCFC"}
      sx={{
        display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? 2 : 4,
      }}
    >
      {isMobile ? <LogoPhone /> : <LogoPC />}
    </Box>
  );
};
