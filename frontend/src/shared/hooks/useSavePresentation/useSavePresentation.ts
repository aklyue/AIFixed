import { useSelector } from "react-redux";
import { RootState } from "../../../app/store";
import { savePresentation } from "../../../entities";

export const useSavePresentation = () => {
  const slides = useSelector((state: RootState) => state.editor.slides);
  const currentIndex = useSelector((state: RootState) => state.editor.currentIndex);

  const save = async () => {
    const currentSlide = slides[currentIndex];
    if (!currentSlide) return;

    return savePresentation({
      id: currentSlide.id,
      title: currentSlide.title,
      content: slides,
      theme: currentSlide.theme || null,
    });
  };

  return { save };
};