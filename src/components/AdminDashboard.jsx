import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCcw, Search, Loader2, AlertCircle, Activity, Wifi, WifiOff, Clock } from 'lucide-react';
import api from '../api';
import Header from './Header';
import FooterFixed from './Footer';

// ── Fix #1: All imports are now at the top before any function definitions ──

const PAGE_SIZE = 10;

/* ── Window width hook ── */
function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

/* ── Fix #2: statusOf now correctly returns 'idle' for vehicles
      inactive between 15 seconds and 5 minutes ── */
function statusOf(lastSeen) {
  if (!lastSeen) return 'offline';
  const age = Date.now() - new Date(lastSeen).getTime();
  if (age < 15_000)   return 'online';
  if (age < 300_000)  return 'idle';    // < 5 minutes → idle
  return 'offline';
}

/* ── Compact arc ring ── */
function ArcRing({ pct = 0, color, size = 38, stroke = 4 }) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const arc  = circ * 0.76;
  const fill = arc * Math.min(Math.max(pct, 0), 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(128deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.07)" strokeWidth={stroke}
        strokeDasharray={`${arc} ${circ - arc}`} strokeLinecap="round" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 3px ${color}99)` }} />
    </svg>
  );
}

/* ── Compact stat card ── */
function StatCard({ icon: Icon, label, value, total, accent, sublabel }) {
  const pct = total > 0 ? value / total : 0;
  return (
    <div
      style={{
        position: 'relative', background: 'rgba(4,10,32,0.92)', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.07)', padding: '14px 16px',
        overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${accent}45`; e.currentTarget.style.boxShadow = `0 6px 24px ${accent}15`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Icon box */}
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon style={{ width: 16, height: 16, color: accent }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'rgba(180,210,255,0.55)', letterSpacing: '0.13em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</p>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'rgba(230,245,255,0.95)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</p>
        <p style={{ margin: '3px 0 0', fontSize: 11, color: 'rgba(160,200,255,0.45)' }}>{sublabel}</p>
      </div>

      {/* Ring + pct */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 38, height: 38 }}>
          <ArcRing pct={pct} color={accent} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: accent, lineHeight: 1 }}>{Math.round(pct * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SoC bar ── */
function SocBar({ soc }) {
  if (soc == null) return <span style={{ color: 'rgba(160,200,255,0.3)', fontSize: 13 }}>—</span>;
  const pct   = Math.min(Math.max(parseFloat(soc), 0), 100);
  const color = pct > 60 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444';
  const text  = pct > 60 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{ width: 52, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: color, boxShadow: `0 0 6px ${color}80` }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: text, fontVariantNumeric: 'tabular-nums', minWidth: 32 }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

/* ── Status indicator ── */
function StatusDot({ status }) {
  const cfg = {
    online:  { color: '#22c55e', label: 'Online'  },
    idle:    { color: '#eab308', label: 'Idle'    },
    offline: { color: '#6b7280', label: 'Offline' },
  }[status] || { color: '#6b7280', label: 'Offline' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0,
        boxShadow: status === 'online' ? `0 0 8px ${cfg.color}` : 'none',
        animation: status === 'online' ? 'dotPulse 2s ease-in-out infinite' : 'none',
      }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: status === 'offline' ? 'rgba(156,163,175,0.6)' : cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

const COLS = ['#', 'Vehicle', 'Make / Model', 'Customer', 'Battery', 'Last Seen', 'Status'];

export default function AdminDashboard({ user, onLogout }) {
  const w  = useW();
  const sm = w < 640;

  const [vehicles,     setVehicles]    = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [refreshing,   setRefreshing]  = useState(false);
  const [error,        setError]       = useState('');
  const [search,       setSearch]      = useState('');
  const [page,         setPage]        = useState(1);
  const [lastRefresh,  setLastRefresh] = useState(null);
  const hasLoadedRef = useRef(false);
  const navigate     = useNavigate();

  const load = useCallback(async ({ showLoading = false } = {}) => {
    setError('');
    if (showLoading || !hasLoadedRef.current) setLoading(true);
    console.log('[AdminDashboard] load() called, showLoading=', showLoading);
    try {
      const r = await api.get('/api/vehicles/admin-summary');
      console.log('[AdminDashboard] API /admin-summary status=', r.status, 'data shape=', {
        isArray:      Array.isArray(r.data),
        hasDataProp:  !!r.data?.data,
        dataLength:   Array.isArray(r.data?.data) ? r.data.data.length : Array.isArray(r.data) ? r.data.length : 'N/A',
        keys:         r.data && typeof r.data === 'object' ? Object.keys(r.data) : typeof r.data,
      });
      const list = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
      console.log('[AdminDashboard] setVehicles with', list.length, 'items');
      setVehicles(list);
      hasLoadedRef.current = true;
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[AdminDashboard] load() error:', e.message, 'status=', e.response?.status, 'data=', e.response?.data);
      if (e.response?.status === 401) { onLogout(); return; }
      setError('Failed to load fleet data.');
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    load({ showLoading: true });
    const t = setInterval(() => load(), 30_000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const v = vehicles ?? [];
    const q = search.toLowerCase();
    return q
      ? v.filter(x =>
          [x.vehicle_no, x.vehicle_unique_id, x.company_name, x.make, x.model]
            .some(f => f?.toLowerCase().includes(q))
        )
      : v;
  }, [vehicles, search]);

  // Fix #3: stats now correctly counts idle vehicles now that statusOf returns 'idle'
  const stats = useMemo(() => {
    const v = vehicles ?? [];
    return {
      total:   v.length,
      online:  v.filter(x => statusOf(x.last_seen) === 'online').length,
      idle:    v.filter(x => statusOf(x.last_seen) === 'idle').length,
      offline: v.filter(x => statusOf(x.last_seen) === 'offline').length,
    };
  }, [vehicles]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  // Fix #4: Pagination buttons extracted cleanly — no fragile tuple destructuring
  const paginationButtons = [
    { label: '‹ Prev', onClick: () => setPage(p => Math.max(1, p - 1)),           disabled: page === 1          },
    { label: 'Next ›', onClick: () => setPage(p => Math.min(totalPages, p + 1)),  disabled: page === totalPages },
  ];

  // Fix #5: Safe navigation with localStorage error handling
  const handleRowClick = (v) => {
    try {
      localStorage.setItem('selectedVehicle', JSON.stringify(v));
    } catch (err) {
      console.warn('[AdminDashboard] localStorage write failed:', err);
    }
    navigate(`/vehicle/${v.vehicle_master_id}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#010408', color: 'rgba(224,242,254,0.92)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes dotPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin      { to{transform:rotate(360deg)} }
      `}</style>

      {/* Background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.05) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -180, right: -80,  width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.11) 0%, transparent 68%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -160, left: -80, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Header user={user} onLogout={onLogout} />

      {/* ── Page hero ── */}
      <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(37,99,235,0.1)', background: 'linear-gradient(to bottom, rgba(3,10,35,0.8), rgba(1,4,14,0.5))' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: sm ? '16px 14px 14px' : '24px 28px 22px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: 'rgba(100,180,255,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>Velo Connect</p>
              <h1 style={{ margin: '0 0 3px', fontSize: 26, fontWeight: 800, color: 'rgba(230,245,255,0.97)', letterSpacing: '-0.03em', lineHeight: 1 }}>Fleet Overview</h1>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(140,180,255,0.45)' }}>
                {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString('en-IN')}` : 'Real-time telemetry'}
              </p>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'rgba(100,170,255,0.35)', pointerEvents: 'none' }} />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search vehicles…"
                  style={{ paddingLeft: 33, paddingRight: 14, paddingTop: 9, paddingBottom: 9, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)', borderRadius: 10, color: 'rgba(220,240,255,0.9)', fontSize: 13, outline: 'none', width: sm ? '100%' : 210, fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(56,189,248,0.5)'; e.target.style.background = 'rgba(37,99,235,0.13)'; }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(37,99,235,0.22)'; e.target.style.background = 'rgba(37,99,235,0.08)'; }}
                />
              </div>
              <button
                onClick={onRefresh}
                disabled={refreshing || loading}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: refreshing || loading ? 0.5 : 1, fontFamily: 'inherit', boxShadow: '0 4px 18px rgba(37,99,235,0.35)', transition: 'opacity 0.2s' }}
              >
                {refreshing
                  ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.7s linear infinite' }} />
                  : <RefreshCcw style={{ width: 14, height: 14 }} />
                }
                Refresh
              </button>
            </div>
          </div>

          {/* Stat cards */}
          {!loading && vehicles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
              <StatCard icon={Activity} label="Total Fleet" value={stats.total}   total={stats.total} accent="#3b82f6" sublabel="vehicles registered" />
              <StatCard icon={Wifi}     label="Online"      value={stats.online}  total={stats.total} accent="#22c55e" sublabel="active right now"    />
              <StatCard icon={Clock}    label="Idle"        value={stats.idle}    total={stats.total} accent="#eab308" sublabel="inactive < 5 min"    />
              <StatCard icon={WifiOff}  label="Offline"     value={stats.offline} total={stats.total} accent="#6b7280" sublabel="no recent signal"    />
            </div>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <main style={{ position: 'relative', zIndex: 1, flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: sm ? '14px 14px' : '20px 28px' }}>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 11, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', marginBottom: 16 }}>
            <AlertCircle style={{ width: 15, height: 15, color: '#fca5a5', flexShrink: 0 }} />
            <span style={{ color: '#fca5a5', fontSize: 13 }}>{error}</span>
          </div>
        )}

        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(2,5,20,0.92)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(37,99,235,0.06)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {COLS.map(c => (
                    <th key={c} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'rgba(160,200,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' }}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && vehicles.length === 0 ? (
                  <tr><td colSpan={COLS.length} style={{ padding: '72px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, border: '2px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <p style={{ color: 'rgba(160,200,255,0.5)', fontSize: 13 }}>Loading fleet data…</p>
                    </div>
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={COLS.length} style={{ padding: '72px', textAlign: 'center', color: 'rgba(160,200,255,0.35)', fontSize: 13 }}>
                    No vehicles found{search ? ` matching "${search}"` : ''}.
                  </td></tr>
                ) : paginated.map((v, idx) => {
                  const status   = statusOf(v.last_seen);
                  const isOnline = status === 'online';
                  return (
                    <tr
                      key={v.vehicle_master_id}
                      onClick={() => handleRowClick(v)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s', background: isOnline ? 'rgba(34,197,94,0.025)' : 'transparent' }}
                      onMouseEnter={e => (e.currentTarget.style.background = isOnline ? 'rgba(34,197,94,0.055)' : 'rgba(37,99,235,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = isOnline ? 'rgba(34,197,94,0.025)' : 'transparent')}
                    >
                      {/* # */}
                      <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(160,200,255,0.4)', fontVariantNumeric: 'tabular-nums', width: 48 }}>
                        {(page - 1) * PAGE_SIZE + idx + 1}
                      </td>

                      {/* Vehicle */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,rgba(37,99,235,0.35),rgba(14,165,233,0.2))', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'rgba(186,230,253,0.9)', flexShrink: 0 }}>
                            {(v.vehicle_no || v.vehicle_unique_id || '?')[0]}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: 'rgba(220,240,255,0.95)' }}>{v.vehicle_no || v.vehicle_unique_id}</p>
                            {v.vehicle_no && v.vehicle_unique_id && v.vehicle_no !== v.vehicle_unique_id && (
                              <p style={{ margin: '1px 0 0', fontSize: 10, color: 'rgba(100,160,220,0.5)', fontFamily: 'monospace' }}>{v.vehicle_unique_id}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Make/Model */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(180,215,255,0.7)' }}>
                        {[v.make, v.model].filter(Boolean).join(' ') || <span style={{ color: 'rgba(100,140,200,0.3)' }}>—</span>}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(160,200,255,0.6)' }}>
                        {v.company_name || <span style={{ color: 'rgba(100,140,200,0.3)' }}>—</span>}
                      </td>

                      {/* SoC */}
                      <td style={{ padding: '14px 20px' }}><SocBar soc={v.soc} /></td>

                      {/* Last seen */}
                      <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(140,180,255,0.55)', whiteSpace: 'nowrap' }}>
                        {v.last_seen
                          ? new Date(v.last_seen).toLocaleString('en-IN')
                          : <span style={{ color: 'rgba(100,140,200,0.3)' }}>Never</span>
                        }
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 20px' }}><StatusDot status={status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer / pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(37,99,235,0.03)' }}>
            <span style={{ fontSize: 12, color: 'rgba(140,180,255,0.45)' }}>
              {filtered.length === 0
                ? '0 vehicles'
                : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length} vehicles`
              }
            </span>

            {/* Fix #4: Clean pagination — no tuple destructuring */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {paginationButtons.map(({ label, onClick, disabled }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    disabled={disabled}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(37,99,235,0.22)', background: 'rgba(37,99,235,0.08)', color: 'rgba(180,215,255,0.75)', fontSize: 12, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.25 : 1, fontFamily: 'inherit', transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(37,99,235,0.18)'; e.currentTarget.style.color = 'rgba(220,240,255,0.9)'; } }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.color = 'rgba(180,215,255,0.75)'; }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <FooterFixed />
    </div>
  );
}