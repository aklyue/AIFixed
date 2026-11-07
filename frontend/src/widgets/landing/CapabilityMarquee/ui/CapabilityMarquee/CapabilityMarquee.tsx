import { Box, Container, Typography } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { LandingSectionMarker } from "../../../../../shared/ui";
import { capabilityVectors } from "../../lib/constants/capabilityVectors";

const CapabilityVectorTrack = ({
  reverse = false,
  reducedMotion,
}: {
  reverse?: boolean;
  reducedMotion: boolean;
}) => {
  const repeatedCapabilityVectors = [
    ...capabilityVectors,
    ...(!reducedMotion ? capabilityVectors : []),
  ];

  return (
    <motion.div
      animate={
        reducedMotion
          ? undefined
          : { x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }
      }
      transition={{
        duration: reverse ? 34 : 40,
        ease: "linear",
        repeat: Infinity,
      }}
      style={{
        display: "flex",
        width: reducedMotion ? "100%" : "max-content",
        flexWrap: reducedMotion ? "wrap" : "nowrap",
      }}
    >
      {repeatedCapabilityVectors.map((capabilityVector, vectorIndex) => (
        <Box
          key={`${capabilityVector}-${vectorIndex}`}
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            px: { xs: 2.5, md: 4 },
            py: { xs: 2, md: 2.5 },
            borderRight: "1px solid",
            borderColor: "divider",
            color: vectorIndex % 2 === 0 ? "text.secondary" : "text.primary",
            whiteSpace: "nowrap",
            fontSize: { xs: "0.85rem", md: "0.95rem" },
            fontWeight: vectorIndex % 2 === 0 ? 400 : 500,
            letterSpacing: "0.015em",
          }}
        >
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              width: 7,
              height: 7,
              flexShrink: 0,
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: vectorIndex % 2 === 0 ? 0.42 : 0.72,
            }}
          />
          {capabilityVector}
        </Box>
      ))}
    </motion.div>
  );
};

const CapabilityMarquee = () => {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <Box
      component="section"
      aria-labelledby="capability-marquee-title"
      sx={{ py: { xs: 7, md: 9 }, overflow: "hidden" }}
    >
      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 1, sm: 2 },
          }}
        >
          <Box>
            <LandingSectionMarker
              label="Всё для презентаций"
              variant="capabilityVector"
              centered
            />
            <Typography
              component="p"
              variant="h6"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 1 }}
            >
              Рабочий процесс в одном месте
            </Typography>
            <Typography
              id="capability-marquee-title"
              component="h2"
              variant="h4"
              fontWeight={700}
              textAlign="center"
              sx={{ fontSize: { xs: "1.35rem", sm: "2rem", md: "2.35rem" } }}
            >
              От исходных материалов до готовых слайдов
            </Typography>
          </Box>
        </Box>
      </Container>

      <Box
        aria-label={capabilityVectors.join(", ")}
        sx={{
          overflow: "hidden",
          borderTop: "1px solid",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <CapabilityVectorTrack reducedMotion={reducedMotion} />
        <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
          <CapabilityVectorTrack reverse reducedMotion={reducedMotion} />
        </Box>
      </Box>
    </Box>
  );
};

export default CapabilityMarquee;
