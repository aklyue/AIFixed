import React from "react";
import { VerificationBlock } from "../../features/auth";
import { Box, useMediaQuery, useTheme } from "@mui/material";

const VerificationPage = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  return (
    <Box
      sx={{
        height: isMobile ? undefined : "95vh",
        display: "flex",
        justifyContent: "center",
        alignItems: isMobile ? undefined : "center",
      }}
    >
      <VerificationBlock />
    </Box>
  );
};

export default VerificationPage;
