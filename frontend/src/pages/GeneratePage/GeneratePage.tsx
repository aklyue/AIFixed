import { Box } from "@mui/material";
import { BlockGeneration } from "../../features/BlockGeneration";

function GeneratePage() {
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
          position: "relative",
          zIndex: 1,
        }}
      >
        <BlockGeneration />
      </Box>
    </Box>
  );
}

export default GeneratePage;
