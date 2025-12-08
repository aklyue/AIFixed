import {
  Alert,
  Box,
  Button,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useVerify } from "../../hooks";

function VerificationBlock() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const {
    userEmail,
    verificationCode,
    setVerificationCode,
    handleVerifyCode,
    snackbarMessage,
    snackbarOpen,
    snackbarSeverity,
    handleCloseSnackbar,
  } = useVerify();
  return (
    <>
      <Box
        sx={{
          maxWidth: 400,
          mx: "auto",
          p: 3,
          border: "1px solid",
          borderColor: isMobile ? "rgba(0,0,0,0)" : "divider",
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

       <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default VerificationBlock;
