import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import EditorPage from "../../pages/EditorPage/EditorPage";
import GeneratePage from "../../pages/GeneratePage/GeneratePage";
import MyPresentationsPage from "../../pages/MyPresentationsPage/MyPresentationsPage";
import PromptPage from "../../pages/PromptPage/PromptPage";
import VerificationPage from "../../pages/VerificationPage/VerificationPage";
import { AuthPage, SettingsPage } from "../../pages";
import OAuthSuccess from "../../shared/ui/OAuthSuccess";
import { ProtectedRoute } from "../providers/RouterProvider/ProtectedRoute";

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

export const AppRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <PageWrapper>
              <PromptPage />
            </PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/generate"
        element={
          <ProtectedRoute>
            <PageWrapper>
              <GeneratePage />
            </PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/editor"
        element={
          <ProtectedRoute>
            <PageWrapper>
              <EditorPage />
            </PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <PageWrapper>
              <MyPresentationsPage />
            </PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PageWrapper>
              <SettingsPage />
            </PageWrapper>
          </ProtectedRoute>
        }
      />
      <Route
        path="/auth"
        element={
          <PageWrapper>
            <AuthPage />
          </PageWrapper>
        }
      />
      <Route
        path="/verify-email"
        element={
          <PageWrapper>
            <VerificationPage />
          </PageWrapper>
        }
      />
      <Route path="/auth/success" element={<OAuthSuccess />} />
    </Routes>
  );
};
