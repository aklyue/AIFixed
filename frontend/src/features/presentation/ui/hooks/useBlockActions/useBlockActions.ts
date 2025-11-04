import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../app/store";
import {
  pushHistory,
  updateSlideContent,
} from "../../../../../app/store/slices/editorSlice";
import { SlideBlock } from "../../../../../shared/types";
import { v4 as uuidv4 } from "uuid";

interface useBlockProps {
  slideId: string;
}

export const useBlockActions = ({ slideId }: useBlockProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const slide = useSelector((state: RootState) =>
    state.editor.slides.find((s) => s.id === slideId)
  );

  const theme = useSelector((state: RootState) =>
    state.editor.availableThemes.find(
      (t) => t.id === state.editor.globalThemeId
    )
  );
  if (!slide) {
    return {
      addBlock: () => {},
      setJustifyContent: () => {},
      setSlideAlignItems: () => {},
    };
  }

  const addBlock = (type: SlideBlock["type"]) => {
    const newBlock: SlideBlock = {
      id: uuidv4(),
      type,
      text:
        type === "heading"
          ? "Заголовок"
          : type === "paragraph"
          ? "Текст"
          : type === "code"
          ? "// Ваш код"
          : type === "quote"
          ? "Цитата"
          : undefined,
      items: type === "list" ? ["Элемент 1", "Элемент 2"] : undefined,
      table:
        type === "table"
          ? {
              headers: ["Header 1", "Header 2"],
              rows: [
                ["", ""],
                ["", ""],
              ],
            }
          : undefined,
      chart:
        type === "chart"
          ? {
              type: "bar",
              labels: ["Label 1"],
              values: [0],
              colors: ["#4bc0c0"],
            }
          : undefined,
      style:
        type === "heading"
          ? { fontWeight: 700, fontSize: 28, color: theme?.colors.heading }
          : { fontWeight: 400, fontSize: 16, color: theme?.colors.paragraph },
    };
    dispatch(
      updateSlideContent({
        slideId: slide.id,
        newContent: [...slide.content, newBlock],
      })
    );
  };

  const setJustifyContent = (align: "flex-start" | "flex-end") => {
    if (!slide) return;
    const newContent = slide.content.map((b) => ({
      ...b,
      justifyContent: align,
    }));

    dispatch(
      updateSlideContent({
        slideId: slide.id,
        newContent,
      })
    );
    dispatch(pushHistory());
  };

  const setSlideAlignItems = (align: "flex-start" | "flex-end" | "center") => {
    if (!slide) return;
    dispatch(
      updateSlideContent({
        slideId: slide.id,
        newContent: slide.content,
        alignItems: align,
      })
    );
    dispatch(pushHistory());
  };

  return {
    addBlock,
    setJustifyContent,
    setSlideAlignItems,
  };
};
