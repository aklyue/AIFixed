import React from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  List,
  ListItem,
  Typography,
  darken,
  Snackbar,
  Alert,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import FileIcon from "@mui/icons-material/FileOpen";
import SendIcon from "@mui/icons-material/Send";
import { useGeneration } from "../../../shared/hooks";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { Theme } from "../../../shared/types";
import { LoadingOverlay } from "../../../shared/components";

export const AiChat: React.FC = () => {
  const {
    inputText,
    setInputText,
    messages,
    fileInputRef,
    handleFileChange,
    handleSubmit,
    fileStatus,
    error,
    setError,
    loading,
  } = useGeneration();

  const theme: Theme | undefined = useSelector((state: RootState) =>
    state.editor.availableThemes.find(
      (t) => t.id === state.editor.globalThemeId
    )
  );

  if (loading) return <LoadingOverlay />;

  return (
    <AnimatePresence mode="wait">
      <Box
        component={motion.div}
        sx={{
          display: "flex",
          flexDirection: "column",
          m: 1,
          mr: 0,
          border: `1px solid #334e684a`,
          borderRadius: 4,
          minHeight: 300,
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            p: 1,
            height: 40,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          <AutoAwesomeIcon sx={{ color: "#334e68" }} />
          <Typography sx={{ color: "#334e68" }}>
            <strong>AI Generate</strong>
          </Typography>
        </Box>
        <Paper
          elevation={3}
          sx={{
            height: "100%",
            overflowY: "auto",
            boxShadow: "none",
            borderTop: `1px solid ${theme?.colors.paragraph + "4a"}`,
            borderBottom: `1px solid ${theme?.colors.paragraph + "4a"}`,
            borderRadius: 0,
            p: 1,
          }}
        >
          <List sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItem
                    style={{
                      display: "flex",
                      padding: 0,
                      justifyContent:
                        msg.type === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "75%",
                        borderRadius: 4,
                        bgcolor:
                          msg.type === "user"
                            ? darken("#f5f8ff", 0.1)
                            : darken("#f5f8ff", 0.05),
                        color: "#334e68",
                        p: 1.5,
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                        transition: "all 0.2s",
                      }}
                    >
                      <Typography variant="body1">{msg.content}</Typography>
                      {msg.file && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            bgcolor: darken("#f5f8ff", 0.14),
                            borderRadius: 1,
                            mt: 0.5,
                            p: 0.5,
                          }}
                        >
                          <FileIcon fontSize="small" />
                          <Typography
                            variant="caption"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              ml: 0.5,
                            }}
                          >
                            {msg.file.name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </ListItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </Paper>

        <form onSubmit={handleSubmit} style={{ padding: "8px 8px" }}>
          <Box display="flex" gap={1}>
            <TextField
              fullWidth
              size="small"
              label="Prompt"
              placeholder="Введите сообщение..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  pr: 1,
                },
              }}
              InputProps={{
                endAdornment: (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Upload file"
                      sx={{
                        minWidth: 28,
                        borderRadius: "50%",
                        p: 0.5,
                        color: "#334e68",
                        "&:hover": { bgcolor: "#334e68" + "12" },
                      }}
                    >
                      {fileStatus?.converted ? (
                        <CheckCircleIcon fontSize="small" />
                      ) : (
                        <UploadFileIcon fontSize="small" />
                      )}
                    </Button>
                  </>
                ),
              }}
            />
            <Button
              variant="contained"
              type="submit"
              aria-label="Send"
              sx={{
                color: "#334e68",
                bgcolor: "rgba(0,0,0,0)",
                border: `1px solid #334e68`,
                transition: "all 0.2s",
                borderRadius: "12px",
                p: 0.5,
                minWidth: 50,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#334e68" + "12",
                  color: "#334e68",
                  boxShadow: "none",
                },
              }}
            >
              <SendIcon />
            </Button>
          </Box>
        </form>
      </Box>
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </AnimatePresence>
  );
};
