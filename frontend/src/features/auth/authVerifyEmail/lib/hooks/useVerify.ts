import { AlertColor } from "@mui/material";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleVerification } from "../../../../../entities/auth";

export const useVerify = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState(
    new URLSearchParams(window.location.search).get("email") || ""
  );

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>("error");

  const navigate = useNavigate();

  const handleVerifyCode = async () => {
    try {
      const data = handleVerification(userEmail, verificationCode);

      setSnackbarMessage("Email успешно подтвержден!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      setSnackbarMessage("Неверный код или истек срок действия");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return {
    userEmail,
    verificationCode,
    setVerificationCode,
    handleVerifyCode,
    snackbarMessage,
    snackbarOpen,
    snackbarSeverity,
    handleCloseSnackbar,
  };
};
