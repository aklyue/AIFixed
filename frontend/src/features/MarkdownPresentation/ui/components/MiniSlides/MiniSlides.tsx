import { PlateSlide, SlideBlock, Theme } from "../../../../../shared/types";
import { Box, Typography } from "@mui/material";
import SlideContent from "../../../blocks/SlideContent";
import { RenderBlock } from "../../../blocks/RenderBlock";
import { motion } from "framer-motion";
import { useMiniSlidesActions } from "../../hooks";

const slideWidth = 1100;
const slideHeight = 618;

const MiniSlides: React.FC<{ slides: PlateSlide[] }> = ({ slides }) => {
  const { currentIndex, containerRef, handleSlideClick, theme } =
    useMiniSlidesActions(slides);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: 145,
        height: "80vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        justifyContent: "flex-start",
        userSelect: "none",
        position: "fixed",
      }}
    >
      {slides.map((slide, i) => (
        <Box
          component={motion.div}
          key={slide.id}
          onClick={() => handleSlideClick(slide.id, i)}
          layout
          initial={false}
          animate={{
            borderColor: i === currentIndex ? theme?.colors.heading : "none",
          }}
          whileHover={{ borderColor: theme?.colors.paragraph }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          sx={{
            width: "100%",
            boxSizing: "border-box",
            boxShadow: 1,
            minHeight: 80,
            borderRadius: 0.7,
            overflow: "hidden",
            borderStyle: "solid",
            borderWidth: 1,
            cursor: "pointer",
            position: "relative",
            transition: "all 0.2s",
            background: theme?.colors.background || "#fff",
          }}
        >
          <Box
            id={`mini-${slide.id}`}
            sx={{
              zoom: 0.13,
              transformOrigin: "top left",
              width: slideWidth,
              height: slideHeight,
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <SlideContent
              isMini={true}
              slide={slide}
              setSlideContent={() => {}}
              renderBlock={(block: SlideBlock) => (
                <Box
                  data-block-id={block.id}
                  sx={{
                    width: "100%",
                  }}
                >
                  <RenderBlock
                    key={block.id}
                    block={block}
                    id={block.id}
                    slideId={slide.id}
                    editingBlock={null}
                    editValue=""
                    setEditValue={() => {}}
                    setEditingBlock={() => {}}
                    isMini={true}
                  />
                </Box>
              )}
            />
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: 4,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme?.colors.heading,
                fontFamily: theme?.fonts.heading,
                fontWeight: "bold",
                backgroundColor: "rgba(255, 255, 255, 0)",
                px: 1,
                borderRadius: "4px",
              }}
            >
              {i + 1}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default MiniSlides;
