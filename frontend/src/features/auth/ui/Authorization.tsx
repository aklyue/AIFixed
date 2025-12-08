import {
  Box,
  Tabs,
  Tab,
  Paper,
  Button,
  Typography,
  Container,
  Divider,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import LoginBlock from "../blocks/components/LoginBlock";
import RegistrationBlock from "../blocks/components/RegistrationBlock";
import GoogleIcon from "@mui/icons-material/Google";
import GithubIcon from "@mui/icons-material/GitHub";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks";
import { useTabsChange } from "./hooks/useTabsChange/useTabsChange";
import { LoadingOverlay } from "../../../shared/components";

function Authorization() {
  const isMobile = useMediaQuery(useTheme().breakpoints.down("md"));
  const location = useLocation();

  const { tab, handleTabChange, height, hiddenRef } = useTabsChange(location);

  const { handleLogin, handleRegister, isLoading, snackbar, setSnackbar } =
    useAuth();

  if (isLoading) return <LoadingOverlay title="Подождите" />;

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "95vh",
        bgcolor: "background.default",
        display: "flex",
        justifyContent: "center",
        alignItems: isMobile ? undefined : "center",
        p: isMobile ? 0 : 2,
      }}
    >
      <Container
        sx={{
          height: "70vh",
          display: "flex",
          maxWidth: "1000px !important",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 2 : 4,
            alignItems: "flex-start",
            justifyContent: isMobile ? "flex-start" : "center",
            pt: isMobile ? 2 : undefined,
            width: "100%",
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              height: isMobile ? "auto" : "100%",
              width: isMobile ? "100%" : "50%",
            }}
          > 
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.href = `${process.env.REACT_APP_API_URL}/auth/google/login`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <GoogleIcon />
              <Typography>Войти через Google</Typography>
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => window.location.href = `${process.env.REACT_APP_API_URL}/auth/github/login`}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <GithubIcon />
              <Typography>Войти через GitHub</Typography>
            </Button>
          </Box>

          {isMobile ? <Divider /> : <Divider orientation="vertical" />}

          <Box sx={{ width: "100%" }}>
            <Tabs
              value={tab}
              onChange={(e, v) => handleTabChange(v)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label="Войти" />
              <Tab label="Регистрация" />
            </Tabs>

            <Paper
              elevation={3}
              sx={{
                width: "100%",
                borderRadius: 3,
                p: 0,
                position: "relative",
                borderTopLeftRadius: 0,
                boxShadow: "none",
              }}
            >
              <motion.div
                animate={{ height }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden", padding: 24 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {tab === 0 && <LoginBlock onLogin={handleLogin} />}
                    {tab === 1 && (
                      <RegistrationBlock onRegister={handleRegister} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              <div
                ref={hiddenRef}
                style={{
                  position: "absolute",
                  visibility: "hidden",
                  pointerEvents: "none",
                  top: 0,
                }}
              >
                <div>
                  <LoginBlock onLogin={handleLogin} />
                </div>
                <div>
                  <RegistrationBlock onRegister={handleRegister} />
                </div>
              </div>
            </Paper>
          </Box>
        </Box>
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity || "success"} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Authorization;
