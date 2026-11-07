import { Box, Container, Typography } from "@mui/material";
import {
  motion,
  MotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import {
  LandingSectionMarker,
  PresentationCanvas,
} from "../../../../../shared/ui";
import {
  PresentationWorkflowStep,
  presentationWorkflowSteps,
} from "../../lib/constants/presentationWorkflowSteps";

const workflowCardProgressRanges: number[][] = [
  [0, 0.34, 0.44],
  [0.34, 0.44, 0.68, 0.78],
  [0.68, 0.78, 1],
];

const PresentationWorkflowCard = ({
  step,
  stepIndex,
  scrollProgress,
  reducedMotion,
}: {
  step: PresentationWorkflowStep;
  stepIndex: number;
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean;
}) => {
  const stepScrollRanges = workflowCardProgressRanges[stepIndex];
  const stepOpacity = useTransform(
    scrollProgress,
    stepScrollRanges,
    stepIndex === 0
      ? [1, 1, 0]
      : stepIndex === 2
        ? [0, 1, 1]
        : [0, 1, 1, 0],
  );
  const stepVerticalOffset = useTransform(
    scrollProgress,
    stepScrollRanges,
    stepIndex === 0
      ? [0, 0, -48]
      : stepIndex === 2
        ? [56, 0, 0]
        : [56, 0, 0, -48],
  );
  const stepScale = useTransform(
    scrollProgress,
    stepScrollRanges,
    stepIndex === 0
      ? [1, 1, 0.96]
      : stepIndex === 2
        ? [0.95, 1, 1]
        : [0.95, 1, 1, 0.96],
  );

  return (
    <motion.article
      aria-label={`Этап ${step.index}: ${step.title}`}
      style={
        reducedMotion
          ? { position: "relative", opacity: 1 }
          : {
              position: "absolute",
              inset: 0,
              opacity: stepOpacity,
              y: stepVerticalOffset,
              scale: stepScale,
              zIndex: stepIndex + 1,
              pointerEvents: "none",
            }
      }
    >
      <motion.div
        initial={
          stepIndex === 0 && !reducedMotion
            ? { opacity: 0, y: 24 }
            : false
        }
        whileInView={stepIndex === 0 ? { opacity: 1, y: 0 } : undefined}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ height: reducedMotion ? "auto" : "100%" }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            alignItems: "center",
            gap: { xs: 1, md: 5 },
            height: reducedMotion ? "auto" : "100%",
            p: { xs: 2.5, sm: 4, md: 6 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: { xs: 3, md: 4 },
            bgcolor: "background.paper",
            boxShadow: "0 24px 80px rgba(46, 46, 46, 0.08)",
          }}
        >
          <Box sx={{ maxWidth: 560 }}>
            <Typography
              component="p"
              variant="overline"
              sx={{
                color: "text.secondary",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {step.index} / {step.label}
            </Typography>
            <Typography
              component="h3"
              variant="h4"
              sx={{
                mt: 1,
                fontSize: { xs: "1.45rem", sm: "1.8rem", md: "2.25rem" },
                lineHeight: 1.25,
                fontWeight: 700,
              }}
            >
              {step.title}
            </Typography>
            <Typography
              component="p"
              variant="body1"
              color="text.secondary"
              sx={{
                mt: 2,
                maxWidth: 520,
                lineHeight: 1.8,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              {step.description}
            </Typography>
          </Box>

          <Box
            sx={{
              height: { xs: 125, sm: 180, md: 250 },
              minWidth: 0,
              borderRadius: 3,
              bgcolor: "rgba(119, 119, 119, 0.06)",
              overflow: "hidden",
            }}
          >
            <PresentationCanvas variant={step.variant} />
          </Box>
        </Box>
      </motion.div>
    </motion.article>
  );
};

const PresentationWorkflow = () => {
  const workflowSectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const { scrollYProgress: workflowScrollProgress } = useScroll({
    target: workflowSectionRef,
    offset: ["start start", "end end"],
  });

  return (
    <Box
      ref={workflowSectionRef}
      component="section"
      aria-labelledby="presentation-workflow-title"
      sx={{
        position: "relative",
        height: reducedMotion ? "auto" : { xs: "280vh", md: "300vh" },
      }}
    >
      <Box
        sx={{
          position: reducedMotion ? "relative" : "sticky",
          top: 0,
          display: "flex",
          alignItems: "center",
          minHeight: reducedMotion ? "auto" : "100vh",
          overflow: reducedMotion ? "visible" : "hidden",
          bgcolor: "background.default",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
          <Box sx={{ mb: { xs: 2, md: 4 } }}>
            <LandingSectionMarker
              label="От запроса до результата"
              variant="journeyVector"
            />
            <Typography
              id="presentation-workflow-title"
              component="h2"
              variant="h4"
              fontWeight={700}
              sx={{
                maxWidth: 760,
                textAlign: { xs: "center", md: "left" },
                mx: { xs: "auto", md: 0 },
                fontSize: { xs: "1.65rem", sm: "2rem", md: "2.5rem" },
              }}
            >
              Презентация собирается шаг за шагом
            </Typography>
          </Box>

          <Box
            sx={{
              position: "relative",
              height: reducedMotion
                ? "auto"
                : {
                    xs: "min(410px, calc(100vh - 205px))",
                    sm: "min(440px, calc(100vh - 220px))",
                    md: 390,
                  },
              display: reducedMotion ? "flex" : "block",
              flexDirection: "column",
              gap: reducedMotion ? 2 : 0,
              perspective: "1200px",
            }}
          >
            {presentationWorkflowSteps.map((step, stepIndex) => (
              <PresentationWorkflowCard
                key={step.index}
                step={step}
                stepIndex={stepIndex}
                scrollProgress={workflowScrollProgress}
                reducedMotion={reducedMotion}
              />
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default PresentationWorkflow;
