import React from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useSettings } from "../../hooks";

export const SettingsForm: React.FC = () => {
  const {
    name,
    setName,
    email,
    setEmail,
    save,
    loading,
    error,
  } = useSettings();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        mt: 4,
        minWidth: 400,
        justifyContent: "center",
      }}
    >
      <TextField
        label="Имя"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button variant="contained" onClick={save} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Сохранить"}
      </Button>
    </Box>
  );
};
