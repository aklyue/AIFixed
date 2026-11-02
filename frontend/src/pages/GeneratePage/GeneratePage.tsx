import { Box, lighten } from "@mui/material";
import {
  BlockGeneration,
  useGeneratePageTheme,
} from "../../features/presentation/generatePresentation";

const GeneratePage = () => {
  const theme = useGeneratePageTheme();
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        bgcolor: lighten(theme?.colors.background || "#ffffff", 0.3),
        transition: "all 0.2s",
      }}
    >
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <BlockGeneration />
      </Box>
    </Box>
  );
};

export default GeneratePage;
