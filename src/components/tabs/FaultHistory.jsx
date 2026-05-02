import { useState, useEffect } from 'react';
import api from '../../api';
import { AlertTriangle, RefreshCw, ShieldCheck, Calendar, Clock, Activity } from 'lucide-react';

function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

const G = {
  bg:      '#060b18',
  card:    'rgba(255,255,255,0.035)',
  cardHov: 'rgba(255,255,255,0.06)',
  border:  'rgba(255,255,255,0.07)',
  blur:    'blur(24px)',
  text:    '#e2e8f0',
  sub:     'rgba(148,163,184,0.5)',
  dim:     'rgba(148,163,184,0.22)',
  red:     '#f87171',
  yellow:  '#facc15',
  green:   '#22c55e',
  orange:  '#f97316',
};

function socColor(s) {
  return s > 50 ? G.green : s > 20 ? G.yellow : G.red;
}

function fmtDatetime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

function fmtDuration(seconds) {
  if (seconds == null) return null;
  if (seconds < 1)  return '<1s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s > 0 ? `${s}s` : ''}`.trim();
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim();
}

/* ── styled datetime input ── */
function DateInput({ label, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
      <input
        type="datetime-local" value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          padding: '9px 13px', borderRadius: 12,
          border: `1px solid ${focused ? 'rgba(56,189,248,0.4)' : G.border}`,
          background: focused ? 'rgba(56,189,248,0.05)' : 'rgba(255,255,255,0.03)',
          color: G.text, fontSize: 13, outline: 'none',
          fontFamily: 'inherit', colorScheme: 'dark', minWidth: 210,
          transition: 'border-color 0.18s, background 0.18s',
        }}
      />
    </div>
  );
}

/* ── single fault event row — grid on desktop, card on mobile ── */
function EventRow({ evt, isLast, mobile }) {
  const [hov, setHov] = useState(false);
  const act   = fmtDatetime(evt.activated_at);
  const deact = fmtDatetime(evt.deactivated_at);
  const dur   = fmtDuration(evt.duration_seconds);
  const soc   = evt.soc_at_activation   != null ? parseFloat(evt.soc_at_activation)   : null;
  const socD  = evt.soc_at_deactivation != null ? parseFloat(evt.soc_at_deactivation) : null;

  /* ── MOBILE CARD ── */
  if (mobile) {
    return (
      <div style={{
        padding: '14px', margin: '0 10px 8px',
        background: 'rgba(255,255,255,0.025)', border: `1px solid ${G.border}`,
        borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* header: status + fault code */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <AlertTriangle style={{ width: 10, height: 10, color: G.red }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(252,165,165,0.85)', lineHeight: 1.4, wordBreak: 'break-all' }}>{evt.fault_code}</span>
          </div>
          {evt.is_active ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: G.red, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: G.red, display: 'inline-block', animation: 'faultPing 1.4s ease-out infinite' }} />ACTIVE
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: G.green, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: G.green, display: 'inline-block' }} />RESOLVED
            </span>
          )}
        </div>
        {/* timestamps + duration */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Activated</span>
            {act && <><div style={{ fontSize: 11, fontWeight: 600, color: G.sub }}>{act.date}</div><div style={{ fontSize: 10, color: G.dim }}>{act.time}</div></>}
          </div>
          <div>
            <span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Deactivated</span>
            {deact ? <><div style={{ fontSize: 11, fontWeight: 600, color: G.sub }}>{deact.date}</div><div style={{ fontSize: 10, color: G.dim }}>{deact.time}</div></> : <span style={{ fontSize: 11, color: 'rgba(248,113,113,0.45)', fontStyle: 'italic' }}>Still active</span>}
          </div>
        </div>
        {/* metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 8, borderTop: `1px solid ${G.border}` }}>
          {dur && <div><span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Duration</span><span style={{ fontSize: 12, fontWeight: 700, color: evt.is_active ? G.orange : G.sub }}>{dur}</span></div>}
          {soc != null && <div><span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>SoC ▲</span><span style={{ fontSize: 12, fontWeight: 700, color: socColor(soc) }}>{soc.toFixed(1)}%</span></div>}
          {evt.speed_at_activation != null && <div><span style={{ fontSize: 8, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Speed ▲</span><span style={{ fontSize: 12, fontWeight: 700, color: G.text }}>{parseFloat(evt.speed_at_activation).toFixed(1)} <span style={{ fontSize: 9, color: G.dim }}>km/h</span></span></div>}
        </div>
      </div>
    );
  }

  const COLS = '110px 1fr 158px 158px 76px 96px 80px 96px 80px';

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
        borderBottom: isLast ? 'none' : `1px solid rgba(255,255,255,0.04)`,
        background: hov ? 'rgba(255,255,255,0.025)' : 'transparent',
        transition: 'background 0.12s', cursor: 'default',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Status */}
      <div style={{ padding: '13px 14px' }}>
        {evt.is_active ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, color: G.red, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 20, padding: '3px 8px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G.red, display: 'inline-block', animation: 'faultPing 1.4s ease-out infinite' }} />
            ACTIVE
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 800, color: G.green, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '3px 8px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: G.green, display: 'inline-block' }} />
            RESOLVED
          </span>
        )}
      </div>

      {/* Fault code */}
      <div style={{ padding: '13px 10px', display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
        <div style={{ width: 24, height: 24, borderRadius: 7, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AlertTriangle style={{ width: 11, height: 11, color: G.red }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(252,165,165,0.85)', wordBreak: 'break-word', lineHeight: 1.4 }}>
          {evt.fault_code}
        </span>
      </div>

      {/* Activated at */}
      <Timestamp dt={act} />

      {/* Deactivated at */}
      {deact
        ? <Timestamp dt={deact} />
        : <div style={{ padding: '13px 10px' }}><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(248,113,113,0.45)', fontStyle: 'italic' }}>Still active</span></div>
      }

      {/* Duration */}
      <div style={{ padding: '13px 10px' }}>
        {dur
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Duration</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: evt.is_active ? G.orange : G.sub }}>{dur}</span>
            </div>
          : <span style={{ fontSize: 13, color: G.dim }}>—</span>}
      </div>

      {/* Speed @ activation */}
      <SpeedStat value={evt.speed_at_activation} />

      {/* SoC @ activation */}
      <SocStat value={soc} />

      {/* Speed @ deactivation */}
      <SpeedStat value={evt.speed_at_deactivation} />

      {/* SoC @ deactivation */}
      <SocStat value={socD} />
    </div>
  );
}

function Timestamp({ dt }) {
  return (
    <div style={{ padding: '13px 10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar style={{ width: 9, height: 9, color: G.dim, flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: G.sub, whiteSpace: 'nowrap' }}>{dt.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Clock style={{ width: 9, height: 9, color: G.dim, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: G.dim, whiteSpace: 'nowrap' }}>{dt.time}</span>
        </div>
      </div>
    </div>
  );
}

function SpeedStat({ value }) {
  return (
    <div style={{ padding: '13px 10px' }}>
      {value != null
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Speed</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: G.text }}>{parseFloat(value).toFixed(1)}</span>
              <span style={{ fontSize: 9, color: G.dim }}>km/h</span>
            </div>
          </div>
        : <span style={{ fontSize: 13, color: G.dim }}>—</span>}
    </div>
  );
}

function SocStat({ value }) {
  return (
    <div style={{ padding: '13px 14px 13px 10px' }}>
      {value != null
        ? <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>SoC</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: socColor(value) }}>{value.toFixed(1)}</span>
              <span style={{ fontSize: 9, color: G.dim }}>%</span>
            </div>
            <div style={{ width: 40, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
              <div style={{ width: `${value}%`, height: '100%', background: socColor(value), borderRadius: 2 }} />
            </div>
          </div>
        : <span style={{ fontSize: 13, color: G.dim }}>—</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function FaultHistory({ vehicleId }) {
  const w = useW();
  const mobile = w < 768;

  const [events,   setEvents]   = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [from,     setFrom]     = useState('');
  const [to,       setTo]       = useState('');
  const [offset,   setOffset]   = useState(0);
  const LIMIT = 100;

  async function load(newOffset = 0) {
    setLoading(true); setSpinning(true);
    try {
      const params = { limit: LIMIT, offset: newOffset };
      if (from) params.from = from;
      if (to)   params.to   = to;
      const res = await api.get(`/api/vehicles/${vehicleId}/fault-events`, { params });
      setEvents(res.data.events ?? []);
      setTotal(res.data.total  ?? 0);
      setOffset(newOffset);
    } catch {
      setEvents([]); setTotal(0);
    } finally {
      setLoading(false);
      setTimeout(() => setSpinning(false), 400);
    }
  }

  useEffect(() => { load(0); }, [vehicleId]); // eslint-disable-line

  function applyFilter() { load(0); }

  const activeCount   = events.filter(e =>  e.is_active).length;
  const resolvedCount = events.filter(e => !e.is_active).length;
  const totalPages    = Math.ceil(total / LIMIT);
  const currentPage   = Math.floor(offset / LIMIT) + 1;

  const HEADER_COLS = '110px 1fr 158px 158px 76px 96px 80px 96px 80px';

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes faultPing { 0%{transform:scale(1);opacity:1} 70%{transform:scale(2.4);opacity:0} 100%{opacity:0} }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* ── FILTER BAR ── */}
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, backdropFilter: G.blur, WebkitBackdropFilter: G.blur, padding: '16px 20px', display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent 5%,rgba(248,113,113,0.4) 50%,transparent 95%)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity style={{ width: 13, height: 13, color: G.red }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: G.red, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Fault Events</span>
        </div>

        <div style={{ width: 1, height: 36, background: G.border, flexShrink: 0 }} />

        <DateInput label="From" value={from} onChange={setFrom} />
        <DateInput label="To"   value={to}   onChange={setTo}   />

        <button
          onClick={applyFilter} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)', color: 'white', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', opacity: loading ? 0.6 : 1, boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)', letterSpacing: '0.04em' }}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: spinning ? 'spin 0.6s linear infinite' : 'none' }} />
          Apply
        </button>

        {!loading && total > 0 && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: G.red, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 20, padding: '4px 11px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: G.red, animation: 'faultPing 1.4s ease-out infinite', display: 'inline-block' }} />
                {activeCount} active
              </span>
            )}
            {resolvedCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: G.green, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 20, padding: '4px 11px' }}>
                {resolvedCount} resolved
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 20, backdropFilter: G.blur, WebkitBackdropFilter: G.blur, overflow: 'hidden' }}>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '64px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(56,189,248,0.15)', borderTopColor: '#38bdf8', animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 13, color: G.sub }}>Loading fault events…</span>
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '64px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: 18, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck style={{ width: 24, height: 24, color: 'rgba(34,197,94,0.6)' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: G.text, marginBottom: 5 }}>No fault events</p>
              <p style={{ margin: 0, fontSize: 12, color: G.dim }}>No faults recorded in the selected period.</p>
            </div>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div style={{ overflowX: mobile ? 'visible' : 'auto' }}>
            {/* Mobile: card list */}
            {mobile ? (
              <div style={{ paddingTop: 8, paddingBottom: 4 }}>
                {events.map((evt, i) => (
                  <EventRow key={evt.fault_event_id} evt={evt} isLast={i === events.length - 1} mobile={true} />
                ))}
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: HEADER_COLS, borderBottom: `1px solid ${G.border}`, background: 'rgba(255,255,255,0.02)', minWidth: 900 }}>
                  {['Status','Fault Code','Activated At','Deactivated At','Duration','Speed ▲','SoC ▲','Speed ▼','SoC ▼'].map(col => (
                    <div key={col} style={{ padding: '11px 10px', fontSize: 9, fontWeight: 700, color: G.dim, letterSpacing: '0.12em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{col}</div>
                  ))}
                </div>
                {/* Rows */}
                <div style={{ minWidth: 900 }}>
                  {events.map((evt, i) => (
                    <EventRow key={evt.fault_event_id} evt={evt} isLast={i === events.length - 1} mobile={false} />
                  ))}
                </div>
              </>
            )}

            {/* Footer: count + pagination */}
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${G.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: 11, color: G.dim }}>
                Showing <span style={{ color: G.sub, fontWeight: 600 }}>{offset + 1}–{Math.min(offset + events.length, total)}</span> of <span style={{ color: G.sub, fontWeight: 600 }}>{total}</span> events
              </span>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => load(offset - LIMIT)} disabled={offset === 0}
                    style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${G.border}`, background: offset === 0 ? 'transparent' : 'rgba(255,255,255,0.04)', color: offset === 0 ? G.dim : G.sub, fontSize: 11, fontWeight: 600, cursor: offset === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  >← Prev</button>
                  <span style={{ fontSize: 11, color: G.dim }}>Page {currentPage} / {totalPages}</span>
                  <button
                    onClick={() => load(offset + LIMIT)} disabled={offset + LIMIT >= total}
                    style={{ padding: '5px 14px', borderRadius: 8, border: `1px solid ${G.border}`, background: offset + LIMIT >= total ? 'transparent' : 'rgba(255,255,255,0.04)', color: offset + LIMIT >= total ? G.dim : G.sub, fontSize: 11, fontWeight: 600, cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                  >Next →</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
