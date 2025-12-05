import React, { useState } from "react";
import VerificationBlock from "../../features/auth/blocks/components/VerificationBlock";
import { Box } from "@mui/material";

function VerificationPage() {
  return (
    <Box
      sx={{
        height: "95vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <VerificationBlock />
    </Box>
  );
}

export default VerificationPage;
