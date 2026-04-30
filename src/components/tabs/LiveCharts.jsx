import { useState, useEffect, useRef } from 'react';
import api, { apiUrl } from '../../api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const MAX_POINTS = 150;
const WINDOW_MS = 5 * 60 * 1000;

const CHARTS = [
  { key: 'speed', label: 'Speed', unit: 'km/h', color: '#f97316', path: (d) => d?.general?.speed },
  { key: 'soc', label: 'State of Charge', unit: '%', color: '#22c55e', path: (d) => d?.battery?.soc },
  { key: 'battery_current', label: 'Battery Current', unit: 'A', color: '#3b82f6', path: (d) => d?.battery?.current },
  { key: 'motor_rpm', label: 'Motor RPM', unit: 'rpm', color: '#a855f7', path: (d) => d?.motor?.rpm },
  { key: 'motor_temp', label: 'Motor Temperature', unit: '°C', color: '#ef4444', path: (d) => d?.motor?.motor_temp },
];

function fmt(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function ChartCard({ label, unit, color, data, dataKey }) {
  const latest = data.length > 0 ? data[data.length - 1][dataKey] : null;
  const prev = data.length > 1 ? data[data.length - 2][dataKey] : null;
  const trend =
    latest !== null && prev !== null
      ? latest > prev + 0.1
        ? '↑'
        : latest < prev - 0.1
        ? '↓'
        : '→'
      : '—';

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xl font-semibold text-white">
            {latest !== null && latest !== undefined
              ? `${Number(latest).toLocaleString('en-IN', { maximumFractionDigits: 1 })}`
              : '—'}
            <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
        <span className="text-2xl" style={{ color }}>{trend}</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis dataKey="ts" tickFormatter={fmt} tick={{ fontSize: 9, fill: '#4b5563' }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 9, fill: '#4b5563' }} />
          <Tooltip
            contentStyle={{ background: '#111827', border: '1px solid #374151', fontSize: 11 }}
            labelFormatter={fmt}
            formatter={(v) => [`${Number(v).toFixed(2)} ${unit}`, label]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function toChartPoint(d) {
  const pointTs = d?.recorded_at ? new Date(d.recorded_at).getTime() : Date.now();
  const point = { ts: pointTs };
  for (const chart of CHARTS) {
    point[chart.key] = chart.path(d) ?? null;
  }
  return point;
}

function samePoint(a, b) {
  return a && b && a.ts === b.ts;
}

export default function LiveCharts({ vehicleId, user }) {
  const [chartData, setChartData] = useState([]);
  const [connected, setConnected] = useState(false);
  const [lastPacket, setLastPacket] = useState(null);
  const [now, setNow] = useState(Date.now());
  const esRef = useRef(null);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = (() => {
      try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; }
    })();

    const addPoint = (d) => {
      setLastPacket(d);
      const point = toChartPoint(d);
      setChartData((prev) => {
        if (samePoint(prev[prev.length - 1], point)) return prev;
        const now = Date.now();
        const next = [...prev, point].filter((p) => now - p.ts < WINDOW_MS);
        if (next.length === 0) return [point];
        return next.slice(-MAX_POINTS);
      });
    };

    const loadSnapshot = () => {
      api.get(`/api/vehicles/${vehicleId}/live`)
        .then((res) => {
          if (!cancelled && res.data) addPoint(res.data);
        })
        .catch(() => {});
    };

    loadSnapshot();
    const snapshotTimer = setInterval(loadSnapshot, 5_000);

    const streamUrl = apiUrl(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`);
    const es = new EventSource(streamUrl);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        addPoint(d);
      } catch {}
    };

    es.onerror = () => setConnected(false);

    return () => {
      cancelled = true;
      clearInterval(snapshotTimer);
      es.close();
    };
  }, [vehicleId]);

  const lastDataAt = lastPacket?.recorded_at ? new Date(lastPacket.recorded_at) : null;
  const stale = lastDataAt && now - lastDataAt.getTime() > 15_000;
  const live = connected && !!lastDataAt && !stale;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span
          className={`w-2 h-2 rounded-full ${live ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}
        />
        {live ? 'Streaming live - 5-minute rolling window' : lastPacket ? 'Offline - last data older than 15 seconds' : connected ? 'Waiting for telemetry data...' : 'Connecting...'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {CHARTS.map((c) => (
          <ChartCard
            key={c.key}
            label={c.label}
            unit={c.unit}
            color={c.color}
            data={chartData}
            dataKey={c.key}
          />
        ))}
      </div>
    </div>
  );
}
