import { Box, Button, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function VerificationBlock() {
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState(
    new URLSearchParams(window.location.search).get("email") || ""
  );
  const navigate = useNavigate();

  const handleVerifyCode = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, code: verificationCode }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Ошибка подтверждения");

      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Неверный код или истек срок действия");
    }
  };
  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        p: 3,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h6" textAlign="center">
        Подтверждение email
      </Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        На адрес <strong>{userEmail}</strong> был отправлен код подтверждения.
      </Typography>
      <TextField
        label="Код подтверждения"
        type="text"
        fullWidth
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleVerifyCode}
      >
        Подтвердить
      </Button>
    </Box>
  );
}

export default VerificationBlock;
