import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RefreshCcw, Search, Loader2, AlertCircle } from 'lucide-react';
import Header from './Header';
import FooterFixed from './Footer';

const PAGE_SIZE = 10;

const T = {
  bg:        '#010408',
  cardBg:    'rgba(2,5,20,0.95)',
  border:    'rgba(37,99,235,0.14)',
  btnGrad:   'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
  accentLine:'linear-gradient(90deg,#1e3a8a,#2563eb,#0ea5e9,#7dd3fc)',
  text:      'rgba(224,242,254,0.88)',
  textSub:   'rgba(147,197,253,0.4)',
  textMuted: 'rgba(56,189,248,0.22)',
};

function statusOf(lastSeen) {
  if (!lastSeen) return 'offline';
  const age = Date.now() - new Date(lastSeen).getTime();
  if (age < 60_000) return 'online';
  if (age < 300_000) return 'idle';
  return 'offline';
}

function StatusPill({ status }) {
  const cfg = {
    online:  { bg:'rgba(34,197,94,0.10)',  border:'rgba(34,197,94,0.28)',  text:'#4ade80', dot:'#22c55e' },
    idle:    { bg:'rgba(234,179,8,0.10)',   border:'rgba(234,179,8,0.28)',  text:'#facc15', dot:'#eab308' },
    offline: { bg:'rgba(107,114,128,0.10)', border:'rgba(107,114,128,0.2)', text:'#9ca3af', dot:'#6b7280' },
  }[status] || { bg:'rgba(107,114,128,0.10)', border:'rgba(107,114,128,0.2)', text:'#9ca3af', dot:'#6b7280' };
  const label = status ? status[0].toUpperCase() + status.slice(1) : 'Offline';
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.text }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, flexShrink:0, boxShadow:status==='online'?`0 0 6px ${cfg.dot}`:'none', animation:status==='online'?'dotPulse 2s ease-in-out infinite':'none' }} />
      {label}
    </span>
  );
}

function SocBar({ soc }) {
  if (soc == null) return <span style={{ color:T.textMuted, fontSize:13 }}>—</span>;
  const pct = Math.min(Math.max(parseFloat(soc), 0), 100);
  const color = pct > 60 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444';
  const textColor = pct > 60 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ width:48, height:4, borderRadius:4, background:'rgba(37,99,235,0.12)', overflow:'hidden', flexShrink:0 }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:color }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:textColor, fontVariantNumeric:'tabular-nums' }}>{pct.toFixed(0)}%</span>
    </div>
  );
}

const COLS = ['#','Vehicle No.','Make / Model','SoC','Last Seen','Status'];

export default function CustomerDashboard({ user, onLogout }) {
  const [vehicles,   setVehicles]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const navigate = useNavigate();

  async function load() {
    setError(''); setLoading(true);
    try { const r = await axios.get('/api/vehicles/my'); setVehicles(r.data.data); }
    catch (e) { if (e.response?.status===401) { onLogout(); return; } setError('Failed to load your vehicles.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? vehicles.filter(v => [v.vehicle_no,v.vehicle_unique_id,v.make,v.model].some(f=>f?.toLowerCase().includes(q))) : vehicles;
  }, [vehicles, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const paginated = useMemo(() => filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE), [filtered, page]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:T.bg, color:T.text, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', position:'relative' }}>
      <style>{`@keyframes dotPulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(circle, rgba(56,189,248,0.055) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:-200, left:-100, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }} />

      <Header user={user} onLogout={onLogout} />

      <main style={{ position:'relative', zIndex:1, flex:1, maxWidth:1200, width:'100%', margin:'0 auto', padding:'32px 20px' }}>

        <div style={{ marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
            <div style={{ width:3, height:22, borderRadius:2, background:T.accentLine }} />
            <h1 style={{ fontSize:22, fontWeight:700, color:T.text, letterSpacing:'-0.02em', margin:0 }}>My Vehicles</h1>
          </div>
          <p style={{ fontSize:13, color:T.textSub, marginLeft:15 }}>
            {vehicles.length > 0 ? `${vehicles.length} vehicle${vehicles.length!==1?'s':''} in your fleet` : 'Monitor your registered fleet in real-time'}
          </p>
        </div>

        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <Search style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:15, height:15, color:'rgba(56,189,248,0.3)', pointerEvents:'none' }} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by vehicle number or make…"
              style={{ width:'100%', paddingLeft:36, paddingRight:12, paddingTop:10, paddingBottom:10, background:'rgba(37,99,235,0.06)', border:`1px solid ${T.border}`, borderRadius:12, color:T.text, fontSize:13, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }}
              onFocus={e=>(e.target.style.borderColor='rgba(14,165,233,0.4)')}
              onBlur={e=>(e.target.style.borderColor=T.border)}
            />
          </div>
          <button
            onClick={onRefresh} disabled={refreshing || loading}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:'none', background:T.btnGrad, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', opacity:refreshing||loading?0.6:1, fontFamily:'inherit' }}
          >
            {refreshing ? <Loader2 style={{ width:15,height:15,animation:'spin 0.7s linear infinite' }}/> : <RefreshCcw style={{ width:15,height:15 }}/>}
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:12, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', marginBottom:16 }}>
            <AlertCircle style={{ width:15,height:15,color:'#fca5a5',flexShrink:0 }}/> <span style={{ color:'#fca5a5', fontSize:13 }}>{error}</span>
          </div>
        )}

        <div style={{ borderRadius:16, overflow:'hidden', border:`1px solid ${T.border}`, background:'rgba(2,5,20,0.8)' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${T.border}`, background:'rgba(37,99,235,0.04)' }}>
                  {COLS.map(c => <th key={c} style={{ padding:'14px 20px', textAlign:'left', fontSize:10, fontWeight:700, color:T.textMuted, textTransform:'uppercase', letterSpacing:'0.14em', whiteSpace:'nowrap' }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {loading && vehicles.length===0 ? (
                  <tr><td colSpan={COLS.length} style={{ padding:'80px 20px', textAlign:'center' }}>
                    <Loader2 style={{ width:28,height:28,color:'#2563eb',animation:'spin 0.7s linear infinite',margin:'0 auto 12px' }}/>
                    <p style={{ color:T.textSub, fontSize:13 }}>Loading your vehicles…</p>
                  </td></tr>
                ) : paginated.length===0 ? (
                  <tr><td colSpan={COLS.length} style={{ padding:'80px 20px', textAlign:'center', color:T.textMuted, fontSize:13 }}>No vehicles found.</td></tr>
                ) : paginated.map((v,idx) => {
                  const status = statusOf(v.last_seen);
                  return (
                    <tr key={v.vehicle_master_id}
                      onClick={() => { localStorage.setItem('selectedVehicle', JSON.stringify(v)); navigate(`/vehicle/${v.vehicle_master_id}`); }}
                      style={{ borderBottom:`1px solid rgba(37,99,235,0.07)`, cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(37,99,235,0.06)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    >
                      <td style={{ padding:'14px 20px', fontSize:11, color:T.textMuted }}>{(page-1)*PAGE_SIZE+idx+1}</td>
                      <td style={{ padding:'14px 20px', fontWeight:600, fontSize:13, color:T.text }}>{v.vehicle_no||v.vehicle_unique_id}</td>
                      <td style={{ padding:'14px 20px', fontSize:13, color:'rgba(147,197,253,0.6)' }}>{[v.make,v.model].filter(Boolean).join(' ')||'—'}</td>
                      <td style={{ padding:'14px 20px' }}><SocBar soc={v.soc}/></td>
                      <td style={{ padding:'14px 20px', fontSize:11, color:T.textMuted, whiteSpace:'nowrap' }}>{v.last_seen ? new Date(v.last_seen).toLocaleString('en-IN') : '—'}</td>
                      <td style={{ padding:'14px 20px' }}><StatusPill status={status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderTop:`1px solid ${T.border}`, background:'rgba(37,99,235,0.02)' }}>
              <span style={{ fontSize:12, color:T.textMuted }}>{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE,filtered.length)} of {filtered.length}</span>
              <div style={{ display:'flex', gap:8 }}>
                {[['Previous',()=>setPage(p=>Math.max(1,p-1)),page===1],['Next',()=>setPage(p=>Math.min(totalPages,p+1)),page===totalPages]].map(([lbl,fn,dis])=>(
                  <button key={lbl} onClick={fn} disabled={dis} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${T.border}`, background:'rgba(37,99,235,0.06)', color:T.text, fontSize:12, cursor:'pointer', opacity:dis?0.3:1, fontFamily:'inherit' }}>{lbl}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterFixed />
    </div>
  );
}
