// src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import CompanySelectPage from "../pages/CompanySelectPage";
import LoginPage from "../pages/LoginPage";
import EventSelectPage from "../pages/EventSelectPage";
import PanelPage from "../pages/PanelPage";
import AlimentosPage from "../pages/modules/AlimentosPage";
import VillaPage from "../pages/modules/VillaPage";
import MovilidadPage from "../pages/modules/MovilidadPage";
import ProtectedRoute from "./ProtectedRoute";
import CompetenciaPage from "../pages/modules/CompetenciaPage";

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
        path="/panel"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <PanelPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/alimentos"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <AlimentosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/villa"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <VillaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/movilidad"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <MovilidadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/panel/competencia"
        element={
          <ProtectedRoute requiredStage="event_selected">
            <CompetenciaPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}