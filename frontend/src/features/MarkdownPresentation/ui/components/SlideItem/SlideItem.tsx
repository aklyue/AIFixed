import React, { useState } from "react";
import { Box, IconButton, darken } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { Theme, SlideBlock, PlateSlide } from "../../../../../shared/types";
import { AppDispatch } from "../../../../../app/store";
import { updateBlock } from "../../../../../app/store/slices/editorSlice";
import SlideEditPrompt from "../SlideEditPrompt";
import { RenderBlock } from "../../../blocks/RenderBlock";

const slideWidth = 1100;
const slideHeight = 518;

interface SlideItemProps {
  slide: PlateSlide;
  theme?: Theme;
  bgImage: string;
  dispatch: AppDispatch;
}

export const SlideItem: React.FC<SlideItemProps> = ({
  slide,
  theme,
  bgImage,
  dispatch,
}) => {
  const [editingBlock, setEditingBlock] = useState<{
    type: string;
    id: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const setSlideContent = (blocks: SlideBlock[]) => {
    blocks.forEach((b) => dispatch(updateBlock({ id: b.id, newBlock: b })));
  };

  const renderBlock = (block: SlideBlock) => (
    <RenderBlock
      key={block.id}
      block={block}
      id={block.id}
      slideId={slide.id}
      editingBlock={editingBlock}
      editValue={editValue}
      setEditValue={setEditValue}
      setEditingBlock={setEditingBlock}
      isMini={false}
    />
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "space-between",
          boxShadow: "0 6px 14px rgba(0,0,0,0.15)",
          borderRadius: 2,
          transition: "all 0.2s",
        }}
      >
        <Box
          id={slide.id}
          sx={{
            position: "relative",
            width: slideWidth,
            maxWidth: "100%",
            aspectRatio: "16/9",
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            overflow: "hidden",
            background: bgImage,
            transition: "all 0.2s",
            "&:hover": {
              boxShadow: `0 0 0 2px ${theme?.colors.heading}`,
              "& .hoverIcon": {
                opacity: 1,
                transform: "translateY(0)",
              },
            },
          }}
        >
          <SlideEditPrompt
            currentSlide={slide}
            renderBlock={renderBlock}
            setSlideContent={setSlideContent}
            slideHeight={slideHeight}
            theme={theme}
          />
        </Box>
      </Box>

      <Box textAlign="center">
        <IconButton
          size="large"
          sx={{
            border: `1px solid #ccc`,
            bgcolor: "white",
            transform: "translateY(-50%)",
            transition: "all 0.2s",
            "&:hover": {
              bgcolor: darken("#ffffff", 0.04),
              border: `1px solid ${theme?.colors.heading}`,
            },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>
    </>
  );
};
