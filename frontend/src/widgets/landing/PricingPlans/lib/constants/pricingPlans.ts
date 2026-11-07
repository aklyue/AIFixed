export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Standard",
    price: "0 ₽",
    period: "навсегда",
    description: "Чтобы познакомиться с созданием презентаций с ИИ.",
    features: [
      "Базовая генерация презентаций",
      "Редактирование слайдов",
      "Основные темы оформления",
    ],
  },
  {
    name: "Plus",
    price: "1 000 ₽",
    period: "в месяц",
    description: "Для регулярной работы и более быстрой подготовки материалов.",
    features: [
      "Больше генераций в месяц",
      "Загрузка собственных документов",
      "Расширенные настройки оформления",
    ],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "3 000 ₽",
    period: "в месяц",
    description: "Для интенсивной работы и профессиональных задач.",
    features: [
      "Максимальный лимит генераций",
      "Полный доступ к инструментам редактирования",
      "Приоритетная обработка запросов",
    ],
  },
];
