import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../../app/store";
import { useState } from "react";
import {
  pushHistory,
  updateBlock,
} from "../../../../../../app/store/slices/editorSlice";

interface useResizeImageProps {
  slideId: string;
  blockId: string;
  horizontal?: boolean;
  inverted?: boolean;
}

export const useResizeImage = ({
  slideId,
  blockId,
  horizontal,
  inverted,
}: useResizeImageProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const block = useSelector((state: RootState) => {
    const slide = state.editor.slides.find((s) => s.id === slideId);
    return slide?.content.find((b) => b.id === blockId);
  });

  const theme = useSelector((state: RootState) =>
    state.editor.availableThemes.find(
      (t) => t.id === state.editor.globalThemeId
    )
  );

  const [dragging, setDragging] = useState(false);

  if (!block) {
    return {
      sizeValue: 0,
      sliderStyle: { top: 0, left: 0, width: 0, height: 0 },
      startResize: () => {},
      block: undefined,
      theme: undefined,
    };
  }

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    const startPos = horizontal ? e.clientX : e.clientY;
    const startSize = horizontal
      ? block.widthPercent ?? 45
      : block.heightPercent ?? 20;
    const sensitivity = horizontal ? 0.11 : 0.2;

    const onMouseMove = (eMove: MouseEvent) => {
      let delta = (horizontal ? eMove.clientX : eMove.clientY) - startPos;
      if (inverted) delta = -delta;
      const newSize = Math.min(
        Math.max(startSize + delta * sensitivity, 10),
        90
      );
      dispatch(
        updateBlock({
          id: block.id,
          newBlock: horizontal
            ? { ...block, widthPercent: newSize }
            : { ...block, heightPercent: newSize },
        })
      );
    };

    const onMouseUp = () => {
      setDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dispatch(pushHistory());
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const sizeValue = horizontal
    ? block.widthPercent ?? 45
    : block.heightPercent ?? 20;
  const sliderStyle = horizontal
    ? inverted
      ? { top: 0, left: 0, width: 6, height: "100%" }
      : { top: 0, right: 0, width: 6, height: "100%" }
    : inverted
    ? { top: 0, left: 0, width: "100%", height: 6 }
    : { bottom: 0, left: 0, width: "100%", height: 6 };

  return {
    sizeValue,
    sliderStyle,
    startResize,
    block,
    theme,
    dragging,
  };
};
