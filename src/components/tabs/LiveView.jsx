import { useState, useEffect, useRef } from 'react';
import { MapPin, Zap, Gauge, Settings, AlertTriangle, Activity } from 'lucide-react';

/* ── SoC circular arc gauge ── */
function SocGauge({ soc }) {
  const pct    = soc != null ? Math.min(Math.max(parseFloat(soc), 0), 100) : null;
  const color  = pct == null ? '#1e3a8a' : pct > 60 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444';
  const glow   = pct == null ? 'none' : pct > 60 ? '0 0 20px rgba(34,197,94,0.5)' : pct > 25 ? '0 0 20px rgba(234,179,8,0.5)' : '0 0 20px rgba(239,68,68,0.5)';

  const size  = 120;
  const sw    = 9;
  const r     = (size - sw * 2) / 2;
  const circ  = 2 * Math.PI * r;
  const arc   = circ * 0.78;
  const fill  = pct != null ? arc * (pct / 100) : 0;
  const gap   = circ - arc;

  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform:'rotate(126deg)' }}>
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke="rgba(37,99,235,0.1)" strokeWidth={sw}
          strokeDasharray={`${arc} ${gap}`} strokeLinecap="round" />
        {/* Fill */}
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={sw}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)', filter: pct != null ? `drop-shadow(0 0 6px ${color}aa)` : 'none' }} />
      </svg>
      {/* Center label */}
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1 }}>
        {pct != null ? (
          <>
            <span style={{ fontSize:26, fontWeight:800, color, lineHeight:1, letterSpacing:'-0.04em', textShadow:glow }}>{pct.toFixed(0)}</span>
            <span style={{ fontSize:11, fontWeight:600, color:'rgba(56,189,248,0.35)', letterSpacing:'0.08em' }}>%</span>
          </>
        ) : (
          <span style={{ fontSize:16, color:'rgba(56,189,248,0.2)' }}>—</span>
        )}
      </div>
    </div>
  );
}

/* ── Hero metric (big display) ── */
function HeroMetric({ label, value, unit, color = 'rgba(224,242,254,0.9)', accent }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:10, fontWeight:700, color:'rgba(56,189,248,0.28)', letterSpacing:'0.14em', textTransform:'uppercase' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
        {value != null ? (
          <>
            <span style={{ fontSize:32, fontWeight:800, color, lineHeight:1, letterSpacing:'-0.04em', textShadow: accent ? `0 0 20px ${accent}55` : 'none' }}>
              {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits:1 }) : value}
            </span>
            {unit && <span style={{ fontSize:14, fontWeight:500, color:'rgba(56,189,248,0.35)' }}>{unit}</span>}
          </>
        ) : <span style={{ fontSize:28, color:'rgba(56,189,248,0.18)' }}>—</span>}
      </div>
    </div>
  );
}

/* ── Metric card (detail grid) ── */
function MetricCard({ label, value, unit, valueColor }) {
  return (
    <div style={{
      background:'rgba(2,6,26,0.7)',
      border:'1px solid rgba(37,99,235,0.12)',
      borderRadius:12, padding:'13px 15px',
      display:'flex', flexDirection:'column', gap:5,
    }}>
      <span style={{ fontSize:10, fontWeight:600, color:'rgba(56,189,248,0.25)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</span>
      <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
        {value != null ? (
          <>
            <span style={{ fontSize:17, fontWeight:700, color: valueColor || 'rgba(224,242,254,0.88)', lineHeight:1 }}>
              {typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits:2 }) : value}
            </span>
            {unit && <span style={{ fontSize:11, color:'rgba(56,189,248,0.25)' }}>{unit}</span>}
          </>
        ) : <span style={{ fontSize:16, color:'rgba(56,189,248,0.12)' }}>—</span>}
      </div>
    </div>
  );
}

/* ── Section wrapper ── */
function Section({ icon:Icon, title, iconColor, children, columns = 'repeat(auto-fill, minmax(155px, 1fr))' }) {
  return (
    <div style={{ background:'rgba(1,4,18,0.6)', border:'1px solid rgba(37,99,235,0.11)', borderRadius:16, overflow:'hidden', marginBottom:12 }}>
      {/* Section header */}
      <div style={{ display:'flex', alignItems:'center', gap:9, padding:'13px 18px', borderBottom:'1px solid rgba(37,99,235,0.08)', background:'rgba(37,99,235,0.03)' }}>
        <div style={{ width:26, height:26, borderRadius:8, background:`${iconColor}18`, border:`1px solid ${iconColor}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon style={{ width:13, height:13, color:iconColor }} />
        </div>
        <span style={{ fontSize:11, fontWeight:700, color:iconColor, textTransform:'uppercase', letterSpacing:'0.14em' }}>{title}</span>
      </div>
      <div style={{ padding:'14px 16px', display:'grid', gridTemplateColumns:columns, gap:10 }}>
        {children}
      </div>
    </div>
  );
}

function socColor(s)  { return s == null ? 'rgba(224,242,254,0.88)' : s > 50 ? '#4ade80' : s > 20 ? '#facc15' : '#f87171'; }
function tempColor(t) { return t == null ? 'rgba(224,242,254,0.88)' : t > 80 ? '#f87171' : t > 60 ? '#fb923c' : 'rgba(224,242,254,0.88)'; }

export default function LiveView({ vehicleId }) {
  const [data, setData]             = useState(null);
  const [connected, setConnected]   = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const esRef = useRef(null);

  useEffect(() => {
    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; } })();
    const es = new EventSource(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;
    es.onopen    = () => setConnected(true);
    es.onmessage = e => { try { setData(JSON.parse(e.data)); setLastUpdate(new Date()); } catch {} };
    es.onerror   = () => setConnected(false);
    return () => { es.close(); esRef.current = null; };
  }, [vehicleId]);

  const stale  = lastUpdate && Date.now() - lastUpdate.getTime() > 15_000;
  const live   = connected && !stale;
  const b = data?.battery, m = data?.motor, g = data?.general, loc = data?.location;

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`@keyframes livePing{0%{transform:scale(1);opacity:1}70%{transform:scale(2.2);opacity:0}100%{transform:scale(1);opacity:0}}`}</style>

      {/* ── Connection status strip ── */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'9px 14px', marginBottom:16,
        background: live ? 'rgba(34,197,94,0.06)' : 'rgba(2,6,26,0.7)',
        border: `1px solid ${live ? 'rgba(34,197,94,0.2)' : 'rgba(37,99,235,0.12)'}`,
        borderRadius:11,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ position:'relative', width:10, height:10, flexShrink:0 }}>
            <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:live?'#22c55e':'#4b5563' }}/>
            {live && <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:'#22c55e', animation:'livePing 1.5s ease-out infinite' }}/>}
          </div>
          <span style={{ fontSize:12, fontWeight:600, color: live ? '#4ade80' : 'rgba(147,197,253,0.35)', letterSpacing:'0.04em' }}>
            {live ? 'Streaming live data' : stale ? 'Signal stale — last data shown' : 'Connecting to stream…'}
          </span>
        </div>
        {lastUpdate && <span style={{ fontSize:11, color:'rgba(56,189,248,0.22)' }}>Updated {lastUpdate.toLocaleTimeString('en-IN')}</span>}
      </div>

      {/* ── Fault banner ── */}
      {g?.faults && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', marginBottom:16, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:12 }}>
          <AlertTriangle style={{ width:15,height:15,color:'#fca5a5',flexShrink:0,marginTop:1 }}/>
          <div>
            <p style={{ margin:0, fontSize:12, fontWeight:700, color:'#fca5a5', letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:3 }}>Active Fault</p>
            <p style={{ margin:0, fontSize:13, color:'rgba(252,165,165,0.8)' }}>{g.faults}</p>
          </div>
        </div>
      )}

      {/* ═══ Hero panel — SoC + key metrics ═══ */}
      <div style={{
        background:'linear-gradient(135deg, rgba(2,8,30,0.9) 0%, rgba(1,5,20,0.85) 100%)',
        border:'1px solid rgba(37,99,235,0.16)',
        borderRadius:18, padding:'24px 28px', marginBottom:14,
        display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
        boxShadow:'0 8px 40px rgba(0,0,0,0.4)',
      }}>
        {/* SoC gauge */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <SocGauge soc={b?.soc} />
          <span style={{ fontSize:10, fontWeight:700, color:'rgba(56,189,248,0.3)', letterSpacing:'0.16em', textTransform:'uppercase' }}>Battery SoC</span>
        </div>

        {/* Divider */}
        <div style={{ width:1, height:80, background:'rgba(37,99,235,0.15)', flexShrink:0, alignSelf:'center' }} />

        {/* Hero metrics grid */}
        <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))', gap:'18px 28px', minWidth:240 }}>
          <HeroMetric label="Speed"      value={g?.speed}          unit="km/h" color="#fb923c" accent="#fb923c" />
          <HeroMetric label="Motor RPM"  value={m?.rpm}            unit="rpm"  color="#7dd3fc" accent="#38bdf8" />
          <HeroMetric label="Available"  value={b?.available_energy} unit="Wh" color="rgba(224,242,254,0.85)" />
          <HeroMetric label="Odometer"   value={g?.odometer != null ? Math.round(g.odometer) : null} unit="km" color="rgba(224,242,254,0.85)" />
        </div>

        {/* Live indicator top-right */}
        {live && (
          <div style={{ position:'absolute', top:16, right:20, display:'flex', alignItems:'center', gap:5, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:20, padding:'3px 10px' }}>
            <Activity style={{ width:11, height:11, color:'#4ade80' }}/>
            <span style={{ fontSize:10, fontWeight:700, color:'#4ade80', letterSpacing:'0.1em' }}>LIVE</span>
          </div>
        )}
      </div>

      {/* ═══ Detail sections ═══ */}

      {/* Battery */}
      <Section icon={Zap} title="Battery — Sun Mobility" iconColor="#4ade80">
        <MetricCard label="Batt. Current"      value={b?.current}           unit="A" />
        <MetricCard label="Max Cell Voltage"   value={b?.max_cell_voltage}  unit="V" />
        <MetricCard label="Min Cell Voltage"   value={b?.min_cell_voltage}  unit="V" />
        <MetricCard label="Max Cell Temp"      value={b?.max_cell_temp}     unit="°C" valueColor={tempColor(b?.max_cell_temp)} />
        <MetricCard label="Min Cell Temp"      value={b?.min_cell_temp}     unit="°C" />
        <MetricCard label="Drive Curr. Limit"  value={b?.drive_current_limit} unit="A" />
        <MetricCard label="Regen Curr. Limit"  value={b?.regen_current_limit} unit="A" />
      </Section>

      {/* Motor */}
      <Section icon={Settings} title="Motor Controller" iconColor="#38bdf8">
        <MetricCard label="Controller Temp"   value={m?.controller_temp}   unit="°C" valueColor={tempColor(m?.controller_temp)} />
        <MetricCard label="Motor Temp"        value={m?.motor_temp}        unit="°C" valueColor={tempColor(m?.motor_temp)} />
        <MetricCard label="RMS Current"       value={m?.rms_current}       unit="A" />
        <MetricCard label="Capacitor Voltage" value={m?.capacitor_voltage} unit="V" />
      </Section>

      {/* General */}
      <Section icon={Gauge} title="General" iconColor="#fb923c" columns="repeat(auto-fill, minmax(130px, 1fr))">
        <MetricCard label="Throttle" value={g?.throttle} unit="%" valueColor="rgba(251,146,60,0.9)" />
        <MetricCard label="Brake"    value={g?.brake}    unit="%" valueColor="rgba(248,113,113,0.9)" />
      </Section>

      {/* Location */}
      {(loc?.latitude || loc?.longitude) && (
        <div style={{ background:'rgba(1,4,18,0.6)', border:'1px solid rgba(37,99,235,0.11)', borderRadius:16, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, padding:'13px 18px', borderBottom:'1px solid rgba(37,99,235,0.08)', background:'rgba(37,99,235,0.03)' }}>
            <div style={{ width:26, height:26, borderRadius:8, background:'rgba(167,139,250,0.14)', border:'1px solid rgba(167,139,250,0.22)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MapPin style={{ width:13, height:13, color:'#a78bfa' }} />
            </div>
            <span style={{ fontSize:11, fontWeight:700, color:'#a78bfa', textTransform:'uppercase', letterSpacing:'0.14em' }}>Location</span>
          </div>
          <div style={{ padding:'14px 18px', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div>
              <p style={{ fontSize:10, color:'rgba(56,189,248,0.25)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.1em' }}>Coordinates</p>
              <p style={{ fontFamily:'monospace', fontSize:14, color:'rgba(224,242,254,0.85)', margin:0 }}>
                {loc.latitude?.toFixed(6)}° N&nbsp;&nbsp;{loc.longitude?.toFixed(6)}° E
              </p>
            </div>
            <a href={`https://maps.google.com/?q=${loc.latitude},${loc.longitude}`} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:600, color:'#a78bfa', background:'rgba(167,139,250,0.08)', border:'1px solid rgba(167,139,250,0.2)', padding:'8px 14px', borderRadius:9, textDecoration:'none', transition:'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background='rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='rgba(167,139,250,0.08)'; e.currentTarget.style.borderColor='rgba(167,139,250,0.2)'; }}
            >
              <MapPin style={{ width:12,height:12 }}/> Open in Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
