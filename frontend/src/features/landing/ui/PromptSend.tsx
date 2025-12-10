import React from "react";
import UploadFileIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useGeneration } from "../../../shared/hooks";
import { useNavigate } from "react-router-dom";
import { LoadingOverlay } from "../../../shared/components";

export const PromptSend: React.FC = () => {
  const {
    inputText,
    setInputText,
    fileInputRef,
    fileStatus,
    handleFileChange,
    handleSubmit,
    loading,
    error,
    setError,
    model,
    setModel,
  } = useGeneration();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    const success = handleSubmit(e);
    navigate("/generate");
  };

  if (loading) return <LoadingOverlay />;

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        p: 2,
        flexDirection: "column",
      }}
    >
      <Box
        textAlign="center"
        sx={{
          maxWidth: 1200,
          mb: 4,
        }}
      >
        <Typography
          variant={isMobile ? "h4" : "h2"}
          fontWeight="bold"
          sx={{
            m: 0,
            color: "text.primary",
            maxWidth: 1000,
          }}
        >
          Создавайте презентации без усилий за короткое время
        </Typography>
        <Typography
          variant={isMobile ? "subtitle1" : "h5"}
          sx={{
            margin: 0,
            mt: 2,
            color: "text.secondary",
            maxWidth: 1000,
          }}
        >
          Трансформируйте свои идеи в профессиональные презентации. Просто
          напишите свои мысли и ИИ сделает всё остальное.
        </Typography>
      </Box>

      <form
        onSubmit={onSubmit}
        style={{
          padding: "8px 8px",
          maxWidth: isMobile ? "100%" : "1000px",
          width: "100%",
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={6}
          maxRows={10}
          size="small"
          placeholder="Прикрепите файл и введите в поле то, что хотите получить от ИИ в презентации."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              pr: 1,
              boxShadow: 4,
              backgroundColor: "background.paper",
              color: "text.primary",
            },
          }}
        />

        <Box
          mt={2}
          display="flex"
          alignItems="center"
          flexDirection={isMobile ? "column" : "row"}
          justifyContent="space-between"
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".pdf,.docx,.pptx,.txt,.md"
            onChange={handleFileChange}
          />

          <Box
            width={isMobile ? "100%" : undefined}
            display={"flex"}
            justifyContent={"space-between"}
            mb={isMobile ? 2 : undefined}
          >
            <Button
              onClick={() => fileInputRef.current?.click()}
              startIcon={
                fileStatus?.converted ? <CheckCircleIcon /> : <UploadFileIcon />
              }
              variant="outlined"
              sx={{
                height: 40,
                borderRadius: "8px",
                color: "primary.main",
                borderColor: "primary.main",
                maxWidth: isMobile ? "100%" : 200,
                px: 2,
                justifyContent: "flex-start",
                textTransform: "none",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <Box
                component="span"
                sx={{
                  display: "inline-block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  verticalAlign: "middle",
                }}
              >
                {fileStatus?.name || "Прикрепить файл"}
              </Box>
            </Button>

            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              sx={{
                height: 40,
                ml: 2,
                maxWidth: isMobile ? "100%" : 200,
                borderRadius: "8px",
                color: "text.primary",
                bgcolor: "background.paper",
                border: `1px solid ${theme.palette.primary.main}`,
                textTransform: "none",
                fontSize: 15,
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  pl: 2,
                  pr: 4,
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "& .MuiSelect-icon": {
                  color: "primary.main",
                  right: 10,
                },
                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <MenuItem value="google/gemma-3-12b-it">gemma-3-12b-it</MenuItem>
              <MenuItem value="moonshotai/kimi-k2-0905">kimi-k2-0905</MenuItem>
              <MenuItem value="openai/gpt-oss-120b">gpt-oss-120b</MenuItem>
            </Select>
          </Box>

          <Button
            type="submit"
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={{
              height: 50,
              borderRadius: "12px",
              bgcolor: "primary.main",
              textTransform: "none",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
              width: isMobile ? "100%" : undefined,
            }}
          >
            Сгенерировать
          </Button>
        </Box>
      </form>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ zIndex: 2000 }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{
            width: "100%",
            color: "error.contrastText",
            bgcolor: "error.main",
            zIndex: 1101,
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};
