import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import EditorPage from "../../../pages/EditorPage/EditorPage";
import PromptPage from "../../../pages/PromptPage/PromptPage";
import GeneratePage from "../../../pages/GeneratePage/GeneratePage";
import { Header } from "../../Header";
import { Box } from "@mui/material";

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
    style={{ height: "100%" }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <PromptPage />
            </PageWrapper>
          }
        />
        <Route
          path="/generate"
          element={
            <PageWrapper>
              <GeneratePage />
            </PageWrapper>
          }
        />
        <Route
          path="/editor"
          element={
            <PageWrapper>
              <EditorPage />
            </PageWrapper>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<div>Загрузка...</div>}>
      <Box sx={{ height: 64 }}>
        <Header />
      </Box>
      <AnimatedRoutes />
    </Suspense>
  </BrowserRouter>
);
