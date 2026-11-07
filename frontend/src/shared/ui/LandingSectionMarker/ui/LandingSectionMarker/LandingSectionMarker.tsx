import { Box, Chip } from "@mui/material";
import { PixelCanvas } from "../../../PixelCanvas";
import type { PixelCanvasVariant } from "../../../PixelCanvas";

interface LandingSectionMarkerProps {
  label: string;
  variant: PixelCanvasVariant;
  centered?: boolean;
}

const LandingSectionMarker = ({
  label,
  variant,
  centered = false,
}: LandingSectionMarkerProps) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: centered ? "center" : "flex-start",
      gap: 1,
      mb: 1,
    }}
  >
    <Chip
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box
            aria-hidden="true"
            sx={{
              width: variant === "heroMatrix" ? 32 : 28,
              height: variant === "heroMatrix" ? 32 : 28,
              flexShrink: 0,
            }}
          >
            <PixelCanvas variant={variant} />
          </Box>
          <span>{label}</span>
        </Box>
      }
      size="small"
      variant="outlined"
      sx={{
        height: variant === "heroMatrix" ? 36 : 32,
        px: 0.5,
        borderColor: "divider",
        bgcolor: "background.paper",
        color: "text.secondary",
        fontWeight: 600,
        letterSpacing: "0.025em",
      }}
    />
  </Box>
);

export default LandingSectionMarker;
