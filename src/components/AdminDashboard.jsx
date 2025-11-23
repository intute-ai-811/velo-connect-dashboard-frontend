// src/components/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const MOCK_VEHICLES = [
  {
    id: 1,
    vehicleType: "E-Scooter",
    vehicleNumber: "KA 01 AB 1234",
    customerName: "UrbanRide Pvt Ltd",
    vcuId: "VCU-2391",
    hmiId: "HMI-8831",
    dateOfDelivery: "2024-05-12",
    totalHours: 421,
    totalKwh: 1823,
    avgKwh: 4.3,
  },
  {
    id: 2,
    vehicleType: "Cargo EV",
    vehicleNumber: "MH 12 XY 5678",
    customerName: "QuickShip Logistics",
    vcuId: "VCU-4520",
    hmiId: "HMI-9920",
    dateOfDelivery: "2024-03-02",
    totalHours: 310,
    totalKwh: 1458,
    avgKwh: 4.7,
  },
  {
    id: 3,
    vehicleType: "E-Three Wheeler",
    vehicleNumber: "TN 09 CC 4321",
    customerName: "GreenMove Transport",
    vcuId: "VCU-3390",
    hmiId: "HMI-7744",
    dateOfDelivery: "2023-12-21",
    totalHours: 690,
    totalKwh: 2980,
    avgKwh: 4.3,
  },
  {
    id: 4,
    vehicleType: "Passenger EV",
    vehicleNumber: "DL 03 AA 7654",
    customerName: "BlueCab Mobility",
    vcuId: "VCU-1188",
    hmiId: "HMI-5521",
    dateOfDelivery: "2024-01-14",
    totalHours: 512,
    totalKwh: 2104,
    avgKwh: 4.1,
  },
  {
    id: 5,
    vehicleType: "E-Bus",
    vehicleNumber: "KA 05 EV 9001",
    customerName: "Metro City Transport",
    vcuId: "VCU-9044",
    hmiId: "HMI-6677",
    dateOfDelivery: "2023-10-05",
    totalHours: 920,
    totalKwh: 5400,
    avgKwh: 5.9,
  },
  {
    id: 6,
    vehicleType: "Cargo EV",
    vehicleNumber: "GJ 18 ZZ 2187",
    customerName: "SwiftShip Express",
    vcuId: "VCU-7812",
    hmiId: "HMI-4466",
    dateOfDelivery: "2024-04-10",
    totalHours: 204,
    totalKwh: 997,
    avgKwh: 4.9,
  },
  {
    id: 7,
    vehicleType: "Passenger EV",
    vehicleNumber: "MH 14 EV 1020",
    customerName: "CityCab Services",
    vcuId: "VCU-6610",
    hmiId: "HMI-2201",
    dateOfDelivery: "2023-11-01",
    totalHours: 745,
    totalKwh: 3325,
    avgKwh: 4.5,
  },
];

const PAGE_SIZE = 5;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // modal form state
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    vehicleType: "",
    vehicleNumber: "",
    customerName: "",
    vcuId: "",
    hmiId: "",
    dateOfDelivery: "",
  });

  // simulate API load -> fail => load mock data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setErrorMsg("Failed to load vehicles. Showing demo data.");
      setVehicles(MOCK_VEHICLES);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setErrorMsg("");
    setCurrentPage(1);

    setTimeout(() => {
      setIsLoading(false);
      setErrorMsg("Failed to load vehicles. Showing demo data.");
      setVehicles(MOCK_VEHICLES);
    }, 500);
  };

  // --- Add / Edit / Delete ---
  const openAddForm = () => {
    setFormMode("add");
    setEditingId(null);
    setFormData({
      vehicleType: "",
      vehicleNumber: "",
      customerName: "",
      vcuId: "",
      hmiId: "",
      dateOfDelivery: "",
    });
    setShowForm(true);
  };

  const openEditForm = (vehicle) => {
    setFormMode("edit");
    setEditingId(vehicle.id);
    setFormData({
      vehicleType: vehicle.vehicleType,
      vehicleNumber: vehicle.vehicleNumber,
      customerName: vehicle.customerName,
      vcuId: vehicle.vcuId,
      hmiId: vehicle.hmiId,
      dateOfDelivery: vehicle.dateOfDelivery,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const v = vehicles.find((x) => x.id === id);
    const ok = window.confirm(
      `Are you sure you want to delete vehicle ${v?.vehicleNumber}?`
    );
    if (!ok) return;
    setVehicles((prev) => prev.filter((x) => x.id !== id));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleRowClick = (vehicle) => {
  navigate(`/vehicles/${vehicle.id}`, { state: { vehicle } });
};


  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.vehicleType ||
      !formData.vehicleNumber ||
      !formData.customerName
    ) {
      alert("Vehicle Type, Vehicle Number, and Customer Name are required.");
      return;
    }

    if (formMode === "add") {
      const nextId =
        vehicles.length === 0 ? 1 : Math.max(...vehicles.map((v) => v.id)) + 1;
      const newVehicle = {
        id: nextId,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber,
        customerName: formData.customerName,
        vcuId: formData.vcuId || `VCU-${nextId}`,
        hmiId: formData.hmiId || `HMI-${nextId}`,
        dateOfDelivery:
          formData.dateOfDelivery || new Date().toISOString().slice(0, 10),
        totalHours: 0,
        totalKwh: 0,
        avgKwh: 0,
      };
      setVehicles((prev) => [...prev, newVehicle]);
    } else if (formMode === "edit" && editingId != null) {
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? {
                ...v,
                ...formData,
                dateOfDelivery:
                  formData.dateOfDelivery ||
                  v.dateOfDelivery ||
                  new Date().toISOString().slice(0, 10),
              }
            : v
        )
      );
    }

    setShowForm(false);
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = (maxPage) => {
    setCurrentPage((p) => Math.min(maxPage, p + 1));
  };

  // derived data (filter + sort)
  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let data = [...vehicles];

    if (term) {
      data = data.filter((v) => {
        return (
          v.customerName.toLowerCase().includes(term) ||
          v.vehicleType.toLowerCase().includes(term) ||
          v.vehicleNumber.toLowerCase().includes(term)
        );
      });
    }

    if (sortField) {
      data.sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];

        if (typeof av === "number" && typeof bv === "number") {
          return sortDirection === "asc" ? av - bv : bv - av;
        }

        const as = String(av).toLowerCase();
        const bs = String(bv).toLowerCase();
        if (as < bs) return sortDirection === "asc" ? -1 : 1;
        if (as > bs) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [vehicles, searchTerm, sortField, sortDirection]);

  const totalResults = filteredVehicles.length;
  const maxPage = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));

  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // shared styles
  const cardStyle = {
    background:
      "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(15,23,42,0.96))",
    border: "1px solid rgba(148,163,184,0.25)",
    borderRadius: 16,
  };

  const thStyle = {
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid rgba(55,65,81,0.9)",
    whiteSpace: "nowrap",
    fontSize: 13,
    color: "#9ca3af",
  };

    const tdStyle = {
    padding: "10px 16px",
    borderBottom: "1px solid rgba(31,41,55,0.9)",
    fontSize: 14,
  };

  const rowEvenStyle = {
    backgroundColor: "rgba(15,23,42,0.98)",
    cursor: "pointer",
  };

  const rowOddStyle = {
    backgroundColor: "rgba(15,23,42,0.94)",
    cursor: "pointer",
  };


  return (
    <div>
      {/* Title */}
      <section className="text-center mb-4">
        <h1 className="fw-bold mb-1" style={{ color: "#fb7185", fontSize: 32 }}>
          Admin Dashboard
        </h1>
        <p className="text-secondary mb-0" style={{ fontSize: 14 }}>
          Manage vehicle configurations and monitor fleet
        </p>
      </section>

      {/* Search + buttons */}
      <div className="d-flex flex-column flex-md-row align-items-stretch align-items-md-center justify-content-between gap-3 mb-4">
        {/* Search */}
        {/* Search - dark bar, white placeholder */}
        <div
          className="d-flex align-items-center px-3"
          style={{
            ...cardStyle,
            borderRadius: 999,
            height: 50,
            maxWidth: 520,
            width: "100%",
          }}
        >
          <Search size={18} style={{ color: "#9ca3af", marginRight: 8 }} />
          <input
            type="text"
            className="form-control bg-transparent border-0 text-light search-input"
            placeholder="Search by Customer, Vehicle Type, Vehicle Number..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ fontSize: 14, boxShadow: "none" }}
          />
        </div>

        {/* Action buttons */}
        <div className="d-flex gap-2 justify-content-end">
          <button
            type="button"
            className="btn d-flex align-items-center gap-2"
            onClick={handleRefresh}
            style={{
              background: "linear-gradient(135deg,#ea580c,#f97316)",
              border: "none",
              color: "#fff",
              borderRadius: 12,
              paddingInline: 20,
            }}
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn d-flex align-items-center gap-2"
            onClick={openAddForm}
            style={{
              background: "linear-gradient(135deg,#16a34a,#22c55e)",
              border: "none",
              color: "#fff",
              borderRadius: 12,
              paddingInline: 20,
            }}
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div
          className="d-flex align-items-center px-3 py-2 mb-3"
          style={{
            ...cardStyle,
            borderColor: "rgba(248,113,113,0.7)",
            background:
              "linear-gradient(135deg, rgba(127,29,29,0.9), rgba(127,29,29,0.6))",
          }}
        >
          <AlertTriangle
            size={18}
            style={{ color: "#fecaca", marginRight: 8 }}
          />
          <span style={{ fontSize: 14, color: "#fee2e2" }}>{errorMsg}</span>
        </div>
      )}

      {/* TABLE CARD (custom dark table, no Bootstrap .table class) */}
      <div className="p-0" style={cardStyle}>
        <div style={{ overflowX: "auto", borderRadius: 16 }}>
          <table
            style={{
              width: "100%",
              minWidth: "900px",
              borderCollapse: "collapse",
              color: "#e5e7eb",
              backgroundColor: "transparent",
            }}
          >
            <thead>
              <tr
                style={{
                  background:
                    "linear-gradient(90deg, rgba(15,23,42,1), rgba(15,23,42,0.95))",
                }}
              >
                <th style={thStyle}>S.No</th>

                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("vehicleType")}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>Vehicle Type</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>

                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("vehicleNumber")}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>Vehicle Number</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>

                {/* UPDATED: make Customer Name sortable */}
                <th
                  style={{ ...thStyle, cursor: "pointer" }}
                  onClick={() => handleSort("customerName")}
                >
                  <div className="d-flex align-items-center gap-1">
                    <span>Customer Name</span>
                    <ArrowUpDown size={14} />
                  </div>
                </th>

                <th style={thStyle}>VCU ID</th>
                <th style={thStyle}>HMI ID</th>
                <th style={thStyle}>Date of Delivery</th>
                <th style={thStyle}>Total Hours</th>
                <th style={thStyle}>Total kWh</th>
                <th style={thStyle}>Avg kWh</th>
                <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "20px 16px",
                    }}
                  >
                    Loading vehicles…
                  </td>
                </tr>
              ) : paginatedVehicles.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      color: "#9ca3af",
                      padding: "20px 16px",
                    }}
                  >
                    No vehicles found.
                  </td>
                </tr>
              ) : (
                paginatedVehicles.map((v, index) => (
                  <tr
                    key={v.id}
                    style={index % 2 === 0 ? rowEvenStyle : rowOddStyle}
                    onClick={() => handleRowClick(v)}
                  >
                    <td style={tdStyle}>
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td style={tdStyle}>{v.vehicleType}</td>
                    <td style={tdStyle}>{v.vehicleNumber}</td>
                    <td style={tdStyle}>{v.customerName}</td>
                    <td style={tdStyle}>{v.vcuId}</td>
                    <td style={tdStyle}>{v.hmiId}</td>
                    <td style={tdStyle}>{v.dateOfDelivery}</td>
                    <td style={tdStyle}>{v.totalHours}</td>
                    <td style={tdStyle}>{v.totalKwh}</td>
                    <td style={tdStyle}>{v.avgKwh}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          className="btn btn-sm"
                          type="button"
                          title="Edit vehicle"
                          style={{
                            padding: "4px 8px",
                            background: "rgba(59,130,246,0.15)",
                            border: "1px solid rgba(59,130,246,0.6)",
                            color: "#bfdbfe",
                            borderRadius: 8,
                          }}
                          onClick={(e) => {
                e.stopPropagation();     // 👈 prevent row navigation
                openEditForm(v);
              }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          className="btn btn-sm"
                          type="button"
                          title="Delete vehicle"
                          style={{
                            padding: "4px 8px",
                            background: "rgba(248,113,113,0.15)",
                            border: "1px solid rgba(248,113,113,0.7)",
                            color: "#fecaca",
                            borderRadius: 8,
                          }}
                          onClick={(e) => {
                e.stopPropagation();     // 👈 prevent row navigation
                handleDelete(v.id);
              }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div
          className="d-flex flex-column flex-md-row align-items-center justify-content-between px-3 py-2 border-top"
          style={{ borderColor: "rgba(55,65,81,0.9)" }}
        >
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            Showing {totalResults === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}{" "}
            to {Math.min(currentPage * PAGE_SIZE, totalResults)} of{" "}
            {totalResults} result(s)
          </span>

          <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                background: "transparent",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#e5e7eb",
                paddingInline: 10,
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
              Prev
            </button>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              Page {currentPage} / {maxPage}
            </span>
            <button
              type="button"
              className="btn btn-sm d-flex align-items-center gap-1"
              onClick={() => handleNextPage(maxPage)}
              disabled={currentPage === maxPage}
              style={{
                background: "transparent",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.6)",
                color: "#e5e7eb",
                paddingInline: 10,
                opacity: currentPage === maxPage ? 0.5 : 1,
              }}
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT FORM OVERLAY */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15,23,42,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
          }}
        >
          <div
            className="p-4"
            style={{
              width: "100%",
              maxWidth: 560,
              background:
                "linear-gradient(135deg, rgba(15,23,42,1), rgba(15,23,42,0.96))",
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.5)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.75)",
            }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="mb-0" style={{ color: "#e5e7eb", fontSize: 18 }}>
                  {formMode === "add" ? "Add Vehicle" : "Edit Vehicle Details"}
                </h5>
                <small style={{ color: "#9ca3af" }}>
                  {formMode === "add"
                    ? "Create a new vehicle configuration"
                    : "Update configuration for this vehicle"}
                </small>
              </div>
              <button
                type="button"
                className="btn btn-sm border-0"
                onClick={() => setShowForm(false)}
                style={{
                  backgroundColor: "transparent",
                  color: "#9ca3af",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label text-light small">
                    Vehicle Type *
                  </label>
                  <input
                    type="text"
                    name="vehicleType"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.vehicleType}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-light small">
                    Vehicle Number *
                  </label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.vehicleNumber}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-12">
                  <label className="form-label text-light small">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.customerName}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-light small">VCU ID</label>
                  <input
                    type="text"
                    name="vcuId"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.vcuId}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-light small">HMI ID</label>
                  <input
                    type="text"
                    name="hmiId"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.hmiId}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-light small">
                    Date of Delivery
                  </label>
                  <input
                    type="date"
                    name="dateOfDelivery"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={formData.dateOfDelivery}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setShowForm(false)}
                  style={{
                    backgroundColor: "transparent",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.6)",
                    color: "#e5e7eb",
                    paddingInline: 18,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  style={{
                    background: "linear-gradient(135deg,#16a34a,#22c55e)",
                    borderRadius: 999,
                    border: "none",
                    color: "#f9fafb",
                    paddingInline: 22,
                    fontWeight: 500,
                  }}
                >
                  {formMode === "add" ? "Save Vehicle" : "Update Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
