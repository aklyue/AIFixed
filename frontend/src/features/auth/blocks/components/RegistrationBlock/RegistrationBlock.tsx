import { Box, TextField, Button, Typography } from "@mui/material";
import React, { useState } from "react";

function RegistrationBlock({
  onRegister,
}: {
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h5" fontWeight={600}>
        Регистрация
      </Typography>

      <TextField
        label="Имя"
        fullWidth
        variant="outlined"
        onChange={(e) => setName(e.target.value)}
      />
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
      <TextField
        label="Повторите пароль"
        type="password"
        fullWidth
        variant="outlined"
        onChange={(e) => setPassword2(e.target.value)}
      />

      <Button
        disabled={password !== password2}
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, py: 1.3 }}
        onClick={() => onRegister(name, email, password)}
      >
        Создать аккаунт
      </Button>
    </Box>
  );
}

export default RegistrationBlock;
