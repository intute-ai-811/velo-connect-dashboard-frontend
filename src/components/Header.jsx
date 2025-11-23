// src/components/Header.jsx
import React from "react";
import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntuteLogo from "../assets/intute.png";

export default function Header({ onToggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header
      className="d-flex align-items-center justify-content-between px-4 border-bottom"
      style={{
        background: "linear-gradient(90deg, #020617, #020617, #0f172a)",
        height: 90, // bigger header
      }}
    >
      {/* LEFT: Toggle + Logo + Title */}
      <div className="d-flex align-items-center gap-4">
        
        {/* Sidebar Toggle */}
        <button
          className="btn p-2 border-0"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          style={{ background: "transparent" }}
        >
          <Menu size={26} style={{ color: "#e5e7eb" }} />
        </button>

        {/* ⭐ PURE LOGO – NO BACKGROUND AT ALL */}
        <img
          src={IntuteLogo}
          alt="Intute AI"
          style={{
            width: 80,         // increased size
            height: "auto",
            objectFit: "contain",
          }}
        />

        {/* Small title */}
        
      </div>

      {/* RIGHT: Admin + Logout */}
      <div className="d-flex align-items-center gap-4">
        <span style={{ color: "#e5e7eb", fontSize: 16 }}>Admin</span>

        <button
          className="btn d-flex align-items-center gap-2"
          onClick={handleLogout}
          style={{
            borderRadius: 999,
            padding: "10px 22px",
            border: "1px solid rgba(148,163,184,0.5)",
            background: "rgba(30,41,59,0.7)",
            color: "#e5e7eb",
            fontSize: 15,
            fontWeight: 500,
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </header>
  );
}
