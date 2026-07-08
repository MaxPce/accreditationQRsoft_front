// src/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../store/auth.store";
import type { Stage } from "../types/auth.types";

interface Props {
  children: ReactNode;
  requiredStage: Stage;
}

export default function ProtectedRoute({ children, requiredStage }: Props) {
  const { token, stage } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;

  if (requiredStage === "event_selected" && stage !== "event_selected") {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
}