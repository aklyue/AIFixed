import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../app/store";
import { PlateSlide } from "../../../../shared/types";
import { useEffect, useState } from "react";
import {
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  reorderSlides,
  updateSlideContent,
} from "../../../../app/store/slices/editorSlice";

export const useSlidesList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const slides = useSelector(
    (state: RootState) => state.editor.slides
  ) as PlateSlide[];

  const [localSlides, setLocalSlides] = useState<PlateSlide[]>([]);

  useEffect(() => {
    setLocalSlides(slides);
  }, [slides]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = localSlides.findIndex((s) => s.id === active.id);
      const newIndex = localSlides.findIndex((s) => s.id === over.id);

      const newSlides = arrayMove(localSlides, oldIndex, newIndex);
      setLocalSlides(newSlides);

      dispatch(reorderSlides({ oldIndex, newIndex }));
    }
  };

  const handleEditSlide = (slideId: string, newContent: any[]) => {
    setLocalSlides((prev) =>
      prev.map((s) => (s.id === slideId ? { ...s, content: newContent } : s))
    );
    dispatch(updateSlideContent({ slideId, newContent }));
  };

  return {
    sensors,
    handleEditSlide,
    handleDragEnd,
    localSlides,
  };
};
