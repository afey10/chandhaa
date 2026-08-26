import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import MainDashboardPage from "./pages/MainDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AuditLogPage from "./pages/AuditLogPage";
import SettingsPage from "./pages/SettingsPage";
import CategoryManagerPage from "./pages/CategoryManagerPage";

import VehicleDashboardPage from "./pages/vehicles/VehicleDashboardPage";
import VehicleListPage from "./pages/vehicles/VehicleListPage";
import VehicleFormPage from "./pages/vehicles/VehicleFormPage";
import VehicleDetailsPage from "./pages/vehicles/VehicleDetailsPage";

import VesselDashboardPage from "./pages/vessels/VesselDashboardPage";
import VesselListPage from "./pages/vessels/VesselListPage";
import VesselFormPage from "./pages/vessels/VesselFormPage";
import VesselDetailsPage from "./pages/vessels/VesselDetailsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={<ProtectedRoute><MainDashboardPage /></ProtectedRoute>} />

      {/* Vehicles */}
      <Route path="/vehicles" element={<ProtectedRoute><VehicleDashboardPage /></ProtectedRoute>} />
      <Route path="/vehicles/list" element={<ProtectedRoute><VehicleListPage /></ProtectedRoute>} />
      <Route path="/vehicles/new" element={<ProtectedRoute><VehicleFormPage /></ProtectedRoute>} />
      <Route path="/vehicles/categories" element={<ProtectedRoute><CategoryManagerPage title="Vehicle Categories" description="Manage the categories used to classify registered vehicles." endpoint="vehicle-categories" /></ProtectedRoute>} />
      <Route path="/vehicles/:id" element={<ProtectedRoute><VehicleDetailsPage /></ProtectedRoute>} />
      <Route path="/vehicles/:id/edit" element={<ProtectedRoute><VehicleFormPage /></ProtectedRoute>} />

      {/* Vessels */}
      <Route path="/vessels" element={<ProtectedRoute><VesselDashboardPage /></ProtectedRoute>} />
      <Route path="/vessels/list" element={<ProtectedRoute><VesselListPage /></ProtectedRoute>} />
      <Route path="/vessels/new" element={<ProtectedRoute><VesselFormPage /></ProtectedRoute>} />
      <Route path="/vessels/categories" element={<ProtectedRoute><CategoryManagerPage title="Vessel Categories" description="Manage the categories used to classify registered vessels." endpoint="vessel-categories" /></ProtectedRoute>} />
      <Route path="/vessels/:id" element={<ProtectedRoute><VesselDetailsPage /></ProtectedRoute>} />
      <Route path="/vessels/:id/edit" element={<ProtectedRoute><VesselFormPage /></ProtectedRoute>} />

      {/* Account */}
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/audit-log" element={<ProtectedRoute adminOnly><AuditLogPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute adminOnly><SettingsPage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
