// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginModal from "./components/LoginModal";
import AppLayout from "./components/AppLayout";
import VehicleDetails from "./components/VehicleDetails";
import AdminDashboard from "./components/AdminDashboard";
import UserProfile from "./components/UserProfile";
import VehicleSettings from "./components/VehicleSettings";
import DiagnosticsSupport from "./components/DiagnosticsSupport";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginModal />} />

        <Route element={<AppLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/user-profile" element={<UserProfile />} />
          <Route path="/vehicle-settings" element={<VehicleSettings />} />
          <Route path="/diagnostics-support" element={<DiagnosticsSupport />} />
        </Route>
        <Route path="/vehicles/:id" element={<VehicleDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
