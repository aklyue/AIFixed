import { Box } from "@mui/material";
import { PromptSend } from "../../features";
import FeaturesBlock from "../../features/PromptSend/blocks/FeaturesBlock";
import WhyUsBlock from "../../features/PromptSend/blocks/WhyUsBlock";
import HowItWorksBlock from "../../features/PromptSend/blocks/HowItWorksBlock";
import QuickStartBlock from "../../features/PromptSend/blocks/QuickStartBlock";
import { LoadingOverlay } from "../../shared/components";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

function PromptPage() {
  const { loading } = useSelector((state: RootState) => state.prompt);

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
        <HowItWorksBlock videoUrl="https://www.youtube.com/embed/UUePLJeFqVQ" />
        <QuickStartBlock />
      </Box>
    </Box>
  );
}

export default PromptPage;
