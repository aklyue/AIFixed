import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import React from "react";
import SettingsForm from "../../entities/user/ui/components/SettingsForm";

function SettingsPage() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  return (
    <Box
      sx={{
        p: isMobile ? 2 : 4,
      }}
    >
      <Typography variant="h4" mb={3}>
        Настройки пользователя
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <SettingsForm />
      </Box>
    </Box>
  );
}

export default SettingsPage;
