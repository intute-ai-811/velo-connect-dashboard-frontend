// src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { User, Settings, LifeBuoy, LayoutGrid } from "lucide-react"; // ⬅ added LayoutGrid

export default function Sidebar({ isOpen }) {
  const menuItems = [
    {
      label: "Admin Dashboard",
      to: "/admin",
      icon: <LayoutGrid size={18} />,
    },
    { label: "User Profile", to: "/user-profile", icon: <User size={18} /> },
    {
      label: "Vehicle Settings",
      to: "/vehicle-settings",
      icon: <Settings size={18} />,
    },
    {
      label: "Diagnostics & Support Center",
      to: "/diagnostics-support",
      icon: <LifeBuoy size={18} />,
    },
  ];

  const year = new Date().getFullYear();

  return (
    <aside
      className={`sidebar p-3 d-flex flex-column ${
        isOpen ? "" : "d-none"
      }`}
    >
      {/* Section label */}
      <div className="mb-4">
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#6b7280",
          }}
        >
          Navigation
        </span>
      </div>

      {/* Menu */}
      <nav className="nav flex-column gap-2 mb-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `sidebar-link d-flex align-items-center gap-2 ${
                isActive ? "sidebar-link-active" : ""
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="mt-auto pt-3"
        style={{
          borderTop: "1px solid rgba(55,65,81,0.7)",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        <div>© {year} Intute AI</div>
      </div>
    </aside>
  );
}
