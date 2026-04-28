import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio, History, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const T = {
  cardBg:  'rgba(2,8,28,0.9)',
  border:  'rgba(37,99,235,0.18)',
  text:    'rgba(224,242,254,0.88)',
  textSub: 'rgba(147,197,253,0.45)',
  muted:   'rgba(56,189,248,0.25)',
  btnGrad: 'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
};

/* ── Auto-pan map to a position ── */
function MapController({ center, shouldPan }) {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!shouldPan || !center) return;
    const key = center.join(',');
    if (key !== prev.current) { map.panTo(center, { animate: true, duration: 0.6 }); prev.current = key; }
  }, [center, shouldPan, map]);
  return null;
}

/* ── Pulsing live marker (DivIcon) ── */
function LiveMarker({ position, speed }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!position) return;

    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:24px;height:24px;">
          <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,0.25);animation:liveRingA 1.8s ease-out infinite;"></div>
          <div style="position:absolute;inset:-3px;border-radius:50%;background:rgba(14,165,233,0.18);animation:liveRingB 1.8s ease-out 0.6s infinite;"></div>
          <div style="position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#2563eb,#0ea5e9);border:2.5px solid rgba(186,230,253,0.9);box-shadow:0 0 12px rgba(37,99,235,0.7);"></div>
        </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      markerRef.current.setIcon(icon);
    } else {
      markerRef.current = L.marker(position, { icon })
        .addTo(map)
        .bindPopup(`<b>Live Position</b><br/>Speed: ${speed != null ? `${parseFloat(speed).toFixed(1)} km/h` : '—'}`);
    }

    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    };
  }, [position, speed, map]);

  return null;
}

/* ════════════════════════════════ */
export default function MapView({ vehicleId }) {
  const [mode, setMode] = useState('live'); // 'live' | 'history'

  /* ── Live tracking state ── */
  const [livePos,   setLivePos]   = useState(null);   // [lat, lng]
  const [liveSpeed, setLiveSpeed] = useState(null);
  const [liveTrail, setLiveTrail] = useState([]);      // [[lat,lng], ...]
  const [liveTs,    setLiveTs]    = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  /* ── History state ── */
  const [points,  setPoints]  = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to,   setTo]   = useState('');

  /* ── Shared map center ── */
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [mapKey, setMapKey] = useState(0); // force remount when switching modes

  /* ── Live SSE connection ── */
  useEffect(() => {
    if (mode !== 'live') { esRef.current?.close(); esRef.current = null; setConnected(false); return; }

    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; } })();
    const es = new EventSource(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onopen    = () => setConnected(true);
    es.onerror   = () => setConnected(false);
    es.onmessage = e => {
      try {
        const d = JSON.parse(e.data);
        const lat = d.location?.latitude, lng = d.location?.longitude;
        if (lat && lng) {
          const pos = [lat, lng];
          setLivePos(pos);
          setLiveSpeed(d.general?.speed ?? null);
          setLiveTs(new Date());
          setCenter(pos);
          setLiveTrail(prev => {
            const next = [...prev, pos];
            return next.length > 200 ? next.slice(-200) : next;
          });
        }
      } catch {}
    };

    return () => { es.close(); esRef.current = null; };
  }, [vehicleId, mode]);

  /* ── History load ── */
  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const params = { limit:1000 };
      if (from) params.from = from;
      if (to)   params.to   = to;
      const res = await axios.get(`/api/vehicles/${vehicleId}/location`, { params });
      setPoints(res.data);
      if (res.data.length > 0) {
        const last = res.data[res.data.length - 1];
        setCenter([last.latitude, last.longitude]);
        setMapKey(k => k + 1);
      }
    } catch { setPoints([]); }
    finally { setHistLoading(false); }
  }, [vehicleId, from, to]);

  useEffect(() => { if (mode === 'history') loadHistory(); }, [mode]); // eslint-disable-line

  /* ── Switch mode ── */
  function switchMode(m) {
    setMode(m);
    setMapKey(k => k + 1);
    if (m === 'live') { setLiveTrail([]); setLivePos(null); }
  }

  const stale = liveTs && Date.now() - liveTs.getTime() > 20_000;

  return (
    <div style={{ fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif' }}>
      <style>{`
        @keyframes liveRingA { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.6);opacity:0} }
        @keyframes liveRingB { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        .leaflet-container { background:#06080f !important; }
        .leaflet-popup-content-wrapper { background:rgba(2,5,20,0.97) !important; border:1px solid rgba(37,99,235,0.3) !important; border-radius:10px !important; color:rgba(224,242,254,0.9) !important; box-shadow:0 8px 32px rgba(0,0,0,0.7) !important; }
        .leaflet-popup-tip { background:rgba(2,5,20,0.97) !important; }
        .leaflet-popup-content { color:rgba(224,242,254,0.85) !important; font-size:13px !important; }
        .leaflet-control-zoom a { background:rgba(2,5,20,0.9) !important; border-color:rgba(37,99,235,0.3) !important; color:rgba(147,197,253,0.8) !important; }
        .leaflet-control-zoom a:hover { background:rgba(37,99,235,0.2) !important; }
        .leaflet-control-attribution { background:rgba(1,4,8,0.75) !important; color:rgba(56,189,248,0.3) !important; font-size:10px !important; }
        .leaflet-control-attribution a { color:rgba(56,189,248,0.5) !important; }
      `}</style>

      {/* Mode toggle */}
      <div style={{ display:'flex', alignItems:'center', gap:0, background:'rgba(1,4,16,0.8)', border:`1px solid ${T.border}`, borderRadius:12, padding:4, marginBottom:16, width:'fit-content' }}>
        {[
          { id:'live',    label:'Live Tracking', icon:Radio   },
          { id:'history', label:'History',        icon:History },
        ].map(({ id, label, icon:Icon }) => (
          <button key={id} onClick={() => switchMode(id)} style={{
            display:'flex', alignItems:'center', gap:7, padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer', fontFamily:'inherit',
            fontSize:13, fontWeight:600,
            background: mode===id ? T.btnGrad : 'transparent',
            color: mode===id ? 'white' : T.textSub,
            transition:'all 0.2s',
            boxShadow: mode===id ? '0 4px 16px rgba(37,99,235,0.35)' : 'none',
          }}>
            <Icon style={{ width:14,height:14 }}/>{label}
          </button>
        ))}
      </div>

      {/* Live status bar */}
      {mode === 'live' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:11, padding:'10px 16px', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {connected && !stale
              ? <Wifi style={{ width:14,height:14,color:'#22c55e' }}/>
              : <WifiOff style={{ width:14,height:14,color:'#6b7280' }}/>}
            <span style={{ fontSize:13, color:T.textSub, fontWeight:500 }}>
              {connected && !stale ? 'Streaming live location' : stale ? 'Signal lost — last known position shown' : 'Connecting to live feed…'}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {liveSpeed != null && <span style={{ fontSize:12, color:'#7dd3fc', fontWeight:600 }}>{parseFloat(liveSpeed).toFixed(1)} km/h</span>}
            {liveTs && <span style={{ fontSize:11, color:T.muted }}>{liveTs.toLocaleTimeString('en-IN')}</span>}
          </div>
        </div>
      )}

      {/* History controls */}
      {mode === 'history' && (
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-end', gap:12, background:T.cardBg, border:`1px solid ${T.border}`, borderRadius:12, padding:'14px 16px', marginBottom:12 }}>
          {[['From', from, setFrom], ['To', to, setTo]].map(([lbl, val, set]) => (
            <div key={lbl}>
              <p style={{ fontSize:10, fontWeight:700, color:T.muted, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{lbl}</p>
              <input type="datetime-local" value={val} onChange={e => set(e.target.value)}
                style={{ padding:'8px 12px', borderRadius:9, border:`1px solid ${T.border}`, background:'rgba(37,99,235,0.07)', color:T.text, fontSize:13, outline:'none', fontFamily:'inherit', colorScheme:'dark' }}
                onFocus={e=>(e.target.style.borderColor='rgba(14,165,233,0.45)')}
                onBlur={e=>(e.target.style.borderColor=T.border)}
              />
            </div>
          ))}
          <button onClick={loadHistory} disabled={histLoading}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:10, border:'none', background:T.btnGrad, color:'white', fontSize:13, fontWeight:600, cursor:'pointer', opacity:histLoading?0.6:1, fontFamily:'inherit' }}>
            <RefreshCw style={{ width:14,height:14,animation:histLoading?'spin 0.7s linear infinite':'none' }}/> Apply
          </button>
          {points.length > 0 && <span style={{ fontSize:12, color:T.muted, marginLeft:'auto' }}>{points.length} location points</span>}
        </div>
      )}

      {/* Map */}
      <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${T.border}`, height:500 }}>
        {mode === 'live' && !livePos && !liveTrail.length ? (
          <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(1,4,16,0.9)', gap:12 }}>
            <div style={{ width:32,height:32,borderRadius:'50%',border:'2px solid rgba(37,99,235,0.25)',borderTopColor:'#2563eb',animation:'spin 0.7s linear infinite' }}/>
            <p style={{ color:T.textSub, fontSize:13 }}>Waiting for live location data…</p>
          </div>
        ) : mode === 'history' && histLoading ? (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(1,4,16,0.9)', flexDirection:'column', gap:12 }}>
            <div style={{ width:28,height:28,borderRadius:'50%',border:'2px solid rgba(37,99,235,0.25)',borderTopColor:'#2563eb',animation:'spin 0.7s linear infinite' }}/>
            <p style={{ color:T.textSub, fontSize:13 }}>Loading route…</p>
          </div>
        ) : mode === 'history' && points.length === 0 ? (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(1,4,16,0.9)', flexDirection:'column', gap:8 }}>
            <p style={{ color:T.muted, fontSize:13 }}>No location data for this period.</p>
          </div>
        ) : (
          <MapContainer key={mapKey} center={center} zoom={14} style={{ height:'100%', width:'100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* ── LIVE MODE ── */}
            {mode === 'live' && (
              <>
                <MapController center={livePos} shouldPan={!!livePos} />
                {liveTrail.length > 1 && (
                  <Polyline positions={liveTrail} pathOptions={{ color:'#38bdf8', weight:3, opacity:0.7, dashArray:null }} />
                )}
                {livePos && <LiveMarker position={livePos} speed={liveSpeed} />}
              </>
            )}

            {/* ── HISTORY MODE ── */}
            {mode === 'history' && (() => {
              const poly = points.map(p => [p.latitude, p.longitude]);
              const first = points[0], latest = points[points.length - 1];
              return (
                <>
                  {poly.length > 1 && <Polyline positions={poly} pathOptions={{ color:'#2563eb', weight:3, opacity:0.8 }} />}
                  {first && (
                    <CircleMarker center={[first.latitude, first.longitude]} radius={7} pathOptions={{ color:'#22c55e', fillColor:'#22c55e', fillOpacity:1 }}>
                      <Popup><strong>Start</strong><br/>{new Date(first.recorded_at).toLocaleString('en-IN')}</Popup>
                    </CircleMarker>
                  )}
                  {latest && latest !== first && (
                    <CircleMarker center={[latest.latitude, latest.longitude]} radius={9} pathOptions={{ color:'#f97316', fillColor:'#f97316', fillOpacity:1 }}>
                      <Popup><strong>End</strong><br/>{new Date(latest.recorded_at).toLocaleString('en-IN')}<br/>Speed: {latest.speed != null ? `${parseFloat(latest.speed).toFixed(1)} km/h` : '—'}</Popup>
                    </CircleMarker>
                  )}
                </>
              );
            })()}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:12, flexWrap:'wrap' }}>
        {mode === 'live' ? (
          <>
            <LegendItem color="#2563eb" type="dot" label="Live position" />
            <LegendItem color="#38bdf8" type="line" label="Trail" />
          </>
        ) : points.length > 0 && (
          <>
            <LegendItem color="#22c55e" type="dot" label="Start" />
            <LegendItem color="#f97316" type="dot" label="End" />
            <LegendItem color="#2563eb" type="line" label="Route" />
          </>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function LegendItem({ color, type, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
      {type === 'dot'
        ? <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }}/>
        : <span style={{ width:22, height:3, background:color, display:'inline-block', borderRadius:2 }}/>}
      <span style={{ fontSize:12, color:'rgba(147,197,253,0.4)' }}>{label}</span>
    </div>
  );
}
