import { Box, TextField, Button, Typography } from "@mui/material";
import React, { useState } from "react";

function LoginBlock({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h5" fontWeight={600}>
        Вход
      </Typography>

      <TextField
        label="Email"
        fullWidth
        variant="outlined"
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        label="Пароль"
        type="password"
        fullWidth
        variant="outlined"
        onChange={(e) => setPassword(e.target.value)}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, py: 1.3 }}
        onClick={() => onLogin(email, password)}
      >
        Войти
      </Button>
    </Box>
  );
}

export default LoginBlock;
