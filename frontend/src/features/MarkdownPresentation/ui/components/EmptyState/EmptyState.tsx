import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Theme } from "../../../../../shared/types";

interface EmptyStateProps {
  theme?: Theme;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ theme }) => {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ height: "89vh", boxSizing: "border-box", width: "100%" }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid #ccc`,
          borderRadius: 2,
          overflow: "hidden",
          background: `linear-gradient(135deg, ${
            theme?.colors.background || "#fff"
          } 0%, ${theme?.colors.paragraph + "22" || "#eee"} 100%)`,
          color: theme?.colors.heading,
          textAlign: "center",
          p: 2,
          transition: "all 0.2s",
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Добро пожаловать!
          </Typography>
          <Typography variant="body1">
            Здесь будут отображаться ваши слайды.
            <br />
            Прикрепите файл и отправьте нашему ИИ сообщение с описанием
            презентации!
          </Typography>
        </Box>
      </Box>
    </motion.div>
  );
};
