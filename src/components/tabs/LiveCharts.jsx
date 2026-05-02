import { useState, useEffect, useRef, memo, useMemo } from 'react';
import api, { apiUrl } from '../../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Gauge, Battery, Zap, Activity, Thermometer } from 'lucide-react';

/* ── THEME ── */
const G = {
  bg:     '#060b18',
  card:   'rgba(255,255,255,0.035)',
  border: 'rgba(255,255,255,0.07)',
  blur:   'blur(24px)',
  text:   '#e2e8f0',
  sub:    'rgba(148,163,184,0.5)',
  dim:    'rgba(148,163,184,0.22)',
};

const MAX_POINTS = 150;
const WINDOW_MS  = 5 * 60 * 1000;

/* ── Static chart config (never changes — defined outside component) ── */
const CHARTS = [
  { key: 'speed',           label: 'Vehicle Speed',    unit: 'km/h', color: '#f97316', Icon: Gauge,       domain: [0, 120],  large: true  },
  { key: 'soc',             label: 'State of Charge',  unit: '%',    color: '#22c55e', Icon: Battery,     domain: [0, 100],  large: true  },
  { key: 'battery_current', label: 'Battery Current',  unit: 'A',    color: '#38bdf8', Icon: Zap,         domain: 'auto',    large: false },
  { key: 'motor_rpm',       label: 'Motor RPM',        unit: 'rpm',  color: '#a78bfa', Icon: Activity,    domain: [0, 8000], large: false },
  { key: 'motor_temp',      label: 'Motor Temp',       unit: '°C',   color: '#f87171', Icon: Thermometer, domain: [0, 120],  large: false },
];
const LARGE_CHARTS = CHARTS.filter(c =>  c.large);
const SMALL_CHARTS = CHARTS.filter(c => !c.large);

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

function toPoint(d) {
  return {
    ts:              d?.recorded_at ? new Date(d.recorded_at).getTime() : Date.now(),
    speed:           d?.general?.speed        ?? null,
    soc:             d?.battery?.soc          ?? null,
    battery_current: d?.battery?.current      ?? null,
    motor_rpm:       d?.motor?.rpm            ?? null,
    motor_temp:      d?.motor?.motor_temp     ?? null,
  };
}

/* ─────────────────────────────────────────────
   HOOK: live status — re-renders only when the
   boolean flips, not every clock tick
───────────────────────────────────────────── */
function useLiveStatus(connected, lastDataAt) {
  const [live, setLive] = useState(false);
  useEffect(() => {
    function check() {
      const stale = !!lastDataAt && Date.now() - lastDataAt.getTime() > 15_000;
      setLive(connected && !!lastDataAt && !stale);
    }
    check();
    const t = setInterval(check, 2_000);
    return () => clearInterval(t);
  }, [connected, lastDataAt]);
  return live;
}

/* ─────────────────────────────────────────────
   CUSTOM TOOLTIP
───────────────────────────────────────────── */
const ChartTooltip = memo(function ChartTooltip({ active, payload, label, unit, color }) {
  if (!active || !payload?.length || payload[0].value == null) return null;
  return (
    <div style={{ background: 'rgba(6,11,24,0.94)', border: `1px solid ${color}38`, borderRadius: 10, padding: '8px 13px', backdropFilter: G.blur, WebkitBackdropFilter: G.blur, boxShadow: `0 4px 24px rgba(0,0,0,0.5),0 0 0 1px ${color}20` }}>
      <p style={{ margin: 0, fontSize: 9, color: G.dim, marginBottom: 5, letterSpacing: '0.06em' }}>{fmtTime(label)}</p>
      <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color, lineHeight: 1 }}>
        {Number(payload[0].value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        <span style={{ fontSize: 11, color: G.sub, marginLeft: 4, fontWeight: 500 }}>{unit}</span>
      </p>
    </div>
  );
});

/* ─────────────────────────────────────────────
   CHART CARD  — memo'd so it only re-renders
   when `data` or `cfg` actually changes
───────────────────────────────────────────── */
const ChartCard = memo(function ChartCard({ cfg, data }) {
  const vals   = useMemo(() => data.map(p => p[cfg.key]).filter(v => v != null && !isNaN(v)), [data, cfg.key]);
  const latest = vals.at(-1)  ?? null;
  const refVal = vals.at(-Math.min(11, vals.length)) ?? null;
  const minV   = vals.length ? Math.min(...vals) : null;
  const maxV   = vals.length ? Math.max(...vals) : null;
  const delta  = latest != null && refVal != null ? latest - refVal : null;
  const trend  = delta == null ? null : Math.abs(delta) < 0.3 ? 'flat' : delta > 0 ? 'up' : 'down';

  const tColor = trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : G.sub;
  const arrow  = trend === 'up' ? '↑'       : trend === 'down' ? '↓'       : '→';
  const chartH = cfg.large ? 168 : 130;
  const valSz  = cfg.large ? 38  : 28;

  /* stable tooltip content renderer — avoids new function ref on every render */
  const tooltipContent = useMemo(
    () => props => <ChartTooltip {...props} unit={cfg.unit} color={cfg.color} />,
    [cfg.unit, cfg.color]
  );

  /* stable cursor object — prevents recharts from re-creating its overlay */
  const cursor = useMemo(
    () => ({ stroke: `${cfg.color}30`, strokeWidth: 1, strokeDasharray: '3 3' }),
    [cfg.color]
  );

  /* stable activeDot — prevents new object reference on every render */
  const activeDot = useMemo(
    () => ({ r: 4, fill: cfg.color, stroke: G.bg, strokeWidth: 2 }),
    [cfg.color]
  );

  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, backdropFilter: G.blur, WebkitBackdropFilter: G.blur, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* accents */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 5%,${cfg.color}55 50%,transparent 95%)`, zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 110%,${cfg.color}0e 0%,transparent 60%)`, pointerEvents: 'none' }} />

      {/* header */}
      <div style={{ padding: '16px 18px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <cfg.Icon style={{ width: 11, height: 11, color: `${cfg.color}88` }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{cfg.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: valSz, fontWeight: 800, color: cfg.color, lineHeight: 1, letterSpacing: '-0.03em', textShadow: `0 0 28px ${cfg.color}55` }}>
              {latest != null ? Number(latest).toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—'}
            </span>
            <span style={{ fontSize: 12, color: G.sub, fontWeight: 500 }}>{cfg.unit}</span>
          </div>
        </div>
        {/* trend badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, background: `${tColor}12`, border: `1px solid ${tColor}28`, borderRadius: 10, padding: '6px 10px', minWidth: 54 }}>
          <span style={{ fontSize: 16, lineHeight: 1, color: tColor }}>{trend ? arrow : '—'}</span>
          {delta != null && (
            <span style={{ fontSize: 10, fontWeight: 700, color: tColor, letterSpacing: '0.02em' }}>
              {delta > 0 ? '+' : ''}{delta.toFixed(1)}
              <span style={{ fontSize: 9, color: G.dim, marginLeft: 2 }}>{cfg.unit}</span>
            </span>
          )}
        </div>
      </div>

      {/* min / max / pts strip */}
      <div style={{ display: 'flex', gap: 0, padding: '0 18px 10px', position: 'relative' }}>
        {[
          { label: 'MIN', val: minV },
          { label: 'MAX', val: maxV },
          { label: 'PTS', val: data.length, raw: true },
        ].map(({ label, val, raw }, i) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, paddingRight: i < 2 ? 12 : 0, borderRight: i < 2 ? `1px solid ${G.border}` : 'none', marginRight: i < 2 ? 12 : 0 }}>
            <span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: G.sub }}>
              {val != null ? (raw ? val : Number(val).toLocaleString('en-IN', { maximumFractionDigits: 1 })) : '—'}
              {!raw && val != null && <span style={{ fontSize: 9, color: G.dim, marginLeft: 2 }}>{cfg.unit}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* chart */}
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <ResponsiveContainer width="100%" height={chartH}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={cfg.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={cfg.color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <XAxis dataKey="ts" tickFormatter={fmtTime} tick={{ fontSize: 8, fill: G.dim, fontFamily: 'system-ui,sans-serif' }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={60} />
            <YAxis domain={cfg.domain} tick={{ fontSize: 8, fill: G.dim, fontFamily: 'system-ui,sans-serif' }} tickLine={false} axisLine={false} width={34} tickCount={4} />
            <Tooltip content={tooltipContent} cursor={cursor} />
            <Area type="monotone" dataKey={cfg.key} stroke={cfg.color} strokeWidth={2} fill={`url(#g-${cfg.key})`} dot={false} activeDot={activeDot} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   AMBIENT BLOBS  (static)
───────────────────────────────────────────── */
const Blobs = memo(function Blobs() {
  return (
    <>
      {[
        { w: 380, h: 380, c: 'rgba(37,99,235,0.1)',   t: -100, l: -100 },
        { w: 280, h: 280, c: 'rgba(14,165,233,0.07)', t:  320, r:  -80 },
        { w: 220, h: 220, c: 'rgba(112,26,217,0.07)', b:   20, l:   40 },
      ].map(({ w,h,c,t,l,r,b: bot }, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0, width: w, height: h, background: c, top: t, left: l, right: r, bottom: bot }} />
      ))}
    </>
  );
});

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function LiveCharts({ vehicleId }) {
  const w = useW();
  const sm = w < 640;

  const [chartData,  setChartData]  = useState([]);
  const [connected,  setConnected]  = useState(false);
  const [lastPacket, setLastPacket] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    let dead = false;
    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; } })();

    const addPoint = d => {
      setLastPacket(d);
      const pt = toPoint(d);
      setChartData(prev => {
        const last = prev.at(-1);
        if (last && last.ts === pt.ts) return prev;
        const cutoff = Date.now() - WINDOW_MS;
        return [...prev.filter(p => p.ts >= cutoff), pt].slice(-MAX_POINTS);
      });
    };

    const snap = () => api.get(`/api/vehicles/${vehicleId}/live`)
      .then(r => { if (!dead && r.data) addPoint(r.data); }).catch(() => {});
    snap();
    const t = setInterval(snap, 5_000);

    const es = new EventSource(apiUrl(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`));
    esRef.current = es;
    es.onopen    = () => setConnected(true);
    es.onmessage = e => { try { addPoint(JSON.parse(e.data)); } catch {} };
    es.onerror   = () => setConnected(false);
    return () => { dead = true; clearInterval(t); es.close(); };
  }, [vehicleId]);

  /* lastDataAt only changes when a new packet arrives */
  const lastDataAt = useMemo(
    () => lastPacket?.recorded_at ? new Date(lastPacket.recorded_at) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lastPacket?.recorded_at]
  );

  /* live status — only re-renders when boolean flips */
  const live = useLiveStatus(connected, lastDataAt);

  const statusText = live          ? 'Live telemetry  ·  5-minute rolling window'
    : lastPacket                   ? 'Offline — last known data shown'
    : connected                    ? 'Awaiting telemetry…'
    : 'Connecting…';

  /* stable date string — recomputed only when lastDataAt changes */
  const lastDataStr = useMemo(() => {
    if (!lastDataAt) return null;
    return `${lastDataAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${lastDataAt.toLocaleTimeString('en-IN')}`;
  }, [lastDataAt]);

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', background: G.bg, minHeight: '100%', padding: 16, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:1}70%{transform:scale(2.8);opacity:0}100%{opacity:0}}`}</style>

      <Blobs />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── STATUS BAR ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 15px', background: live ? 'rgba(34,197,94,0.055)' : 'rgba(255,255,255,0.025)', border: `1px solid ${live ? 'rgba(34,197,94,0.16)' : G.border}`, borderRadius: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ position: 'relative', width: 7, height: 7 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: live ? '#22c55e' : '#374151' }} />
              {live && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#22c55e', animation: 'ping 1.8s ease-out infinite' }} />}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: live ? '#4ade80' : G.sub }}>{statusText}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {live && <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 9px', letterSpacing: '0.14em' }}>LIVE</span>}
            {lastDataStr && <span style={{ fontSize: 10, color: G.dim }}>{lastDataStr}</span>}
            <span style={{ fontSize: 10, color: G.dim, borderLeft: `1px solid ${G.border}`, paddingLeft: 10 }}>{chartData.length} pts</span>
          </div>
        </div>

        {/* ── HERO ROW: Speed + SoC ── */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : '1fr 1fr', gap: 12 }}>
          {LARGE_CHARTS.map(cfg => <ChartCard key={cfg.key} cfg={cfg} data={chartData} />)}
        </div>

        {/* ── SECONDARY ROW: Current + RPM + Temp ── */}
        <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr' : w < 1024 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
          {SMALL_CHARTS.map(cfg => <ChartCard key={cfg.key} cfg={cfg} data={chartData} />)}
        </div>

      </div>
    </div>
  );
}
