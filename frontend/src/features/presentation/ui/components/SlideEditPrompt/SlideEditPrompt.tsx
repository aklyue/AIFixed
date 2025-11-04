import React from "react";
import {
  Box,
  IconButton,
  Button,
  TextField,
  Snackbar,
  Alert,
  lighten,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { PlateSlide, Theme } from "../../../../../shared/types/markdownTypes";
import { motion, AnimatePresence } from "framer-motion";
import SlideContent from "../../../blocks/SlideContent";

import { LoadingOverlay } from "../../../../../shared/components";
import { buttonAttributes } from "../../../../../shared/constants/buttonAttributes";
import { useSlideActions, useSlideApiAction } from "../../hooks";
import EditSlideDialog from "../EditSlideDialog";

interface SlideWithEditorProps {
  currentSlide: PlateSlide;
  theme?: Theme;
  slideHeight: number;
  setSlideContent: (content: any) => void;
  renderBlock: (block: any) => React.ReactNode;
}

const SlideEditPrompt: React.FC<SlideWithEditorProps> = ({
  currentSlide,
  theme,
  setSlideContent,
  renderBlock,
}) => {
  const {
    loading,
    handleSave,
    handleChange,
    editing,
    error,
    selectedBtn,
    setSelectedBtn,
    textValue,
    setTextValue,
    setEditing,
    setError,
  } = useSlideApiAction(currentSlide);

  const {
    handleUpdateSlideLayout,
    setSelectedLayout,
    selectedLayout,
    slideEditing,
    setSlideEditing,
  } = useSlideActions();

  if (loading) return <LoadingOverlay />;
  return (
    <Box
      id={currentSlide.id}
      sx={{
        position: "relative",
        height: "100%",
        // border: `1px solid #ccc`,
        boxShadow: 2,
        borderRadius: 2,
        overflow: "hidden",
        flexShrink: 0,
        transition: "all 0.2s",
        "&:hover": {
          // border: `1px solid ${theme?.colors.heading}`,
          "& .hoverIcon": {
            opacity: 1,
            transform: "translateY(0)",
          },
        },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AnimatePresence mode="popLayout">
        {editing ? (
          <motion.div
            key="editor-open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              height: "100%",
              width: "100%",
            }}
          >
            <Box sx={{ p: 2, height: "100%", boxSizing: "border-box" }}>
              <TextField
                value={textValue}
                onChange={(e) => {
                  setSelectedBtn(null);
                  setTextValue(e.target.value);
                }}
                multiline
                label="Редактировать"
                minRows={5}
                maxRows={10}
                placeholder="Введите промпт или текст..."
                sx={{
                  width: "100%",

                  boxSizing: "border-box",
                  fontFamily: "Arial",
                  fontSize: 16,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 4,
                    color: "#a5a5a5ff",
                    resize: "none",
                  },
                  "& .MuiFormLabel-root": {
                    color: "#777777ff",
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                {buttonAttributes.map((btn) => {
                  const isSelected = selectedBtn === btn.dataAttr;

                  return (
                    <Button
                      key={btn.id}
                      variant={isSelected ? "contained" : "outlined"}
                      size="small"
                      sx={{
                        borderRadius: 2,
                        minWidth: 100,
                        minHeight: 20,
                        mt: 1,
                        px: 0,
                        bgcolor: isSelected ? "primary.main" : "rgba(0,0,0,0)",
                        color: isSelected ? "#fff" : "primary.main",
                        "&:hover": {
                          bgcolor: isSelected ? "primary.main" : "primary.main",
                          color: "#fff",
                        },
                      }}
                      data-attribute={btn.dataAttr}
                      title={btn.tooltip}
                      onClick={() => handleChange(btn.dataAttr)}
                    >
                      {btn.label}
                    </Button>
                  );
                })}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-start",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Button
                  onClick={() => setEditing(false)}
                  variant="outlined"
                  sx={{
                    height: 50,
                    borderRadius: "12px",
                    color: "primary.main",
                    borderColor: "primary.main",
                    px: 2,
                    justifyContent: "flex-start",
                    textTransform: "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    "&:hover": { bgcolor: lighten("#2e2e2e", 0.95) },
                  }}
                >
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSave(currentSlide)}
                  startIcon={<PlayArrowIcon />}
                  disabled={loading}
                  sx={{
                    height: 50,
                    borderRadius: "12px",
                    bgcolor: "primary.main",
                    textTransform: "none",
                    color: "white",
                    "&:hover": { bgcolor: "primary.main" },
                  }}
                >
                  {"Сгенерировать"}
                </Button>
              </Box>
            </Box>
          </motion.div>
        ) : (
          <motion.div
            key="editor-closed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ height: "100%" }}
          >
            <SlideContent
              isMini={false}
              slide={currentSlide}
              setSlideContent={setSlideContent}
              renderBlock={renderBlock}
            />

            <IconButton
              className="hoverIcon"
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "white",
                boxShadow: 1,
                opacity: 0,
                transform: "translateY(-5px)",
                transition: "all 0.2s ease",
                zIndex: 10,
                "&:hover": { bgcolor: "#eee" },
              }}
              onClick={() => setEditing(true)}
            >
              <AutoAwesomeIcon sx={{ color: theme?.colors.heading }} />
            </IconButton>
            <IconButton
              className="hoverIcon"
              size="small"
              sx={{
                position: "absolute",
                top: 8,
                right: 48,
                bgcolor: "white",
                boxShadow: 1,
                opacity: 0,
                transform: "translateY(-5px)",
                transition: "all 0.2s ease",
                zIndex: 10,
                "&:hover": { bgcolor: "#eee" },
              }}
              onClick={() => setSlideEditing(true)}
            >
              <EditIcon sx={{ color: theme?.colors.heading }} />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>
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

      <EditSlideDialog
        handleChangeSlide={handleUpdateSlideLayout}
        selectedLayout={selectedLayout}
        setSelectedLayout={setSelectedLayout}
        setSlideEditing={setSlideEditing}
        slideEditing={slideEditing}
      />
    </Box>
  );
};

export default SlideEditPrompt;
