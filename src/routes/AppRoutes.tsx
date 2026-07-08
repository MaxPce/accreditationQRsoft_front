// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import CompanySelectPage from "../pages/CompanySelectPage";
import LoginPage from "../pages/LoginPage";
import EventSelectPage from "../pages/EventSelectPage";
import PanelPage from "../pages/PanelPage";
import ProtectedRoute from "./ProtectedRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<CompanySelectPage />} />
      <Route path="/login/:idcompany" element={<LoginPage />} />
      <Route
        path="/events"
        element={
          <ProtectedRoute requiredStage="company_logged">
            <EventSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/*"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <PanelPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}