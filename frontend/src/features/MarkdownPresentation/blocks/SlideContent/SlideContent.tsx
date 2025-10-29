import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { PlateSlide, SlideBlock } from "../../../../shared/types";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBlock from "../SortableBlock";
import ImageColumnLayout from "./components/ImageColumnLayout";
import ImageRowLayout from "./components/ImageRowLayout";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../app/store";
import { updateSlideContent } from "../../../../app/store/slices/editorSlice";

interface Props {
  isMini?: boolean;
  slide: PlateSlide;
  setSlideContent: (blocks: SlideBlock[]) => void;
  renderBlock: (block: SlideBlock) => React.ReactNode;
}

export const SlideContent: React.FC<Props> = ({
  isMini,
  slide,
  renderBlock,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const sensors = useSensors(useSensor(PointerSensor));

  const imageBlocks = slide.content.filter((b) => b.type === "image");
  const contentBlocks = slide.content.filter((b) => b.type !== "image");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const newContent = arrayMove(
        [...slide.content],
        slide.content.findIndex((b) => b.id === active.id),
        slide.content.findIndex((b) => b.id === over.id)
      );
      dispatch(updateSlideContent({ slideId: slide.id, newContent }));
    }
  };

  const renderContentBlocks = () => (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        pl: 0,
        justifyContent: slide.alignItems,
      }}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentBlocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {contentBlocks.map((block, idx) => (
            <SortableBlock
              key={block.id}
              idx={idx}
              slideId={slide.id}
              block={block}
              renderBlock={renderBlock}
            />
          ))}
        </SortableContext>
      </DndContext>
    </Box>
  );

  const firstImage = imageBlocks[0];

  switch (slide.layout) {
    case "left-image":
    case "right-image":
      console.log("Рендерим ImageColumnLayout");
      if (!firstImage) return renderContentBlocks();
      return (
        <ImageColumnLayout
          slide={slide}
          slideId={slide.id}
          blockId={firstImage.id}
          layout={slide.layout}
        >
          {renderContentBlocks()}
        </ImageColumnLayout>
      );
    case "top-image":
    case "bottom-image":
      if (!firstImage) return renderContentBlocks();
      return (
        <ImageRowLayout
          slide={slide}
          slideId={slide.id}
          blockId={firstImage.id}
          layout={slide.layout}
        >
          {renderContentBlocks()}
        </ImageRowLayout>
      );
    case "center":
    case "text-only":
    default:
      return (
        <Box>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              height: "100%",
              boxSizing: "border-box",
              p: 4,
              overflowY: "auto",
              justifyContent: slide.alignItems,
            }}
          >
            {renderContentBlocks()}
          </Box>
        </Box>
      );
  }
};
