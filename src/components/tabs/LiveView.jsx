import { useState, useEffect, useRef, memo, useMemo } from 'react';
import api, { apiUrl } from '../../api';
import { MapPin, Zap, Gauge, AlertTriangle, Activity, Battery, Cpu } from 'lucide-react';

/* ── THEME ── */
const G = {
  bg:         '#060b18',
  card:       'rgba(255,255,255,0.035)',
  cardHov:    'rgba(255,255,255,0.065)',
  border:     'rgba(255,255,255,0.07)',
  borderHov:  'rgba(255,255,255,0.13)',
  blur:       'blur(24px)',
  text:       '#e2e8f0',
  sub:        'rgba(148,163,184,0.5)',
  dim:        'rgba(148,163,184,0.22)',
  green:      '#22c55e',
  orange:     '#f97316',
  blue:       '#38bdf8',
  red:        '#f87171',
  yellow:     '#facc15',
};

const socColor  = s => s == null ? G.green : s > 60 ? '#22c55e' : s > 25 ? '#facc15' : '#f87171';
const tempColor = t => t == null ? G.text  : t > 80 ? '#f87171' : t > 60 ? '#f97316' : G.text;

function formatFaults(f) {
  if (!f) return '';
  if (typeof f === 'string') return f;
  if (Array.isArray(f)) return f.join(', ');
  if (Array.isArray(f?.active)) return f.active.join(', ');
  return JSON.stringify(f);
}

/* ─────────────────────────────────────────────
   HOOK: live status — only re-renders when the
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
   SOC RING
───────────────────────────────────────────── */
const SocRing = memo(function SocRing({ soc }) {
  const pct   = soc != null ? Math.min(Math.max(parseFloat(soc), 0), 100) : null;
  const color = socColor(pct);
  const sz = 148, sw = 10, r = (sz - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.76;
  const fill = pct != null ? arc * (pct / 100) : 0;
  return (
    <div style={{ position: 'relative', width: sz, height: sz, flexShrink: 0 }}>
      <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}
        style={{ transform: 'rotate(128deg)', display: 'block' }}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth={sw}
          strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}90)`, transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {pct != null
          ? <>
              <span style={{ fontSize: 34, fontWeight: 800, color, lineHeight: 1, letterSpacing: '-0.04em', textShadow: `0 0 24px ${color}65` }}>{pct.toFixed(0)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: G.sub, letterSpacing: '0.04em' }}>%</span>
            </>
          : <span style={{ fontSize: 22, color: G.dim }}>—</span>}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   SPEED ARC
   Arc path stays fully inside viewBox (sweep=0).
───────────────────────────────────────────── */
const SpeedArc = memo(function SpeedArc({ value, max, color, unit, mid, maxLabel }) {
  const TOTAL  = 217;
  const filled = value != null ? TOTAL * Math.min(Math.max(value / max, 0), 1) : 0;
  const disp   = value != null
    ? (typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : value)
    : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, lineHeight: 1 }}>
        {disp != null
          ? <>
              <span style={{ fontSize: 42, fontWeight: 800, color, letterSpacing: '-0.05em', textShadow: `0 0 28px ${color}55` }}>{disp}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: G.sub, paddingBottom: 7 }}>{unit}</span>
            </>
          : <span style={{ fontSize: 36, color: G.dim, lineHeight: 1 }}>—</span>}
      </div>
      <svg width="100%" viewBox="0 0 200 78" style={{ display: 'block', marginTop: 2 }}>
        <path d="M16 68 A90 90 0 0 0 184 68" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" strokeLinecap="round" />
        <path d="M16 68 A90 90 0 0 0 184 68" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={TOTAL} strokeDashoffset={TOTAL - filled}
          style={{ filter: `drop-shadow(0 0 5px ${color}80)`, transition: 'stroke-dashoffset 0.85s cubic-bezier(0.16,1,0.3,1)' }} />
        <line x1="16"  y1="68" x2="21"  y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="100" y1="10" x2="100" y2="18" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="184" y1="68" x2="179" y2="60" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeLinecap="round" />
        <text x="8"   y="77" fill={G.dim} fontSize="9" fontFamily="system-ui,sans-serif">0</text>
        <text x="100" y="30" fill={G.dim} fontSize="9" fontFamily="system-ui,sans-serif" textAnchor="middle">{mid}</text>
        <text x="192" y="77" fill={G.dim} fontSize="9" fontFamily="system-ui,sans-serif" textAnchor="end">{maxLabel}</text>
      </svg>
    </div>
  );
});

/* ─────────────────────────────────────────────
   VOLT DISPLAY
───────────────────────────────────────────── */
const VoltDisplay = memo(function VoltDisplay({ max, min }) {
  const delta  = max != null && min != null ? max - min : null;
  const warn   = delta != null && delta > 0.05;
  const maxPct = max != null ? Math.min((max / 4.2) * 100, 100) : 0;
  const minPct = min != null ? Math.min((min / 4.2) * 100, 100) : 0;

  const VCol = ({ label, val, pct, barColor }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: barColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: G.text, letterSpacing: '-0.03em' }}>{val != null ? val.toFixed(2) : '—'}</span>
        {val != null && <span style={{ fontSize: 11, color: G.sub }}>V</span>}
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg,${barColor}44,${barColor}bb)`, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: 10, color: G.dim }}>of 4.20 V</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 0, height: '100%' }}>
      <VCol label="Max Cell" val={max} pct={maxPct} barColor="rgba(74,222,128,0.8)" />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 18px', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 1, flex: 1, background: `linear-gradient(to bottom, transparent, ${G.border}, transparent)` }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 0' }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Spread</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: warn ? G.yellow : G.sub, textShadow: warn ? `0 0 14px ${G.yellow}60` : 'none' }}>
            {delta != null ? delta.toFixed(3) : '—'}
          </span>
          {delta != null && <span style={{ fontSize: 9, color: G.dim }}>V</span>}
          {warn && <span style={{ fontSize: 8, fontWeight: 800, color: G.yellow, background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', borderRadius: 8, padding: '2px 6px', letterSpacing: '0.08em' }}>HIGH</span>}
        </div>
        <div style={{ width: 1, flex: 1, background: `linear-gradient(to bottom, transparent, ${G.border}, transparent)` }} />
      </div>
      <VCol label="Min Cell" val={min} pct={minPct} barColor="rgba(56,189,248,0.8)" />
    </div>
  );
});

/* ─────────────────────────────────────────────
   TEMP COLUMN BAR
───────────────────────────────────────────── */
const TempCol = memo(function TempCol({ value, label }) {
  const pct   = value != null ? Math.min((value / 100) * 100, 100) : 0;
  const color = tempColor(value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <div style={{ width: 20, height: 80, background: 'rgba(255,255,255,0.04)', border: `1px solid ${G.border}`, borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{ width: '100%', height: `${pct}%`, background: `linear-gradient(to top,${color},${color}60)`, boxShadow: `0 0 8px ${color}50`, transition: 'height 0.7s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, textShadow: `0 0 10px ${color}50` }}>
        {value != null ? `${value}°` : '—'}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
});

/* ─────────────────────────────────────────────
   STAT ITEM
───────────────────────────────────────────── */
const Stat = memo(function Stat({ label, value, unit, color, size = 20 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value != null
          ? <>
              <span style={{ fontSize: size, fontWeight: 700, color: color || G.text, lineHeight: 1 }}>
                {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value}
              </span>
              {unit && <span style={{ fontSize: 11, color: G.sub }}>{unit}</span>}
            </>
          : <span style={{ fontSize: size - 2, color: G.dim }}>—</span>}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   METRIC CARD
───────────────────────────────────────────── */
const MetricCard = memo(function MetricCard({ label, value, unit, valueColor, span }) {
  return (
    <div style={{
      padding: '11px 13px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${G.border}`,
      borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6,
      transition: 'background 0.15s, transform 0.15s', cursor: 'default',
      gridColumn: span ? `span ${span}` : undefined,
    }}
      onMouseEnter={e => { e.currentTarget.style.background = G.cardHov; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'none'; }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {value != null
          ? <>
              <span style={{ fontSize: 18, fontWeight: 700, color: valueColor || G.text, lineHeight: 1 }}>
                {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value}
              </span>
              {unit && <span style={{ fontSize: 10, color: G.sub }}>{unit}</span>}
            </>
          : <span style={{ fontSize: 16, color: G.dim }}>—</span>}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   METER BAR
───────────────────────────────────────────── */
const Meter = memo(function Meter({ label, value, color }) {
  const pct = value != null ? Math.min(Math.max(parseFloat(value), 0), 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value != null ? `${pct.toFixed(0)}%` : '—'}</span>
      </div>
      <div style={{ height: 7, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${color}55,${color}dd)`, borderRadius: 4, boxShadow: pct > 5 ? `0 0 8px ${color}55` : 'none', transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────── */
const SectionHdr = memo(function SectionHdr({ icon: Icon, title, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderBottom: `1px solid ${G.border}`, background: `linear-gradient(90deg,${color}09 0%,transparent 55%)` }}>
      <div style={{ width: 28, height: 28, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 12px ${color}22` }}>
        <Icon style={{ width: 13, height: 13, color }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.16em' }}>{title}</span>
    </div>
  );
});

/* ─────────────────────────────────────────────
   GLASS CARD  (lightweight wrapper — not memo'd
   because children always has a new reference)
───────────────────────────────────────────── */
function Card({ children, style, accent }) {
  return (
    <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, backdropFilter: G.blur, WebkitBackdropFilter: G.blur, overflow: 'hidden', position: 'relative', ...style }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent 5%,${accent}55 50%,transparent 95%)`, zIndex: 1, pointerEvents: 'none' }} />}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   AMBIENT BLOBS  (static — never re-renders)
═══════════════════════════════════════════════ */
const BLOBS = [
  { w: 400, h: 400, c: 'rgba(37,99,235,0.11)',  t: -120, l: -120 },
  { w: 300, h: 300, c: 'rgba(14,165,233,0.07)', t:  280, r:  -90 },
  { w: 240, h: 240, c: 'rgba(112,26,217,0.07)', b:   30, l:   20 },
];
const Blobs = memo(function Blobs() {
  return (
    <>
      {BLOBS.map(({ w,h,c,t,l,r,b: bot }, i) => (
        <div key={i} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none', zIndex: 0, width: w, height: h, background: c, top: t, left: l, right: r, bottom: bot }} />
      ))}
    </>
  );
});

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export default function LiveView({ vehicleId }) {
  const [data,       setData]       = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    let dead = false;
    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; } })();
    const snap = () => api.get(`/api/vehicles/${vehicleId}/live`)
      .then(r => { if (!dead && r.data) { setData(r.data); setLastUpdate(new Date()); } }).catch(() => {});
    snap();
    const t = setInterval(snap, 5_000);
    const es = new EventSource(apiUrl(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`));
    esRef.current = es;
    es.onopen    = () => setConnected(true);
    es.onmessage = e => { try { setData(JSON.parse(e.data)); setLastUpdate(new Date()); } catch {} };
    es.onerror   = () => setConnected(false);
    return () => { dead = true; clearInterval(t); es.close(); };
  }, [vehicleId]);

  /* lastDataAt — only changes when new data arrives */
  const lastDataAt = useMemo(
    () => data?.recorded_at ? new Date(data.recorded_at) : lastUpdate,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data?.recorded_at, lastUpdate]
  );

  /* live status — re-renders only when the boolean flips */
  const live = useLiveStatus(connected, lastDataAt);

  const statusText = live            ? 'Live telemetry'
    : data                           ? 'Offline — last known state'
    : connected                      ? 'Awaiting telemetry…'
    : 'Connecting…';

  /* extract sub-objects once per data update */
  const b = useMemo(() => data?.battery, [data]);
  const m = useMemo(() => data?.motor,   [data]);
  const g = useMemo(() => data?.general, [data]);

  /* stable date string — only recomputed when lastDataAt changes */
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
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: live ? G.green : '#374151' }} />
              {live && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: G.green, animation: 'ping 1.8s ease-out infinite' }} />}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: live ? '#4ade80' : G.sub }}>{statusText}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {live && <span style={{ fontSize: 9, fontWeight: 800, color: '#4ade80', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 9px', letterSpacing: '0.14em' }}>LIVE</span>}
            {lastDataStr && <span style={{ fontSize: 10, color: G.dim }}>{lastDataStr}</span>}
          </div>
        </div>

        {/* ── FAULT BANNER ── */}
        {g?.faults && (
          <div style={{ display: 'flex', gap: 11, padding: '11px 15px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12 }}>
            <AlertTriangle style={{ width: 14, height: 14, color: '#fca5a5', flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 800, color: '#fca5a5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>Active Fault</p>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(252,165,165,0.7)' }}>{formatFaults(g.faults)}</p>
            </div>
          </div>
        )}

        {/* ══ ROW 1: SoC | Speed + RPM + Controls ══ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.75fr', gap: 12, alignItems: 'stretch' }}>

          {/* SoC card */}
          <Card accent={G.green} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 14px 18px' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%,rgba(34,197,94,0.1) 0%,transparent 60%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Battery style={{ width: 11, height: 11, color: 'rgba(34,197,94,0.6)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>State of Charge</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SocRing soc={b?.soc} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${G.border}`, borderRadius: 12 }}>
                <Stat label="Available" value={b?.available_energy} unit="Wh" size={16} />
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${G.border}`, borderRadius: 12 }}>
                <Stat label="Current" value={b?.current} unit="A" size={16} />
              </div>
            </div>
          </Card>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>

              {/* Speed */}
              <Card accent={G.orange} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 110%,rgba(249,115,22,0.1) 0%,transparent 55%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Gauge style={{ width: 11, height: 11, color: 'rgba(249,115,22,0.55)' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Vehicle Speed</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <SpeedArc value={g?.speed != null ? parseFloat(g.speed) : null} max={120} color={G.orange} unit="km/h" mid="60" maxLabel="120" />
                </div>
              </Card>

              {/* RPM */}
              <Card accent={G.blue} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 110%,rgba(56,189,248,0.1) 0%,transparent 55%)', pointerEvents: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Activity style={{ width: 11, height: 11, color: 'rgba(56,189,248,0.55)' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Motor RPM</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <SpeedArc value={m?.rpm != null ? parseFloat(m.rpm) : null} max={8000} color={G.blue} unit="rpm" mid="4k" maxLabel="8k" />
                </div>
              </Card>
            </div>

            {/* Controls + Odometer */}
            <Card style={{ padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 0, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 20 }}>
                  <Meter label="Throttle" value={g?.throttle} color={G.orange} />
                  <Meter label="Brake"    value={g?.brake}    color={G.red} />
                </div>
                <div style={{ width: 1, background: `linear-gradient(to bottom,transparent,${G.border},transparent)` }} />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', paddingLeft: 20, gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin style={{ width: 10, height: 10, color: G.sub }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Odometer</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    {g?.odometer != null
                      ? <><span style={{ fontSize: 26, fontWeight: 800, color: G.text, letterSpacing: '-0.03em' }}>{Math.round(g.odometer).toLocaleString('en-IN')}</span><span style={{ fontSize: 12, color: G.sub }}>km</span></>
                      : <span style={{ fontSize: 22, color: G.dim }}>—</span>}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* ══ ROW 2: BATTERY ══ */}
        <Card accent={G.green}>
          <SectionHdr icon={Zap} title="Battery — Sun Mobility" color={G.green} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', minHeight: 0 }}>
            <div style={{ padding: '18px 20px', borderRight: `1px solid ${G.border}` }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>Cell Voltage Range</span>
              <VoltDisplay max={b?.max_cell_voltage} min={b?.min_cell_voltage} />
            </div>
            <div style={{ padding: '18px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignContent: 'start' }}>
              <MetricCard label="Batt. Current"     value={b?.current}             unit="A"  />
              <MetricCard label="Max Cell Temp"     value={b?.max_cell_temp}       unit="°C" valueColor={tempColor(b?.max_cell_temp)} />
              <MetricCard label="Min Cell Temp"     value={b?.min_cell_temp}       unit="°C" />
              <MetricCard label="Drive Curr. Limit" value={b?.drive_current_limit} unit="A"  />
              <MetricCard label="Regen Curr. Limit" value={b?.regen_current_limit} unit="A"  span={2} />
            </div>
          </div>
        </Card>

        {/* ══ ROW 3: MOTOR ══ */}
        <Card accent={G.blue}>
          <SectionHdr icon={Cpu} title="Motor Controller" color={G.blue} />
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', gap: 20, padding: '18px 26px', borderRight: `1px solid ${G.border}`, alignItems: 'flex-end' }}>
              <TempCol value={m?.controller_temp} label="Ctrl" />
              <TempCol value={m?.motor_temp}       label="Motor" />
            </div>
            <div style={{ padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'center' }}>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${G.border}`, borderRadius: 14 }}>
                <Stat label="RMS Current"       value={m?.rms_current}       unit="A" size={22} />
              </div>
              <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${G.border}`, borderRadius: 14 }}>
                <Stat label="Capacitor Voltage" value={m?.capacitor_voltage} unit="V" size={22} />
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
