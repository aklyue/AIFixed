import { Box } from "@mui/material";
import { PromptSend } from "../../features";
import { FeaturesBlock } from "../../widgets/landing/FeaturesBlock";
import { WhyUsBlock } from "../../widgets/landing/WhyUsBlock";
import { HowItWorksBlock } from "../../widgets/landing/HowItWorksBlock";
import { QuickStartBlock } from "../../widgets/landing/QuickStartBlock";
import { StartBlock } from "../../widgets/landing/StartBlock";
import { LoadingOverlay } from "../../shared/ui";
import { usePromptPageLoading } from "../../features/presentation/generatePresentation";

const PromptPage = () => {
  const loading = usePromptPageLoading();

  if (loading) return <LoadingOverlay />;
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at 20% 20%, rgba(51,78,104,0.03) 0%, transparent 60%),
            radial-gradient(circle at 80% 40%, rgba(51,78,104,0.03) 0%, transparent 60%),
            radial-gradient(circle at 50% 80%, rgba(51,78,104,0.03) 0%, transparent 60%)
          `,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <PromptSend />
        <FeaturesBlock />
        <WhyUsBlock />
        <HowItWorksBlock />
        <QuickStartBlock />
        <StartBlock />
      </Box>
    </Box>
  );
};

export default PromptPage;
