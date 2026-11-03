import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import { useAuthCheck } from "../../../../features/auth/authCheck/lib/hooks/useAuthCheck";
import { LoadingOverlay } from "../../../../shared/ui";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const auth = useSelector((state: RootState) => state.auth);

  useAuthCheck();

  if (!auth.isChecked) return <LoadingOverlay title="Подождите" />;

  return <>{children}</>;
};
