// src/layouts/AppLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{ backgroundColor: "#020617", color: "#e5e7eb" }}
    >
      <Header
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <div className="d-flex flex-grow-1">
        <Sidebar isOpen={sidebarOpen} />
        <main className="flex-grow-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
