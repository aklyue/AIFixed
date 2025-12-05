import React, { useState } from "react";
import VerificationBlock from "../../features/auth/blocks/components/VerificationBlock";
import { Box, useMediaQuery, useTheme } from "@mui/material";

function VerificationPage() {
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
}

export default VerificationPage;
