// src/components/LoginModal.jsx
import React, { useState } from "react";
import { Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import IntuteLogo from "../assets/intute.png";

const DEFAULT_ADMIN_PASSWORD = "password1234";

const getStoredAdminPassword = () => {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem("adminPassword") || DEFAULT_ADMIN_PASSWORD;
};


export default function LoginModal() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

    const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    setTimeout(() => {
      const storedPassword = getStoredAdminPassword();

      if (email === "admin@intuteai.in" && password === storedPassword) {
        setSuccess(true);

        setTimeout(() => {
          setEmail("");
          setPassword("");
          setSuccess(false);
          navigate("/admin");
        }, 500);
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
    }, 800);
  };


  return (
    <>
      {/* Full-screen gradient background */}
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center p-3"
        style={{
          background: "linear-gradient(135deg, #020617, #0f172a, #1e293b)",
        }}
      >
        {/* Glass card */}
        <div className="col-12 col-md-6 col-lg-4">
          <div
            className="card shadow-lg rounded-4 overflow-hidden position-relative"
            style={{
              background: "rgba(15,23,42,0.9)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(148,163,184,0.5)",
            }}
          >
            {/* Soft background glow */}
            <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25">
              <div
                className="position-absolute top-0 start-0 rounded-circle"
                style={{
                  width: "220px",
                  height: "220px",
                  background:
                    "radial-gradient(circle, rgba(96,165,250,0.7), transparent)",
                }}
              />
              <div
                className="position-absolute bottom-0 end-0 rounded-circle"
                style={{
                  width: "260px",
                  height: "260px",
                  background:
                    "radial-gradient(circle, rgba(129,140,248,0.8), transparent)",
                }}
              />
            </div>

            <div className="card-body p-5 position-relative">
              {/* Header */}
              <div className="text-center mb-4">
                <img
                  src={IntuteLogo}
                  alt="Intute AI"
                  style={{
                    width: "96px",
                    height: "96px",
                    objectFit: "contain",
                    borderRadius: "24px",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.7)",
                    marginBottom: "1rem",
                  }}
                />
                <h3 className="fw-bold mb-1" style={{ color: "#e5e7eb" }}>
                  Welcome back
                </h3>
                <p className="mb-0" style={{ color: "#9ca3af" }}>
                  Sign in to your dashboard
                </p>
              </div>

              {/* Success */}
              {success && (
                <div className="alert alert-success d-flex align-items-center animate__animated animate__fadeIn mb-3">
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></div>
                  Logged in successfully.
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center animate__animated animate__shakeX mb-3">
                  <AlertCircle size={18} className="me-2" />
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" style={{ color: "#e5e7eb" }}>
                    Email
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text border-0"
                      style={{
                        background: "rgba(15,23,42,0.9)",
                        color: "#9ca3af",
                      }}
                    >
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        background: "rgba(15,23,42,0.9)",
                        border: "1px solid rgba(55,65,81,0.9)",
                        color: "#e5e7eb",
                      }}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label" style={{ color: "#e5e7eb" }}>
                    Password
                  </label>
                  <div className="input-group">
                    <span
                      className="input-group-text border-0"
                      style={{
                        background: "rgba(15,23,42,0.9)",
                        color: "#9ca3af",
                      }}
                    >
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        background: "rgba(15,23,42,0.9)",
                        border: "1px solid rgba(55,65,81,0.9)",
                        color: "#e5e7eb",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                  style={{
                    background: "linear-gradient(90deg, #4f46e5, #6366f1)",
                    color: "#f9fafb",
                    border: "none",
                    borderRadius: "0.75rem",
                    padding: "0.75rem 1rem",
                    boxShadow: "0 10px 25px rgba(15,23,42,0.7)",
                    transition:
                      "transform 0.18s ease-out, box-shadow 0.18s ease-out",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.97)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(15,23,42,0.7)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(15,23,42,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px rgba(15,23,42,0.7)";
                  }}
                >
                  {loading ? (
                    <>
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      ></div>
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Sign in
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* animate.css for shake/fade */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
      />
    </>
  );
}
