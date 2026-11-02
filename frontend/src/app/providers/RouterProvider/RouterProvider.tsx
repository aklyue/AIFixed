import React, { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { LayoutProvider } from "../LayoutProvider";
import { AppRoutes } from "../../config/routes";

export const RouterProvider: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<div>Загрузка...</div>}>
      <LayoutProvider>
        <AppRoutes />
      </LayoutProvider>
    </Suspense>
  </BrowserRouter>
);
