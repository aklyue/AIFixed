import React from "react";
import { MyPresentations } from "../../features/presentation/managePresentations";
import { Box, useMediaQuery, useTheme } from "@mui/material";

const MyPresentationsPage = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  return (
    <Box
      sx={{
        p: isMobile ? 2 : 4,
      }}
    >
      <MyPresentations />
    </Box>
  );
};

export default MyPresentationsPage;
