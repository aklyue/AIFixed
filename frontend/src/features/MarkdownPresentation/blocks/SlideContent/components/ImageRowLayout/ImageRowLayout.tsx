import React from "react";
import { Box } from "@mui/material";
import ResizableImage from "../ResizableImage";
import { PlateSlide } from "../../../../../../shared/types";

interface Props {
  slide: PlateSlide;
  slideId: string;
  blockId: string;
  layout: "top-image" | "bottom-image";
  children: React.ReactNode;
}

const ImageRowLayout: React.FC<Props> = ({
  slide,
  slideId,
  blockId,
  layout,
  children,
}) => {
  const inverted = layout === "bottom-image";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
        width: "100%",
        height: "100%",
        justifyContent: slide.alignItems,
      }}
    >
      {layout === "top-image" && (
        <ResizableImage
          slideId={slideId}
          blockId={blockId}
          horizontal={false}
          inverted={inverted}
        />
      )}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          p: 4,
          overflowY: "hidden",
        }}
      >
        {children}
      </Box>
      {layout === "bottom-image" && (
        <ResizableImage
          slideId={slideId}
          blockId={blockId}
          horizontal={false}
          inverted={inverted}
        />
      )}
    </Box>
  );
};

export default ImageRowLayout;
