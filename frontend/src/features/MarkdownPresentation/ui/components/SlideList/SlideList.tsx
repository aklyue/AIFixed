import React from "react";
import { Box } from "@mui/material";
import { motion } from "framer-motion";
import { PlateSlide, Theme } from "../../../../../shared/types";
import { AppDispatch } from "../../../../../app/store";
import SlideItem from "../SlideItem";
import MiniSlides from "../MiniSlides/MiniSlides";
import SlideToolbar from "../SlideToolbar";

interface SlideListProps {
  slides: PlateSlide[];
  currentSlide: PlateSlide;
  containerRef: React.RefObject<HTMLDivElement | null>;
  theme?: Theme;
  bgImage: string;
  dispatch: AppDispatch;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  currentSlide,
  containerRef,
  theme,
  bgImage,
  dispatch,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          maxWidth: 200,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          borderRadius: 2,
          p: 1,
        }}
      >
        <MiniSlides slides={slides} />
      </Box>

      <Box>
        <Box
          ref={containerRef}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            width: "100%",
          }}
        >
          {slides.map((slide, index) => (
            <motion.div
              key={slide.id}
              id={`slide-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ width: "100%" }}
            >
              <SlideItem
                slide={slide}
                theme={theme}
                bgImage={bgImage}
                dispatch={dispatch}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          height: "100%",
          minWidth: 20,
          overflowY: "auto",
          p: 1,
        }}
      >
        <SlideToolbar slideId={currentSlide.id} />{" "}
      </Box>
    </Box>
  );
};
