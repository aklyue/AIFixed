import React from "react";
import { Typography, Box, useMediaQuery, useTheme } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

export const Footer: React.FC = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));

  return (
    <Box
      color="transparent"
      sx={{
        display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        gap: isMobile ? 2 : 4,
      }}
    >
      <AutoAwesomeIcon sx={{ color: "primary.main", fontSize: isMobile ? "2rem" : "3rem" }} />
      <Typography
        variant={isMobile ? "h6" : "h4"}
        component="div"
        sx={{ color: "text.primary", fontWeight: "bold" }}
      >
        AIFixed
      </Typography>
    </Box>
  );
};
