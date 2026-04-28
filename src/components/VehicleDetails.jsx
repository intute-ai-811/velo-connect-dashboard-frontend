import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, BarChart2, AlertTriangle, MapPin } from 'lucide-react';
import Header from './Header';
import FooterFixed from './Footer';
import LiveView from './tabs/LiveView';
import LiveCharts from './tabs/LiveCharts';
import FaultHistory from './tabs/FaultHistory';
import MapView from './tabs/MapView';

const ADMIN_TABS = [
  { id:'live',   label:'Live View',     icon:Radio         },
  { id:'charts', label:'Live Charts',   icon:BarChart2     },
  { id:'faults', label:'Fault History', icon:AlertTriangle },
  { id:'map',    label:'Live Tracking', icon:MapPin        },
];

export default function VehicleDetails({ user, onLogout }) {
  const { id }  = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('live');

  const vehicle = (() => { try { return JSON.parse(localStorage.getItem('selectedVehicle')); } catch { return null; } })();
  const tabs   = user?.role === 'admin' ? ADMIN_TABS : [ADMIN_TABS[0]];
  const backTo = user?.role === 'admin' ? '/admin' : '/dashboard';
  const name   = vehicle?.vehicle_no || vehicle?.vehicle_unique_id || `Vehicle #${id}`;
  const sub    = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ');

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'#010408', color:'rgba(224,242,254,0.88)', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes tabIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle, rgba(56,189,248,0.05) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:-180, right:-80, width:520, height:520, borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 68%)', pointerEvents:'none', zIndex:0 }} />

      <Header user={user} onLogout={onLogout} />

      {/* ── Vehicle subheader ── */}
      <div style={{
        position:'sticky', top:84, zIndex:15,
        background:'rgba(1,3,14,0.96)', backdropFilter:'blur(20px)',
        borderBottom:'1px solid rgba(37,99,235,0.13)',
      }}>
        {/* Thin gradient top line */}
        <div style={{ height:1, background:'linear-gradient(to right, transparent, rgba(37,99,235,0.35) 30%, rgba(14,165,233,0.45) 60%, transparent)' }} />

        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 28px' }}>
          {/* Back + vehicle info row */}
          <div style={{ display:'flex', alignItems:'center', gap:18, padding:'14px 0 12px' }}>
            <button
              onClick={() => navigate(backTo)}
              style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(56,189,248,0.35)', fontSize:12, fontWeight:600, padding:0, fontFamily:'inherit', transition:'color 0.2s', flexShrink:0, letterSpacing:'0.04em', textTransform:'uppercase' }}
              onMouseEnter={e=>(e.currentTarget.style.color='rgba(147,197,253,0.7)')}
              onMouseLeave={e=>(e.currentTarget.style.color='rgba(56,189,248,0.35)')}
            >
              <ArrowLeft style={{ width:14,height:14 }}/>
              Fleet
            </button>

            {/* Divider */}
            <div style={{ width:1, height:18, background:'rgba(37,99,235,0.25)', flexShrink:0 }} />

            {/* Vehicle avatar */}
            <div style={{
              width:36, height:36, borderRadius:11, flexShrink:0,
              background:'linear-gradient(135deg,#1e3a8a,#2563eb,#06b6d4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:14, fontWeight:800, color:'white',
              boxShadow:'0 4px 14px rgba(37,99,235,0.4)',
            }}>
              {name[0]}
            </div>

            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <h1 style={{ margin:0, fontSize:16, fontWeight:700, color:'rgba(224,242,254,0.95)', letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>{name}</h1>
                {sub && <span style={{ fontSize:12, color:'rgba(147,197,253,0.4)', whiteSpace:'nowrap' }}>{sub}</span>}
                {vehicle?.company_name && (
                  <span style={{ fontSize:11, color:'rgba(37,99,235,0.7)', background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.2)', borderRadius:20, padding:'2px 8px', whiteSpace:'nowrap' }}>
                    {vehicle.company_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Tab bar — underline style ── */}
          <div style={{ display:'flex', gap:0, borderTop:'1px solid rgba(37,99,235,0.08)', marginTop:0 }}>
            {tabs.map(({ id:tid, label, icon:Icon }) => {
              const active = tab === tid;
              return (
                <button
                  key={tid}
                  onClick={() => setTab(tid)}
                  style={{
                    display:'flex', alignItems:'center', gap:7,
                    padding:'11px 20px',
                    background:'none', border:'none', cursor:'pointer', fontFamily:'inherit',
                    fontSize:13, fontWeight: active ? 600 : 500,
                    color: active ? '#38bdf8' : 'rgba(147,197,253,0.35)',
                    borderBottom: active ? '2px solid #38bdf8' : '2px solid transparent',
                    marginBottom:'-1px',
                    transition:'all 0.18s',
                    position:'relative',
                  }}
                  onMouseEnter={e => { if(!active) e.currentTarget.style.color='rgba(147,197,253,0.65)'; }}
                  onMouseLeave={e => { if(!active) e.currentTarget.style.color='rgba(147,197,253,0.35)'; }}
                >
                  <Icon style={{ width:13,height:13, opacity: active ? 1 : 0.6 }}/>
                  {label}
                  {active && (
                    <span style={{
                      position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)',
                      width:4, height:4, borderRadius:'50%', background:'#38bdf8',
                      boxShadow:'0 0 8px #38bdf8',
                    }}/>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <main style={{ position:'relative', zIndex:1, flex:1, maxWidth:1280, width:'100%', margin:'0 auto', padding:'24px 28px', animation:'tabIn 0.3s ease both' }}>
        {tab==='live'   && <LiveView    vehicleId={id} user={user} />}
        {tab==='charts' && <LiveCharts  vehicleId={id} user={user} />}
        {tab==='faults' && <FaultHistory vehicleId={id} />}
        {tab==='map'    && <MapView     vehicleId={id} />}
      </main>

      <FooterFixed />
    </div>
  );
}
