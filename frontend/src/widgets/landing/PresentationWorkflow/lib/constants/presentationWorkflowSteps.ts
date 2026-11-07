import type { PresentationCanvasVariant } from "../../../../../shared/ui/PresentationCanvas";

export interface PresentationWorkflowStep {
  index: string;
  label: string;
  title: string;
  description: string;
  variant: PresentationCanvasVariant;
}

export const presentationWorkflowSteps: PresentationWorkflowStep[] = [
  {
    index: "01",
    label: "КОНТЕКСТ",
    title: "Начните с идеи или документа",
    description:
      "Опишите задачу или загрузите материалы. Сервис выделит ключевой контекст и соберёт основу будущей презентации.",
    variant: "contextVector",
  },
  {
    index: "02",
    label: "СТРУКТУРА",
    title: "Получите связную историю",
    description:
      "Превратите исходные данные в последовательность слайдов, которую удобно просматривать, перестраивать и редактировать.",
    variant: "slideMatrix",
  },
  {
    index: "03",
    label: "РЕЗУЛЬТАТ",
    title: "Доведите презентацию до своего стиля",
    description:
      "Выберите оформление, настройте содержимое и визуализации — и подготовьте презентацию к показу или экспорту.",
    variant: "workflowMatrix",
  },
];
