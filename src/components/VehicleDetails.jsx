// src/components/VehicleDetails.jsx
import React, { useMemo } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, BatteryCharging } from "lucide-react";

// MOCK DATA (fallback if user lands directly on /vehicles/:id)
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

// -------------- PARAMETER META (from your sheet) -----------------

const PARAM_GROUPS = [
  {
    key: "battery",
    title: "Battery (Sun Mobility)",
    color: "#f97316",
    params: [
      {
        id: "soc",
        name: "State of Charge",
        size: "7–9 B",
        delay: "1 Second",
        unit: "%",
      },
      {
        id: "batCurrent",
        name: "Battery Current",
        size: "18–24 B",
        delay: "10 Minutes",
        unit: "A",
      },
      {
        id: "maxCellVolt",
        name: "Maximum Cell Voltage",
        size: "18–23 B",
        delay: "10 Minutes",
        unit: "V",
      },
      {
        id: "minCellVolt",
        name: "Minimum Cell Voltage",
        size: "18–23 B",
        delay: "10 Minutes",
        unit: "V",
      },
      {
        id: "maxCellTemp",
        name: "Maximum Cell Temperature",
        size: "15–18 B",
        delay: "10 Minutes",
        unit: "°C",
      },
      {
        id: "minCellTemp",
        name: "Minimum Cell Temperature",
        size: "15–18 B",
        delay: "10 Minutes",
        unit: "°C",
      },
      {
        id: "availEnergy",
        name: "Available Energy",
        size: "19–24 B",
        delay: "2–3 Minutes",
        unit: "kWh",
      },
      {
        id: "driveCurrentLimit",
        name: "Drive Current Limit",
        size: "21–25 B",
        delay: "2–3 Minutes",
        unit: "A",
      },
      {
        id: "regenCurrentLimit",
        name: "Regen Current Limit",
        size: "21–25 B",
        delay: "2–3 Minutes",
        unit: "A",
      },
    ],
  },
  {
    key: "motor",
    title: "Motor",
    color: "#38bdf8",
    params: [
      {
        id: "controllerTemp",
        name: "Controller Temperature",
        size: "25–28 B",
        delay: "2–3 Minutes",
        unit: "°C",
      },
      {
        id: "motorTemp",
        name: "Motor Temperature",
        size: "20–23 B",
        delay: "2–3 Minutes",
        unit: "°C",
      },
      {
        id: "motorRpm",
        name: "Motor RPM",
        size: "12–16 B",
        delay: "2–3 Minutes",
        unit: "RPM",
      },
      {
        id: "rmsCurrent",
        name: "RMS Current",
        size: "14–19 B",
        delay: "2–3 Minutes",
        unit: "A",
      },
      {
        id: "capVolt",
        name: "Capacitor Voltage",
        size: "20–24 B",
        delay: "2–3 Minutes",
        unit: "V",
      },
      {
        id: "faults",
        name: "Faults (if any)",
        size: "23–460 B",
        delay: "Live",
        unit: "Cnt",
      },
    ],
  },
  {
    key: "general",
    title: "General Parameters",
    color: "#a3e635",
    params: [
      {
        id: "throttle",
        name: "Throttle",
        size: "12–14 B",
        delay: "—",
        unit: "%",
      },
      {
        id: "brake",
        name: "Brake",
        size: "9–11 B",
        delay: "—",
        unit: "%",
      },
      {
        id: "speed",
        name: "Speed",
        size: "9–13 B",
        delay: "—",
        unit: "km/h",
      },
      {
        id: "odometer",
        name: "Distance Covered (Odometer)",
        size: "12–22 B",
        delay: "2–3 Minutes",
        unit: "km",
      },
    ],
  },
];

// ------------ DEMO DATA GENERATOR (replace with real API later) ------------

// Deterministic, no randomness – just for graph shapes
const buildSeriesForParam = (groupIndex, paramIndex) => {
  const points = 16;
  const base = 40 + groupIndex * 5 + paramIndex * 3;

  return Array.from({ length: points }, (_, i) => {
    const t = `T${i + 1}`;
    const wave =
      Math.sin((i + paramIndex + 1) / 2) * 15 +
      Math.cos((i + groupIndex + 2) / 3) * 8;
    const value = Math.max(0, base + wave); // avoid negative

    return {
      t,
      value: Math.round(value * 10) / 10,
    };
  });
};

export default function VehicleDetails() {
  const { id } = useParams();
  const location = useLocation();

  const vehicleFromState = location.state?.vehicle;
  const vehicle =
    vehicleFromState || MOCK_VEHICLES.find((v) => v.id === Number(id));

  const cardBase = {
    background:
      "radial-gradient(circle at top left, rgba(31,41,55,0.95), rgba(15,23,42,0.98))",
    borderRadius: 18,
    border: "1px solid rgba(148,163,184,0.35)",
  };

  if (!vehicle) {
    return (
      <div
        className="py-4 px-3 px-md-4"
        style={{
          background: "linear-gradient(180deg,#0f172a,#020617)",
          minHeight: "100vh",
          color: "#e5e7eb",
        }}
      >
        <Link
          to="/admin"
          className="btn btn-sm btn-outline-light mb-3 d-inline-flex align-items-center gap-1"
        >
          <ChevronLeft size={14} /> Back
        </Link>
        <p>Vehicle not found.</p>
      </div>
    );
  }

  const socValue = useMemo(() => {
    const base = 60 + ((vehicle.avgKwh * 7) % 40);
    return Math.round(base * 10) / 10;
  }, [vehicle]);

  return (
    <div
      className="py-4 px-3 px-md-4"
      style={{
        background: "linear-gradient(180deg,#020617,#020617)",
        minHeight: "100vh",
        color: "#e5e7eb",
      }}
    >
      {/* HEADER */}
      <header className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center gap-2">
            <Link
              to="/admin"
              className="btn btn-sm d-inline-flex align-items-center gap-1"
              style={{
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.4)",
                color: "#e5e7eb",
                background: "transparent",
              }}
            >
              <ChevronLeft size={16} />
            </Link>
            <div>
              <h1
                className="mb-1"
                style={{
                  fontSize: 24,
                  color: "#f97316",
                  letterSpacing: 0.5,
                }}
              >
                Battery Control Center
              </h1>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>
                {vehicle.vehicleNumber} · {vehicle.vehicleType} ·{" "}
                {vehicle.customerName}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>
                Delivered on {vehicle.dateOfDelivery}
              </div>
            </div>
          </div>

          <div className="d-flex flex-column align-items-end gap-1">
            <span
              style={{
                fontSize: 11,
                color: "#6ee7b7",
                textTransform: "uppercase",
              }}
            >
              VCU: {vehicle.vcuId} · HMI: {vehicle.hmiId}
            </span>
            <span
              className="px-2 py-1"
              style={{
                fontSize: 11,
                borderRadius: 999,
                border: "1px solid rgba(52,211,153,0.6)",
                color: "#bbf7d0",
                background:
                  "radial-gradient(circle, rgba(22,163,74,0.25), rgba(15,23,42,0.95))",
              }}
            >
              ● LIVE
            </span>
          </div>
        </div>

        {/* SOC summary line under title */}
        <div
          style={{
            ...cardBase,
            padding: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <BatteryCharging size={18} color="#22c55e" />
          <div style={{ fontSize: 13 }}>
            <span style={{ color: "#9ca3af" }}>Current SoC:</span>{" "}
            <strong style={{ fontSize: 16 }}>{socValue}%</strong>
          </div>
        </div>
      </header>

      {/* PARAMETER GROUPS WITH GRAPHS */}
      {PARAM_GROUPS.map((group, gIndex) => (
        <section key={group.key} className="mb-4">
          <h5
            className="mb-2"
            style={{
              fontSize: 15,
              color: group.color,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {group.title}
          </h5>

          <div className="row g-3">
            {group.params.map((param, pIndex) => {
              const data = buildSeriesForParam(gIndex, pIndex);

              return (
                <div
                  key={param.id}
                  className="col-md-6 col-xl-4 d-flex"
                  style={{ minHeight: 220 }}
                >
                  <div
                    style={{
                      ...cardBase,
                      padding: 14,
                      width: "100%",
                      boxShadow: "0 0 18px rgba(15,118,110,0.4)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* title + meta */}
                    <div className="d-flex justify-content-between mb-1">
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        {param.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          textAlign: "right",
                        }}
                      >
                        <div>Size: {param.size}</div>
                        <div>Delay: {param.delay}</div>
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      Unit: {param.unit}
                    </div>

                    {/* graph */}
                    <div style={{ width: "100%", height: 140, flexShrink: 0 }}>
                      <ResponsiveContainer>
                        <LineChart data={data}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#0f172a"
                          />
                          <XAxis
                            dataKey="t"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            axisLine={{ stroke: "#374151" }}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            axisLine={{ stroke: "#374151" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#020617",
                              borderRadius: 8,
                              border: "1px solid #4b5563",
                              fontSize: 11,
                            }}
                            labelStyle={{ color: "#e5e7eb" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke={group.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
