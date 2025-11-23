// src/components/UserProfile.jsx
import React, { useState } from "react";

const DEFAULT_ADMIN_PASSWORD = "password1234";

const getStoredAdminPassword = () => {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem("adminPassword") || DEFAULT_ADMIN_PASSWORD;
};

const setStoredAdminPassword = (pwd) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("adminPassword", pwd);
};

export default function UserProfile() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const cardStyle = {
    background:
      "radial-gradient(circle at top left, rgba(31,41,55,0.95), rgba(15,23,42,0.98))",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrorMsg("");
    setSuccessMsg("");
  };

  // mock "API" that uses localStorage
  const changePasswordApi = async (currentPassword, newPassword) => {
    await new Promise((resolve) => setTimeout(resolve, 400)); // fake delay

    const stored = getStoredAdminPassword();

    if (currentPassword !== stored) {
      throw new Error("Current password is incorrect.");
    }

    setStoredAdminPassword(newPassword);
    return { ok: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("New password and confirmation do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await changePasswordApi(currentPassword, newPassword);
      setSuccessMsg("Password updated successfully.");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="py-4 px-3 px-md-4 d-flex justify-content-center"
      style={{
        background: "linear-gradient(180deg,#020617,#020617)",
        minHeight: "100vh",
        color: "#e5e7eb",
      }}
    >
      <div className="w-100" style={{ maxWidth: 900 }}>
        {/* Page header */}
        <section className="mb-3">
          <h1
            className="fw-bold mb-1"
            style={{ color: "#f97316", fontSize: 24 }}
          >
            User Profile
          </h1>
          
        </section>

        {/* Single card: password update only */}
        <div className="p-4" style={cardStyle}>
          <h6
            className="mb-2"
            style={{ fontSize: 14, color: "#e5e7eb", fontWeight: 600 }}
          >
            Update Password
          </h6>
          

          {errorMsg && (
            <div
              className="mb-2 px-2 py-1"
              style={{
                borderRadius: 8,
                fontSize: 12,
                background:
                  "linear-gradient(135deg, rgba(127,29,29,0.9), rgba(127,29,29,0.6))",
                border: "1px solid rgba(248,113,113,0.7)",
                color: "#fee2e2",
              }}
            >
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div
              className="mb-2 px-2 py-1"
              style={{
                borderRadius: 8,
                fontSize: 12,
                background:
                  "linear-gradient(135deg, rgba(22,163,74,0.9), rgba(22,163,74,0.5))",
                border: "1px solid rgba(74,222,128,0.7)",
                color: "#dcfce7",
              }}
            >
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-3">
            <div className="mb-3">
              <label className="form-label text-light small">
                Current password
              </label>
              <input
                type="password"
                name="currentPassword"
                className="form-control form-control-sm bg-dark text-light border-secondary"
                value={form.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-light small">
                  New password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className="form-control form-control-sm bg-dark text-light border-secondary"
                  value={form.newPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
                <small style={{ fontSize: 11, color: "#6b7280" }}>
                  Minimum 8 characters.
                </small>
              </div>
              <div className="col-md-6">
                <label className="form-label text-light small">
                  Confirm new password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control form-control-sm bg-dark text-light border-secondary"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-sm"
                disabled={isSubmitting}
                onClick={() => {
                  setForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                style={{
                  backgroundColor: "transparent",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.6)",
                  color: "#e5e7eb",
                  paddingInline: 18,
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn btn-sm"
                disabled={isSubmitting}
                style={{
                  background: "linear-gradient(135deg,#16a34a,#22c55e)",
                  borderRadius: 999,
                  border: "none",
                  color: "#f9fafb",
                  paddingInline: 22,
                  fontWeight: 500,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
