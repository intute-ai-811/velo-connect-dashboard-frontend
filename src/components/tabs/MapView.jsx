import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import api, { apiUrl } from '../../api';
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio, History, RefreshCw, Wifi, WifiOff, MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/* ── THEME ── */
const G = {
  card:   'rgba(2,6,24,0.92)',
  border: 'rgba(37,99,235,0.18)',
  blur:   'blur(20px)',
  text:   'rgba(224,242,254,0.88)',
  sub:    'rgba(147,197,253,0.45)',
  dim:    'rgba(56,189,248,0.25)',
  btnGrad:'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)',
};

/* ── Stable Leaflet pathOptions (defined once, never recreated) ── */
const PATH_LIVE_TRAIL  = { color: '#38bdf8', weight: 3, opacity: 0.7 };
const PATH_HIST_ROUTE  = { color: '#2563eb', weight: 3, opacity: 0.85 };
const PATH_HIST_START  = { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1 };
const PATH_HIST_END    = { color: '#f97316', fillColor: '#f97316', fillOpacity: 1 };

/* ─────────────────────────────────────────────
   HOOK: live status — only re-renders when the
   boolean actually flips
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

/* ── Auto-pan the map ── */
function MapController({ center, shouldPan }) {
  const map  = useMap();
  const prev = useRef(null);
  useEffect(() => {
    if (!shouldPan || !center) return;
    const key = center.join(',');
    if (key !== prev.current) {
      map.panTo(center, { animate: true, duration: 0.6 });
      prev.current = key;
    }
  }, [center, shouldPan, map]);
  return null;
}

/* ── Live vehicle marker (Leaflet DivIcon, managed via ref) ── */
function LiveMarker({ position, speed, live }) {
  const map       = useRef(null);
  const markerRef = useRef(null);
  map.current     = useMap();

  useEffect(() => {
    if (!position) return;
    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:24px;height:24px;">
        ${live ? '<div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,0.25);animation:liveRingA 1.8s ease-out infinite;"></div>' : ''}
        ${live ? '<div style="position:absolute;inset:-3px;border-radius:50%;background:rgba(14,165,233,0.18);animation:liveRingB 1.8s ease-out 0.6s infinite;"></div>' : ''}
        <div style="position:absolute;inset:0;border-radius:50%;background:${live ? 'linear-gradient(135deg,#2563eb,#0ea5e9)' : '#64748b'};border:2.5px solid rgba(186,230,253,0.9);box-shadow:${live ? '0 0 12px rgba(37,99,235,0.7)' : 'none'};"></div>
      </div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });
    const speedLabel = speed != null ? `${parseFloat(speed).toFixed(1)} km/h` : '—';
    const popup      = `<b>${live ? 'Live Position' : 'Last Position'}</b><br/>Speed: ${speedLabel}`;
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      markerRef.current.setIcon(icon);
      markerRef.current.setPopupContent(popup);
    } else {
      markerRef.current = L.marker(position, { icon }).addTo(map.current).bindPopup(popup);
    }
    return () => {
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    };
  }, [position, speed, live]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/* ── Legend row ── */
const LegendRow = memo(function LegendRow({ color, type, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'dot'
        ? <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        : <span style={{ width: 20, height: 3, background: color, display: 'inline-block', borderRadius: 2, flexShrink: 0 }} />}
      <span style={{ fontSize: 11, color: 'rgba(147,197,253,0.45)' }}>{label}</span>
    </div>
  );
});

/* ════════════════════════════════════════════ */
export default function MapView({ vehicleId }) {
  const [mode, setMode] = useState('live');

  /* live */
  const [livePos,   setLivePos]   = useState(null);
  const [liveSpeed, setLiveSpeed] = useState(null);
  const [liveTrail, setLiveTrail] = useState([]);
  const [liveTs,    setLiveTs]    = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  /* history */
  const [points,      setPoints]      = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [from,        setFrom]        = useState('');
  const [to,          setTo]          = useState('');

  /* map */
  const [center, setCenter] = useState([20.5937, 78.9629]);
  const [mapKey, setMapKey] = useState(0);

  /* ── live SSE + polling ── */
  useEffect(() => {
    if (mode !== 'live') { esRef.current?.close(); esRef.current = null; setConnected(false); return; }
    const token = (() => { try { return JSON.parse(localStorage.getItem('user'))?.token; } catch { return ''; } })();
    let dead = false;

    const apply = d => {
      const lat = d.location?.latitude, lng = d.location?.longitude;
      const ts  = d.recorded_at ? new Date(d.recorded_at) : new Date();
      if (lat != null && lng != null) {
        /* Only update livePos if the coordinates actually changed */
        setLivePos(prev => (prev && prev[0] === lat && prev[1] === lng) ? prev : [lat, lng]);
        setLiveSpeed(d.general?.speed ?? null);
        setLiveTs(ts);
        setCenter(prev => (prev[0] === lat && prev[1] === lng) ? prev : [lat, lng]);
        setLiveTrail(prev => {
          const last = prev[prev.length - 1];
          if (last && last[0] === lat && last[1] === lng) return prev;
          const n = [...prev, [lat, lng]];
          return n.length > 200 ? n.slice(-200) : n;
        });
      }
    };

    const snap = () => api.get(`/api/vehicles/${vehicleId}/live`)
      .then(r => { if (!dead && r.data) apply(r.data); }).catch(() => {});
    snap();
    const t = setInterval(snap, 5_000);
    const es = new EventSource(apiUrl(`/api/vehicles/${vehicleId}/stream?token=${encodeURIComponent(token)}`));
    esRef.current = es;
    es.onopen    = () => setConnected(true);
    es.onerror   = () => setConnected(false);
    es.onmessage = e => { try { apply(JSON.parse(e.data)); } catch {} };
    return () => { dead = true; clearInterval(t); es.close(); esRef.current = null; };
  }, [vehicleId, mode]);

  /* ── history load ── */
  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const params = { limit: 1000 };
      if (from) params.from = from;
      if (to)   params.to   = to;
      const res = await api.get(`/api/vehicles/${vehicleId}/location`, { params });
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

  function switchMode(m) {
    setMode(m);
    setMapKey(k => k + 1);
    if (m === 'live') { setLiveTrail([]); setLivePos(null); }
  }

  /* ── live status ── */
  const live = useLiveStatus(connected, liveTs);

  /* ── stable date string ── */
  const liveTsStr = useMemo(() => {
    if (!liveTs) return null;
    return `${liveTs.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${liveTs.toLocaleTimeString('en-IN')}`;
  }, [liveTs]);

  /* ── stable history polyline ── */
  const histPoly = useMemo(
    () => points.map(p => [p.latitude, p.longitude]),
    [points]
  );

  /* ── stable coordinate string ── */
  const coordStr = useMemo(
    () => livePos ? `${livePos[0].toFixed(5)}, ${livePos[1].toFixed(5)}` : null,
    [livePos]
  );

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes liveRingA { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(2.6);opacity:0} }
        @keyframes liveRingB { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        @keyframes spin       { to{transform:rotate(360deg)} }
        .leaflet-container { background:#060b18 !important; }
        .leaflet-popup-content-wrapper { background:rgba(2,5,20,0.97)!important;border:1px solid rgba(37,99,235,0.3)!important;border-radius:10px!important;color:rgba(224,242,254,0.9)!important;box-shadow:0 8px 32px rgba(0,0,0,0.7)!important; }
        .leaflet-popup-tip { background:rgba(2,5,20,0.97)!important; }
        .leaflet-popup-content { color:rgba(224,242,254,0.85)!important;font-size:13px!important; }
        .leaflet-control-zoom a { background:rgba(2,5,20,0.92)!important;border-color:rgba(37,99,235,0.28)!important;color:rgba(147,197,253,0.8)!important; }
        .leaflet-control-zoom a:hover { background:rgba(37,99,235,0.18)!important; }
        .leaflet-control-attribution { background:rgba(1,4,8,0.7)!important;color:rgba(56,189,248,0.25)!important;font-size:10px!important; }
        .leaflet-control-attribution a { color:rgba(56,189,248,0.45)!important; }
      `}</style>

      {/* ── TOP CONTROLS ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 0, background: 'rgba(1,4,16,0.85)', border: `1px solid ${G.border}`, borderRadius: 14, padding: 4 }}>
          {[
            { id: 'live',    label: 'Live Tracking', icon: Radio   },
            { id: 'history', label: 'Route History',  icon: History },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => switchMode(id)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: mode === id ? G.btnGrad : 'transparent', color: mode === id ? 'white' : G.sub, boxShadow: mode === id ? '0 4px 16px rgba(37,99,235,0.4)' : 'none', transition: 'all 0.2s', letterSpacing: '0.02em' }}>
              <Icon style={{ width: 13, height: 13 }} />{label}
            </button>
          ))}
        </div>

        {/* Live status pill */}
        {mode === 'live' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: live ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${live ? 'rgba(34,197,94,0.2)' : G.border}`, borderRadius: 12, flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {live
                ? <Wifi    style={{ width: 13, height: 13, color: '#22c55e', flexShrink: 0 }} />
                : <WifiOff style={{ width: 13, height: 13, color: '#6b7280', flexShrink: 0 }} />}
              <span style={{ fontSize: 12, fontWeight: 600, color: live ? '#4ade80' : G.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {live ? 'Streaming live location' : liveTs ? 'Offline — last known position shown' : connected ? 'Waiting for location data…' : 'Connecting to live feed…'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              {liveSpeed != null && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#7dd3fc' }}>{parseFloat(liveSpeed).toFixed(1)}</span>
                  <span style={{ fontSize: 10, color: G.sub }}>km/h</span>
                </div>
              )}
              {liveTsStr && <span style={{ fontSize: 10, color: 'rgba(148,163,184,0.3)' }}>{liveTsStr}</span>}
            </div>
          </div>
        )}
      </div>

      {/* History controls */}
      {mode === 'history' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 14, background: G.card, border: `1px solid ${G.border}`, borderRadius: 16, padding: '14px 18px', backdropFilter: G.blur, WebkitBackdropFilter: G.blur }}>
          {[['From', from, setFrom], ['To', to, setTo]].map(([lbl, val, set]) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(148,163,184,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{lbl}</span>
              <input type="datetime-local" value={val} onChange={e => set(e.target.value)}
                style={{ padding: '9px 13px', borderRadius: 10, border: `1px solid ${G.border}`, background: 'rgba(37,99,235,0.06)', color: G.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark', minWidth: 210 }}
                onFocus={e => (e.target.style.borderColor = 'rgba(14,165,233,0.4)')}
                onBlur={e  => (e.target.style.borderColor = G.border)}
              />
            </div>
          ))}
          <button onClick={loadHistory} disabled={histLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 10, border: 'none', background: G.btnGrad, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: histLoading ? 0.6 : 1, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(37,99,235,0.35)', letterSpacing: '0.04em' }}>
            <RefreshCw style={{ width: 13, height: 13, animation: histLoading ? 'spin 0.6s linear infinite' : 'none' }} />
            Apply
          </button>
          {points.length > 0 && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 13px', background: 'rgba(37,99,235,0.08)', border: `1px solid ${G.border}`, borderRadius: 20 }}>
              <Navigation style={{ width: 10, height: 10, color: G.sub }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: G.sub }}>{points.length} points</span>
            </div>
          )}
        </div>
      )}

      {/* ── MAP ── */}
      <div style={{ borderRadius: 18, overflow: 'hidden', border: `1px solid ${G.border}`, height: 560, position: 'relative', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>

        {mode === 'live' && !livePos && !liveTrail.length ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,16,0.95)', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: G.sub, fontSize: 13, margin: 0 }}>Waiting for live location data…</p>
          </div>
        ) : mode === 'history' && histLoading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,16,0.95)', flexDirection: 'column', gap: 14 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid rgba(37,99,235,0.2)', borderTopColor: '#2563eb', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ color: G.sub, fontSize: 13, margin: 0 }}>Loading route…</p>
          </div>
        ) : mode === 'history' && points.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(1,4,16,0.95)', flexDirection: 'column', gap: 12 }}>
            <MapPin style={{ width: 32, height: 32, color: 'rgba(56,189,248,0.2)' }} />
            <p style={{ color: G.sub, fontSize: 13, margin: 0 }}>No location data for this period.</p>
          </div>
        ) : (
          <MapContainer key={mapKey} center={center} zoom={14} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {mode === 'live' && (
              <>
                <MapController center={livePos} shouldPan={!!livePos} />
                {liveTrail.length > 1 && <Polyline positions={liveTrail} pathOptions={PATH_LIVE_TRAIL} />}
                {livePos && <LiveMarker position={livePos} speed={liveSpeed} live={live} />}
              </>
            )}

            {mode === 'history' && histPoly.length > 0 && (() => {
              const first = points[0];
              const last  = points[points.length - 1];
              return (
                <>
                  {histPoly.length > 1 && <Polyline positions={histPoly} pathOptions={PATH_HIST_ROUTE} />}
                  {first && (
                    <CircleMarker center={[first.latitude, first.longitude]} radius={7} pathOptions={PATH_HIST_START}>
                      <Popup><strong>Start</strong><br />{new Date(first.recorded_at).toLocaleString('en-IN')}</Popup>
                    </CircleMarker>
                  )}
                  {last && last !== first && (
                    <CircleMarker center={[last.latitude, last.longitude]} radius={9} pathOptions={PATH_HIST_END}>
                      <Popup><strong>End</strong><br />{new Date(last.recorded_at).toLocaleString('en-IN')}<br />Speed: {last.speed != null ? `${parseFloat(last.speed).toFixed(1)} km/h` : '—'}</Popup>
                    </CircleMarker>
                  )}
                </>
              );
            })()}
          </MapContainer>
        )}

        {/* Legend overlay (bottom-left) */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 999, background: 'rgba(2,5,20,0.88)', border: `1px solid ${G.border}`, borderRadius: 12, padding: '10px 14px', backdropFilter: G.blur, WebkitBackdropFilter: G.blur, display: 'flex', flexDirection: 'column', gap: 7, pointerEvents: 'none' }}>
          {mode === 'live' ? (
            <>
              <LegendRow color="#2563eb" type="dot"  label="Live position" />
              <LegendRow color="#38bdf8" type="line" label="Trail" />
            </>
          ) : points.length > 0 ? (
            <>
              <LegendRow color="#22c55e" type="dot"  label="Start" />
              <LegendRow color="#f97316" type="dot"  label="End"   />
              <LegendRow color="#2563eb" type="line" label="Route" />
            </>
          ) : null}
        </div>

        {/* Coordinate overlay (bottom-right) */}
        {mode === 'live' && coordStr && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 999, background: 'rgba(2,5,20,0.88)', border: `1px solid ${G.border}`, borderRadius: 12, padding: '10px 14px', backdropFilter: G.blur, WebkitBackdropFilter: G.blur, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin style={{ width: 9, height: 9, color: '#38bdf8' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(148,163,184,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Position</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(147,197,253,0.7)', fontVariantNumeric: 'tabular-nums' }}>{coordStr}</span>
          </div>
        )}
      </div>
    </div>
  );
}
