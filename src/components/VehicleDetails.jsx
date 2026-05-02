import { useState, useEffect } from 'react';

function useW() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, BarChart2, AlertTriangle, MapPin, Hash } from 'lucide-react';
import Header from './Header';
import FooterFixed from './Footer';
import LiveView from './tabs/LiveView';
import LiveCharts from './tabs/LiveCharts';
import FaultHistory from './tabs/FaultHistory';
import MapView from './tabs/MapView';

const ADMIN_TABS = [
  { id: 'live',   label: 'Live View',     icon: Radio         },
  { id: 'charts', label: 'Live Charts',   icon: BarChart2     },
  { id: 'faults', label: 'Fault History', icon: AlertTriangle },
  { id: 'map',    label: 'Live Tracking', icon: MapPin        },
];

export default function VehicleDetails({ user, onLogout }) {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('live');
  const w = useW();
  const sm = w < 640;

  const vehicle = (() => { try { return JSON.parse(localStorage.getItem('selectedVehicle')); } catch { return null; } })();
  const tabs   = user?.role === 'admin' ? ADMIN_TABS : [ADMIN_TABS[0]];
  const backTo = user?.role === 'admin' ? '/admin' : '/dashboard';
  const name   = vehicle?.vehicle_no || vehicle?.vehicle_unique_id || `Vehicle #${id}`;
  const sub    = [vehicle?.make, vehicle?.model].filter(Boolean).join(' · ');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#010408', color: 'rgba(224,242,254,0.88)', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position: 'relative' }}>
      <style>{`
        @keyframes tabIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin   { to { transform:rotate(360deg) } }
      `}</style>

      {/* bg dot grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -180, right: -80, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.09) 0%, transparent 68%)', pointerEvents: 'none', zIndex: 0 }} />

      <Header user={user} onLogout={onLogout} />

      {/* ══════════════════════════════════════
          VEHICLE INFO  — NOT sticky, scrolls away
      ══════════════════════════════════════ */}
      <div style={{
        position: 'relative', zIndex: 10,
        background: 'linear-gradient(180deg,rgba(37,99,235,0.07) 0%,rgba(1,3,14,0.4) 100%)',
        borderBottom: '1px solid rgba(37,99,235,0.1)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: sm ? '0 12px' : '0 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: sm ? 10 : 16, padding: sm ? '12px 0 14px' : '16px 0 18px', flexWrap: 'wrap' }}>

            {/* Back button */}
            <button
              onClick={() => navigate(backTo)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(56,189,248,0.12)', cursor: 'pointer', color: 'rgba(56,189,248,0.45)', fontSize: 10, fontWeight: 700, padding: '6px 13px', borderRadius: 8, fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase', transition: 'all 0.18s', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(147,197,253,0.85)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; e.currentTarget.style.background = 'rgba(56,189,248,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(56,189,248,0.45)'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)'; e.currentTarget.style.background = 'none'; }}
            >
              <ArrowLeft style={{ width: 11, height: 11 }} />
              Fleet
            </button>

            <div style={{ width: 1, height: 22, background: 'rgba(37,99,235,0.2)', flexShrink: 0 }} />

            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg,#1e3a8a,#2563eb,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 800, color: 'white',
              boxShadow: '0 4px 18px rgba(37,99,235,0.5), 0 0 0 1px rgba(56,189,248,0.18)',
              letterSpacing: '-0.02em',
            }}>
              {name[0]?.toUpperCase()}
            </div>

            {/* Name + meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'rgba(224,242,254,0.96)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{name}</h1>
                {vehicle?.company_name && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(56,189,248,0.8)', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.24)', borderRadius: 20, padding: '3px 10px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    {vehicle.company_name}
                  </span>
                )}
              </div>
              {sub && (
                <span style={{ fontSize: 12, color: 'rgba(147,197,253,0.4)', letterSpacing: '0.01em' }}>{sub}</span>
              )}
            </div>

            {/* ID chip — hidden on very small screens */}
            <div style={{ marginLeft: 'auto', display: sm ? 'none' : 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.14)', borderRadius: 9, flexShrink: 0 }}>
              <Hash style={{ width: 10, height: 10, color: 'rgba(56,189,248,0.35)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(147,197,253,0.6)', fontVariantNumeric: 'tabular-nums' }}>{id}</span>
            </div>

          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TAB BAR  — sticky (only this sticks)
      ══════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 84, zIndex: 15,
        background: 'rgba(1,3,14,0.97)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(37,99,235,0.13)',
        boxShadow: '0 4px 28px rgba(0,0,0,0.45)',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(37,99,235,0.28) 30%, rgba(14,165,233,0.38) 60%, transparent)' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: sm ? '0 12px' : '0 28px' }}>
          {/* overflow-x scroll lets all 4 tabs fit on narrow screens */}
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(({ id: tid, label, icon: Icon }) => {
              const active = tab === tid;
              return (
                <button
                  key={tid}
                  onClick={() => setTab(tid)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: sm ? '11px 14px' : '12px 22px',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    color: active ? '#38bdf8' : 'rgba(147,197,253,0.32)',
                    borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
                    marginBottom: '-1px',
                    transition: 'color 0.18s',
                    position: 'relative',
                    letterSpacing: active ? '0.02em' : '0',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'rgba(147,197,253,0.65)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(147,197,253,0.32)'; }}
                >
                  <Icon style={{ width: 12, height: 12, opacity: active ? 1 : 0.5 }} />
                  {label}
                  {active && (
                    <span style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main style={{ position: 'relative', zIndex: 1, flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: sm ? '12px 10px 20px' : '20px 28px 28px', animation: 'tabIn 0.28s ease both' }} key={tab}>
        {tab === 'live'   && <LiveView    vehicleId={id} user={user} />}
        {tab === 'charts' && <LiveCharts  vehicleId={id} user={user} />}
        {tab === 'faults' && <FaultHistory vehicleId={id} />}
        {tab === 'map'    && <MapView     vehicleId={id} />}
      </main>

      <FooterFixed />
    </div>
  );
}
