import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../../app/store";
import { updateSlideContent } from "../../../../../app/store/slices/editorSlice";
import { markdownToSlides } from "../../../../../shared/utils/markdownToSlides";
import { useState } from "react";
import { PlateSlide } from "../../../../../shared/types";

const API_URL = process.env.REACT_APP_API_URL;

export const useSlideApiAction = (currentSlide: PlateSlide) => {
  const dispatch = useDispatch<AppDispatch>();
  const [editing, setEditing] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBtn, setSelectedBtn] = useState<string | null>(null);

  const handleSave = async (currentSlide: PlateSlide) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/presentation/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textValue || undefined,
          action: "custom",
          slide: {
            slide_id: currentSlide.id,
            title: currentSlide.title || "",
            content: currentSlide.content || "",
          },
        }),
      });

      if (!response.ok) throw new Error("Ошибка при отправке данных");

      const markdownString = await response.text();
      const parsedSlides = markdownToSlides(markdownString);
      const updatedBlocks = parsedSlides[0]?.content || [];

      dispatch(
        updateSlideContent({
          slideId: currentSlide.id,
          newContent: updatedBlocks,
        })
      );

      setEditing(false);
    } catch (err) {
      setError("Ошибка отправки запроса");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (attribute: string) => {
    setSelectedBtn(attribute);
    setTextValue(attribute);
  };
  return {
    loading,
    handleSave,
    handleChange,
    editing,
    error,
    selectedBtn,
    textValue,
    setTextValue,
    setEditing,
    setError,
  };
};
