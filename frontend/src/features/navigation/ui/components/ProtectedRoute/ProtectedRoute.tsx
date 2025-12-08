import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../app/store";
import { useAuthCheck } from "../../../../../shared/hooks";
import { LoadingOverlay } from "../../../../../shared/components";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useSelector((state: RootState) => state.auth);

  useAuthCheck();

  if (!auth.isChecked) return <LoadingOverlay title="Подождите" />;

  return <>{children}</>;
};
