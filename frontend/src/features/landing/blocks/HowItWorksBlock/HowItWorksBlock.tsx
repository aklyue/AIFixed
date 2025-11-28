import React from "react";
import { Box, Container, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";

interface HowItWorksBlockProps {
  videoUrl: string;
}

export const HowItWorksBlock: React.FC<HowItWorksBlockProps> = ({
  videoUrl,
}) => {
  const theme = useTheme();

  return (
    <Container sx={{ py: 10, maxWidth: "1200px !important" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          mb: 6,
        }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
          textAlign="center"
          sx={{ mb: 1 }}
        >
          Как это работает
        </Typography>
        <Typography
          variant="h4"
          color="text.primary"
          textAlign="center"
          fontWeight={700}
          maxWidth={700}
        >
          Создавайте презентации за несколько шагов
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <motion.iframe
          src={videoUrl}
          title="How it works"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{
            width: "100%",
            maxWidth: "900px",
            height: "500px",
            border: "none",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        />
      </Box>
    </Container>
  );
};
