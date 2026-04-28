import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, Users, Truck, X, ChevronRight } from 'lucide-react';
import intuteLogo from '../assets/Intute.png';

if (!document.getElementById('dm-serif-font')) {
  const fl = document.createElement('link');
  fl.id = 'dm-serif-font';
  fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap';
  document.head.appendChild(fl);
}

export default function Header({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  function handleLogout() { onLogout(); navigate('/'); }
  function goTo(path) { setOpen(false); navigate(path); }

  const links = isAdmin
    ? [
        { label: 'Fleet Overview',    icon: LayoutDashboard, to: '/admin'             },
        { label: 'Customer Database', icon: Users,           to: '/masters/customers' },
        { label: 'Vehicle Database',  icon: Truck,           to: '/masters/vehicles'  },
      ]
    : [{ label: 'My Vehicles', icon: LayoutDashboard, to: '/dashboard' }];

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-20 bg-[#06080f]/95 backdrop-blur-2xl border-b border-white/[0.06]">
        {/* Rainbow top hairline */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6, #d946ef, #06b6d4)' }} />

        <div className="max-w-7xl mx-auto px-5 h-[84px] flex items-center justify-between gap-4">

          {/* Hamburger */}
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col gap-[5px] p-2.5 rounded-xl hover:bg-white/[0.05] transition group flex-shrink-0"
            aria-label="Menu"
          >
            <span className="w-[18px] h-[1.5px] bg-slate-400 group-hover:bg-white transition-colors rounded-full" />
            <span className="w-[13px] h-[1.5px] bg-slate-500 group-hover:bg-slate-300 transition-colors rounded-full" />
            <span className="w-[18px] h-[1.5px] bg-slate-400 group-hover:bg-white transition-colors rounded-full" />
          </button>

          {/* Centered VeloConnect logo */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="px-2 py-1 whitespace-nowrap leading-none select-none">
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  background: 'linear-gradient(135deg, #93c5fd 0%, #38bdf8 50%, #bae6fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}
              >
                Velo
              </span>
              <span
                style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: '40px',
                  fontWeight: 400,
                  color: 'rgba(255,255,255,0.88)',
                  letterSpacing: '-0.02em',
                  marginLeft: '8px',
                }}
              >
                Connect
              </span>
            </div>
          </div>

          {/* Right: user chip + logout */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-semibold text-white leading-tight">{user?.full_name}</span>
              <span className="text-[11px] text-slate-500 capitalize">{user?.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 border border-white/[0.07] hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Sidebar backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[300px] z-50 flex flex-col bg-[#09090f] border-r border-white/[0.07] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Rainbow hairline */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6, #d946ef, #06b6d4)' }} />

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div className="px-2 py-1 whitespace-nowrap leading-none select-none">
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '30px',
                fontWeight: 400,
                background: 'linear-gradient(135deg, #93c5fd 0%, #38bdf8 50%, #bae6fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Velo
            </span>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '30px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.88)',
                letterSpacing: '-0.02em',
                marginLeft: '6px',
              }}
            >
              Connect
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
            >
              {user?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/20 capitalize mt-0.5">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 mt-5 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.15em] px-2 mb-3">Navigation</p>
          {links.map(({ label, icon: Icon, to }) => (
            <button
              key={to}
              onClick={() => goTo(to)}
              className="group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:bg-violet-500/10 group-hover:border-violet-500/20 transition-all flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
              </div>
              <span className="text-sm font-medium flex-1 text-left">{label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-500 transition-colors" />
            </button>
          ))}
        </nav>

        {/* Footer: logout + Intute.ai */}
        <div className="p-4 border-t border-white/[0.06] space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/[0.07] border border-transparent hover:border-red-500/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
          <div className="flex items-center justify-center gap-2.5 pt-1">
            <span className="text-[10px] text-slate-700">Powered by</span>
            <img src={intuteLogo} alt="Intute.ai" className="h-12 w-auto object-contain" />
          </div>
        </div>
      </aside>
    </>
  );
}
