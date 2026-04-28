import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, AlertCircle, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import veloLogo from '../assets/VeloConnectwb.png';
import intuteLogo from '../assets/Intute.png';

/* ─── Google Font: DM Serif Display ─── */
if (!document.getElementById('dm-serif-font')) {
  const fl = document.createElement('link');
  fl.id = 'dm-serif-font'; fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap';
  document.head.appendChild(fl);
}

/* ─── Sedan silhouette — side profile, faces right ─── */
function SedanSilhouette() {
  return (
    <svg viewBox="0 0 300 90" width="300" height="90" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sedanBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.18)"/>
          <stop offset="100%" stopColor="rgba(14,165,233,0.04)"/>
        </linearGradient>
        <filter id="hlight"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      {/* ground shadow */}
      <ellipse cx="150" cy="84" rx="130" ry="5" fill="rgba(14,165,233,0.06)"/>
      {/* lower body */}
      <path d="M20 64 L20 52 Q20 46 26 46 L274 46 Q282 46 282 54 L282 64 Z"
        fill="url(#sedanBody)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.8"/>
      {/* cabin */}
      <path d="M72 46 Q84 20 108 16 L186 16 Q210 16 224 30 L248 46 Z"
        fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.18)" strokeWidth="0.8"/>
      {/* windshield */}
      <path d="M108 16 L96 46 L164 46 L172 16 Z" fill="rgba(147,197,253,0.06)" stroke="rgba(147,197,253,0.14)" strokeWidth="0.6"/>
      {/* rear glass */}
      <path d="M176 16 L214 30 L236 46 L180 46 Z" fill="rgba(147,197,253,0.05)" stroke="rgba(147,197,253,0.12)" strokeWidth="0.6"/>
      {/* door seam */}
      <line x1="164" y1="16" x2="160" y2="46" stroke="rgba(56,189,248,0.1)" strokeWidth="0.7"/>
      {/* front fascia */}
      <path d="M274 48 Q286 48 288 56 L288 62 Q286 64 278 64 L274 64 Z"
        fill="rgba(56,189,248,0.07)" stroke="rgba(56,189,248,0.18)" strokeWidth="0.6"/>
      {/* rear fascia */}
      <path d="M20 48 Q10 48 10 56 L10 62 Q12 64 20 64 Z"
        fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.12)" strokeWidth="0.6"/>
      {/* headlight */}
      <rect x="276" y="50" width="9" height="6" rx="2" fill="rgba(186,230,253,0.85)"/>
      <ellipse cx="292" cy="53" rx="7" ry="3.5" fill="rgba(186,230,253,0.15)" filter="url(#hlight)"/>
      {/* taillight */}
      <rect x="15" y="50" width="7" height="6" rx="2" fill="rgba(239,68,68,0.5)"/>
      {/* wheels */}
      <circle cx="80" cy="68" r="16" fill="rgba(2,8,20,0.95)" stroke="rgba(56,189,248,0.28)" strokeWidth="1.2"/>
      <circle cx="80" cy="68" r="9" fill="none" stroke="rgba(56,189,248,0.13)" strokeWidth="1"/>
      <circle cx="80" cy="68" r="3" fill="rgba(56,189,248,0.2)"/>
      <circle cx="224" cy="68" r="16" fill="rgba(2,8,20,0.95)" stroke="rgba(56,189,248,0.28)" strokeWidth="1.2"/>
      <circle cx="224" cy="68" r="9" fill="none" stroke="rgba(56,189,248,0.13)" strokeWidth="1"/>
      <circle cx="224" cy="68" r="3" fill="rgba(56,189,248,0.2)"/>
      {/* wheel arches */}
      <path d="M50 62 Q80 48 110 62" fill="none" stroke="rgba(56,189,248,0.09)" strokeWidth="0.8"/>
      <path d="M194 62 Q224 48 254 62" fill="none" stroke="rgba(56,189,248,0.09)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ─── SUV silhouette — side profile, faces left (mirrored for right panel) ─── */
function SuvSilhouette() {
  return (
    <svg viewBox="0 0 320 96" width="320" height="96"
      style={{ display: 'block', overflow: 'visible', transform: 'scaleX(-1)' }}>
      <defs>
        <linearGradient id="suvBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.16)"/>
          <stop offset="100%" stopColor="rgba(14,165,233,0.04)"/>
        </linearGradient>
        <filter id="suvlight"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      {/* ground shadow */}
      <ellipse cx="160" cy="90" rx="140" ry="5" fill="rgba(14,165,233,0.05)"/>
      {/* lower body */}
      <path d="M18 68 L18 54 Q18 48 24 48 L296 48 Q304 48 304 56 L304 68 Z"
        fill="url(#suvBody)" stroke="rgba(56,189,248,0.18)" strokeWidth="0.8"/>
      {/* boxy cabin */}
      <path d="M58 48 Q64 14 88 12 L232 12 Q254 12 268 26 L292 48 Z"
        fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.17)" strokeWidth="0.8"/>
      {/* windshield */}
      <path d="M88 12 L74 48 L148 48 L156 12 Z" fill="rgba(147,197,253,0.06)" stroke="rgba(147,197,253,0.14)" strokeWidth="0.6"/>
      {/* rear glass */}
      <path d="M232 12 L256 26 L282 48 L228 48 Z" fill="rgba(147,197,248,0.05)" stroke="rgba(147,197,253,0.11)" strokeWidth="0.6"/>
      {/* door seams */}
      <line x1="156" y1="12" x2="152" y2="48" stroke="rgba(56,189,248,0.1)" strokeWidth="0.7"/>
      <line x1="196" y1="12" x2="194" y2="48" stroke="rgba(56,189,248,0.08)" strokeWidth="0.7"/>
      {/* roof rack */}
      <line x1="90" y1="12" x2="232" y2="12" stroke="rgba(56,189,248,0.11)" strokeWidth="0.8"/>
      {/* headlight */}
      <rect x="296" y="52" width="9" height="7" rx="2" fill="rgba(186,230,253,0.82)"/>
      <ellipse cx="312" cy="55" rx="7" ry="3.5" fill="rgba(186,230,253,0.14)" filter="url(#suvlight)"/>
      {/* taillight */}
      <rect x="15" y="52" width="7" height="7" rx="2" fill="rgba(239,68,68,0.48)"/>
      {/* wheels */}
      <circle cx="88" cy="74" r="18" fill="rgba(2,8,20,0.95)" stroke="rgba(56,189,248,0.26)" strokeWidth="1.2"/>
      <circle cx="88" cy="74" r="10" fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="1"/>
      <circle cx="88" cy="74" r="3.5" fill="rgba(56,189,248,0.18)"/>
      <circle cx="240" cy="74" r="18" fill="rgba(2,8,20,0.95)" stroke="rgba(56,189,248,0.26)" strokeWidth="1.2"/>
      <circle cx="240" cy="74" r="10" fill="none" stroke="rgba(56,189,248,0.12)" strokeWidth="1"/>
      <circle cx="240" cy="74" r="3.5" fill="rgba(56,189,248,0.18)"/>
      {/* arches */}
      <path d="M58 66 Q88 50 118 66" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="0.8"/>
      <path d="M210 66 Q240 50 270 66" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="0.8"/>
    </svg>
  );
}

/* ─── Side panel: one slow-drifting car silhouette ─── */
function SideCarPanel({ side }) {
  const isLeft = side === 'left';
  const Car = isLeft ? SedanSilhouette : SuvSilhouette;
  const animName = isLeft ? 'driftLeft' : 'driftRight';

  return (
    <div style={{
      position: 'absolute',
      [side]: 0,
      top: 0, bottom: 0,
      width: '340px',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 5,
      maskImage: `linear-gradient(to ${isLeft ? 'right' : 'left'}, transparent 0%, black 22%, black 78%, transparent 100%)`,
      WebkitMaskImage: `linear-gradient(to ${isLeft ? 'right' : 'left'}, transparent 0%, black 22%, black 78%, transparent 100%)`,
    }}>
      <style>{`
        @keyframes ${animName} {
          0%   { transform: translateX(${isLeft ? '115%' : '-115%'}); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.9; }
          100% { transform: translateX(${isLeft ? '-115%' : '115%'}); opacity: 0; }
        }
      `}</style>

      {/* Thin ground line */}
      <div style={{
        position: 'absolute',
        bottom: '30%',
        left: 0, right: 0,
        height: '1px',
        background: `linear-gradient(to ${isLeft ? 'right' : 'left'}, transparent, rgba(56,189,248,0.12) 35%, rgba(56,189,248,0.12) 65%, transparent)`,
      }}/>

      {/* Car */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(30% - 6px)',
        left: 0, right: 0,
        display: 'flex',
        justifyContent: 'center',
        animation: `${animName} 28s cubic-bezier(0.25, 0.1, 0.25, 1) ${isLeft ? '0s' : '-14s'} infinite`,
        opacity: 0,
      }}>
        <Car />
      </div>
    </div>
  );
}

/* ─── Floating animated squares ─── */
const SQUARES = [
  { size: 54, x: 8,  y: 12, dur: 18, delay: 0,   rot: 25,  opacity: 0.07 },
  { size: 32, x: 78, y: 8,  dur: 22, delay: -4,  rot: -15, opacity: 0.05 },
  { size: 72, x: 85, y: 60, dur: 26, delay: -8,  rot: 40,  opacity: 0.04 },
  { size: 20, x: 15, y: 70, dur: 16, delay: -2,  rot: -30, opacity: 0.08 },
  { size: 44, x: 50, y: 82, dur: 20, delay: -6,  rot: 55,  opacity: 0.05 },
  { size: 28, x: 62, y: 22, dur: 24, delay: -10, rot: -45, opacity: 0.06 },
  { size: 16, x: 30, y: 45, dur: 14, delay: -3,  rot: 20,  opacity: 0.09 },
  { size: 60, x: 3,  y: 40, dur: 30, delay: -12, rot: -10, opacity: 0.04 },
  { size: 36, x: 90, y: 30, dur: 19, delay: -7,  rot: 65,  opacity: 0.05 },
  { size: 22, x: 45, y: 5,  dur: 17, delay: -1,  rot: -55, opacity: 0.07 },
  { size: 48, x: 70, y: 88, dur: 23, delay: -9,  rot: 30,  opacity: 0.04 },
  { size: 14, x: 20, y: 90, dur: 15, delay: -5,  rot: -70, opacity: 0.08 },
];

function FloatingSquares() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {SQUARES.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          border: `1.5px solid rgba(56,189,248,${s.opacity * 2.5})`,
          background: `rgba(14,165,233,${s.opacity * 0.4})`,
          borderRadius: '4px',
          transform: `rotate(${s.rot}deg)`,
          animation: `squareFloat ${s.dur}s ease-in-out ${s.delay}s infinite alternate`,
        }}/>
      ))}
    </div>
  );
}

/* ─── Floating label input ─── */
function FloatingInput({ type, value, onChange, label, id, showToggle, onToggle, showPassword, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value.length > 0;

  return (
    <div style={{ position: 'relative', marginBottom: '18px' }}>
      <div style={{
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        width: '6px', height: '6px', borderRadius: '50%',
        background: active ? '#0ea5e9' : 'rgba(56,189,248,0.25)',
        transition: 'background 0.25s ease',
        pointerEvents: 'none', zIndex: 2,
        boxShadow: active ? '0 0 8px rgba(14,165,233,0.6)' : 'none',
      }}/>
      <label htmlFor={id} style={{
        position: 'absolute', left: '36px',
        top: active ? '8px' : '50%',
        transform: active ? 'translateY(0)' : 'translateY(-50%)',
        fontSize: active ? '10px' : '13px',
        fontWeight: active ? 600 : 400,
        color: active ? '#38bdf8' : 'rgba(147,197,253,0.35)',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        pointerEvents: 'none',
        letterSpacing: active ? '0.09em' : '0',
        textTransform: active ? 'uppercase' : 'none',
        zIndex: 2,
      }}>{label}</label>
      <input
        id={id}
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        autoComplete={id === 'email' ? 'username' : 'current-password'}
        style={{
          width: '100%',
          paddingLeft: '36px',
          paddingRight: showToggle ? '48px' : '16px',
          paddingTop: active ? '22px' : '16px',
          paddingBottom: active ? '8px' : '16px',
          height: '56px',
          border: `1px solid ${focused ? 'rgba(14,165,233,0.5)' : 'rgba(37,99,235,0.18)'}`,
          borderRadius: '12px',
          background: focused ? 'rgba(14,165,233,0.08)' : 'rgba(37,99,235,0.06)',
          boxShadow: focused ? '0 0 0 3px rgba(14,165,233,0.12)' : 'none',
          outline: 'none', fontSize: '14px',
          color: 'rgba(224,242,254,0.9)',
          transition: 'all 0.25s ease',
          boxSizing: 'border-box', fontFamily: 'inherit',
        }}
      />
      {value.length > 0 && !showToggle && (
        <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#34d399', fontSize: '13px' }}>✓</div>
      )}
      {showToggle && (
        <button type="button" onClick={onToggle} style={{
          position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(147,197,253,0.3)', padding: '6px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', transition: 'color 0.2s',
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(125,211,252,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(147,197,253,0.3)')}
        >
          {showPassword ? <EyeOff style={{ width: 15, height: 15 }}/> : <Eye style={{ width: 15, height: 15 }}/>}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   Main LoginModal — Stealth Blue Theme
═══════════════════════════════════════ */
export default function LoginModal({ onLogin }) {
  const [view,     setView]     = useState('landing');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  }

  function handleKeyDown(e) { if (e.key === 'Enter' && !loading) handleLogin(); }
  function clearAll() { setEmail(''); setPassword(''); setError(''); }
  function goBack() { setView('landing'); clearAll(); }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .lm-root {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: fixed; inset: 0; z-index: 40;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          background: linear-gradient(145deg, #010408 0%, #030b18 55%, #010306 100%);
        }
        .orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .orb1 { width:520px; height:520px; top:-150px; right:-100px; background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 65%); }
        .orb2 { width:420px; height:420px; bottom:-120px; left:-80px; background: radial-gradient(circle, rgba(14,165,233,0.16) 0%, transparent 65%); }
        .orb3 { width:280px; height:280px; top:38%; left:44%; transform:translate(-50%,-50%); background: radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 70%); }
        .orb4 { width:200px; height:200px; top:12%; left:6%; background: radial-gradient(circle, rgba(148,163,184,0.06) 0%, transparent 70%); }
        .dot-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image: radial-gradient(circle, rgba(56,189,248,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        @keyframes squareFloat {
          0%   { transform: rotate(var(--r,0deg)) translateY(0px) scale(1); }
          33%  { transform: rotate(calc(var(--r,0deg) + 8deg)) translateY(-16px) scale(1.04); }
          66%  { transform: rotate(calc(var(--r,0deg) - 5deg)) translateY(-7px) scale(0.97); }
          100% { transform: rotate(calc(var(--r,0deg) + 12deg)) translateY(-24px) scale(1.02); }
        }
        @keyframes landingIn { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        .landing-enter { animation: landingIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes logoFloat {
          from { filter: drop-shadow(0 0 18px rgba(37,99,235,0.4)); transform: translateY(0px); }
          to   { filter: drop-shadow(0 0 36px rgba(14,165,233,0.65)); transform: translateY(-10px); }
        }
        .logo-float { animation: logoFloat 4s ease-in-out infinite alternate; }
        @keyframes shimmerMove {
          0%   { background-position: -200% center; opacity: 0.4; }
          50%  { background-position: 200% center; opacity: 1; }
          100% { background-position: -200% center; opacity: 0.4; }
        }
        .shimmer-line {
          height: 1px; width: 110px; margin: 0 auto;
          background: linear-gradient(90deg, transparent, #38bdf8, transparent);
          background-size: 200% 100%;
          animation: shimmerMove 2.5s ease-in-out infinite;
        }
        @keyframes titleShimmer { 0%,100% { background-position: 0% center; } 50% { background-position: 200% center; } }
        @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.3; transform:scale(1.1); } }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }
        .cta-btn {
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, #1e3a8a, #2563eb, #0ea5e9);
          color: white; font-weight: 600; font-size: 16px;
          padding: 18px 56px; border-radius: 16px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; gap: 10px;
          box-shadow: 0 8px 32px rgba(37,99,235,0.4), 0 2px 8px rgba(14,165,233,0.2), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1); letter-spacing: 0.01em; font-family: inherit;
        }
        .cta-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 60%); }
        .cta-btn:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 16px 48px rgba(37,99,235,0.5),0 4px 16px rgba(14,165,233,0.3); }
        .cta-btn:active { transform:translateY(0) scale(0.99); }
        .cta-arrow { transition: transform 0.3s ease; position: relative; }
        .cta-btn:hover .cta-arrow { transform: translateX(5px); }
        @keyframes ctaShimmer { to { transform: translateX(200%); } }
        .cta-btn .shimmer-overlay, .submit-btn .shimmer-overlay {
          position:absolute; inset:0;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.09) 50%,transparent 60%);
          transform:translateX(-100%); animation:ctaShimmer 2.8s infinite;
        }
        @keyframes formIn { from { opacity:0; transform:translateY(30px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        .form-enter { animation: formIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes topbarShimmer { 0% { background-position:0% center; } 100% { background-position:300% center; } }
        .field-1 { animation: fieldIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.1s both; }
        .field-2 { animation: fieldIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .field-3 { animation: fieldIn 0.4s cubic-bezier(0.16,1,0.3,1) 0.3s both; }
        @keyframes fieldIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .submit-btn {
          position:relative; overflow:hidden; width:100%; padding:14px;
          border-radius:12px; border:none;
          background:linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9);
          color:white; font-weight:600; font-size:14px; font-family:inherit; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
          box-shadow:0 4px 20px rgba(37,99,235,0.35),inset 0 1px 0 rgba(255,255,255,0.15);
          transition:all 0.3s cubic-bezier(0.16,1,0.3,1); letter-spacing:0.01em;
        }
        .submit-btn::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(255,255,255,0.12) 0%,transparent 60%); }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 32px rgba(37,99,235,0.45); }
        .submit-btn:active:not(:disabled) { transform:translateY(0); }
        .submit-btn:disabled { opacity:0.65; cursor:not-allowed; }
        .submit-arrow { transition:transform 0.25s ease; position:relative; }
        .submit-btn:hover:not(:disabled) .submit-arrow { transform:translateX(4px); }
        .back-btn {
          display:inline-flex; align-items:center; gap:3px;
          color:rgba(147,197,253,0.35); font-size:13px; font-weight:500;
          background:none; border:none; cursor:pointer; transition:color 0.2s; padding:0; font-family:inherit;
        }
        .back-btn:hover { color:rgba(56,189,248,0.75); }
        .clear-btn {
          width:100%; margin-top:8px; padding:9px; background:none; border:none; cursor:pointer;
          font-size:12px; color:rgba(147,197,253,0.2); font-family:inherit; transition:color 0.2s;
        }
        .clear-btn:hover { color:rgba(147,197,253,0.45); }
        @keyframes shake { 10%,90%{transform:translateX(-2px);} 20%,80%{transform:translateX(3px);} 30%,50%,70%{transform:translateX(-3px);} 40%,60%{transform:translateX(3px);} }
        .shake { animation:shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.25); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; display:inline-block; }
        .badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(14,165,233,0.1); border:1px solid rgba(14,165,233,0.2);
          border-radius:20px; padding:4px 12px; font-size:10px;
          color:rgba(125,211,252,0.7); letter-spacing:0.08em; margin-bottom:8px; text-transform:uppercase;
        }
        .badge-dot { width:5px; height:5px; border-radius:50%; background:#0ea5e9; animation:pulseDot 2s ease-in-out infinite; }
      `}</style>

      <div className="lm-root">
        <div className="orb orb1"/> <div className="orb orb2"/> <div className="orb orb3"/> <div className="orb orb4"/>
        <div className="dot-grid"/>
        <FloatingSquares/>

        {/* ── Subtle drifting car silhouettes ── */}
        <SideCarPanel side="left"/>
        <SideCarPanel side="right"/>

        {/* ══════════ LANDING ══════════ */}
        {view === 'landing' && (
          <div className="landing-enter" style={{
            position:'relative', zIndex:10,
            display:'flex', flexDirection:'column', alignItems:'center',
            textAlign:'center', padding:'0 24px', maxWidth:'620px', width:'100%',
          }}>
            <div style={{ marginBottom:'32px', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ position:'absolute', inset:'-60px', borderRadius:'50%', background:'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)', animation:'pulseDot 3.5s ease-in-out infinite' }}/>
              <img src={veloLogo} alt="VeloConnect" className="logo-float" style={{ height:'270px', width:'auto', objectFit:'contain', position:'relative', filter:'brightness(0) invert(1) drop-shadow(0 0 32px rgba(37,99,235,0.55))' }}/>
              <div style={{ position:'relative', lineHeight:1 }}>
                <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:'clamp(42px, 6vw, 64px)', fontWeight:400, background:'linear-gradient(135deg, #93c5fd 0%, #38bdf8 50%, #bae6fd 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundSize:'200% 100%', animation:'titleShimmer 4s ease infinite', letterSpacing:'-0.02em' }}>Velo</span>
                <span style={{ fontFamily:"'DM Serif Display', serif", fontSize:'clamp(42px, 6vw, 64px)', fontWeight:400, color:'rgba(255,255,255,0.88)', letterSpacing:'-0.02em', marginLeft:'10px' }}>Connect</span>
              </div>
            </div>
            <div className="badge"><span className="badge-dot"/> Secure Vehicle Portal</div>
            <div className="shimmer-line" style={{ marginBottom:'14px', marginTop:'8px' }}/>
            <p style={{ fontSize:'11px', color:'rgba(147,197,253,0.35)', fontWeight:500, letterSpacing:'0.22em', textTransform:'uppercase', marginBottom:'52px' }}>Powered by Intute.ai</p>
            <button className="cta-btn" onClick={() => setView('form')}>
              <span className="shimmer-overlay"/>
              <span style={{ position:'relative' }}>Get Started</span>
              <span className="cta-arrow"><ArrowRight style={{ width:18, height:18, strokeWidth:2.5 }}/></span>
            </button>
            <div style={{ display:'flex', gap:'8px', alignItems:'center', marginTop:'52px' }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ width:i===2?28:7, height:7, borderRadius:4, background:'linear-gradient(90deg,#2563eb,#0ea5e9)', opacity:i===2?0.8:0.18 }}/>
              ))}
            </div>
          </div>
        )}

        {/* ══════════ FORM ══════════ */}
        {view === 'form' && (
          <div className="form-enter" style={{ position:'relative', zIndex:10, width:'420px', maxWidth:'calc(100vw - 32px)' }}>
            <div style={{ position:'absolute', inset:'-1px', borderRadius:'23px', background:'linear-gradient(135deg, rgba(37,99,235,0.4), rgba(14,165,233,0.28), rgba(186,230,253,0.18))', filter:'blur(0.5px)' }}/>
            <div style={{ position:'relative', background:'rgba(2,5,14,0.96)', border:'1px solid rgba(37,99,235,0.18)', borderRadius:'22px', overflow:'hidden' }}>
              <div style={{ height:'2px', background:'linear-gradient(90deg,#1e3a8a,#2563eb,#0ea5e9,#7dd3fc,#bae6fd)', backgroundSize:'300% 100%', animation:'topbarShimmer 3s linear infinite' }}/>
              <div style={{ padding:'32px 36px 28px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'28px' }}>
                  <button className="back-btn" onClick={goBack}><ChevronLeft style={{ width:14, height:14, strokeWidth:2.5 }}/> Back</button>
                  <img src={veloLogo} alt="VeloConnect" style={{ height:'96px', width:'auto', objectFit:'contain', filter:'brightness(0) invert(1) drop-shadow(0 0 12px rgba(14,165,233,0.6))' }}/>
                </div>
                <div style={{ marginBottom:'24px' }}>
                  <div className="badge" style={{ display:'inline-flex', marginBottom:'10px' }}><span className="badge-dot"/> Secure Vehicle Portal</div>
                  <h2 style={{ fontSize:'24px', fontWeight:700, color:'rgba(224,242,254,0.92)', letterSpacing:'-0.02em', lineHeight:1.2, marginBottom:'5px' }}>Welcome back</h2>
                  <p style={{ color:'rgba(147,197,253,0.3)', fontSize:'13px' }}>Sign in to your VeloConnect account</p>
                </div>
                {error && (
                  <div className="shake" style={{ marginBottom:'16px', padding:'11px 14px', borderRadius:'11px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', display:'flex', alignItems:'flex-start', gap:'9px' }}>
                    <AlertCircle style={{ width:14, height:14, color:'#fca5a5', flexShrink:0, marginTop:1 }}/>
                    <p style={{ color:'#fca5a5', fontSize:'13px', fontWeight:500, lineHeight:1.4 }}>{error}</p>
                  </div>
                )}
                <div className="field-1"><FloatingInput id="email" type="email" label="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown}/></div>
                <div className="field-2"><FloatingInput id="password" type="password" label="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} showToggle showPassword={showPw} onToggle={() => setShowPw(p => !p)}/></div>
                <div style={{ textAlign:'right', marginTop:'-8px', marginBottom:'20px' }}>
                  <a href="#" style={{ fontSize:'12px', color:'rgba(56,189,248,0.5)', textDecoration:'none' }}
                    onMouseEnter={e => (e.currentTarget.style.color='rgba(125,211,252,0.85)')}
                    onMouseLeave={e => (e.currentTarget.style.color='rgba(56,189,248,0.5)')}>Forgot password?</a>
                </div>
                <div className="field-3">
                  <button className="submit-btn" disabled={loading} onClick={handleLogin}>
                    <span className="shimmer-overlay"/>
                    {loading ? (<><span className="spinner"/><span style={{ position:'relative' }}>Signing in…</span></>) : (<><span style={{ position:'relative' }}>Sign In</span><span className="submit-arrow"><ArrowRight style={{ width:15, height:15, strokeWidth:2.5 }}/></span></>)}
                  </button>
                </div>
                <button className="clear-btn" onClick={clearAll} disabled={loading}>Clear fields</button>
              </div>
              <div style={{ borderTop:'1px solid rgba(37,99,235,0.1)', padding:'12px 36px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', color:'rgba(147,197,253,0.2)' }}>Powered by</span>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(37,99,235,0.07)', border:'1px solid rgba(37,99,235,0.14)', borderRadius:'20px', padding:'4px 10px 4px 6px' }}>
                  <div style={{ width:18, height:18, borderRadius:'50%', background:'linear-gradient(135deg,#1e3a8a,#2563eb,#0ea5e9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                  </div>
                  <img src={intuteLogo} alt="Intute.ai" style={{ height:'42px', width:'auto', objectFit:'contain', filter:'brightness(0) invert(1) opacity(0.45)' }}/>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}