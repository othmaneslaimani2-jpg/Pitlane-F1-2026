import React, { useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import RaceDetail from './pages/RaceDetail';
import MyGarage from './pages/MyGarage';
import MySeason from './pages/MySeason';
import Experience from './pages/Experience';
import { UserDataProvider } from './context/UserDataContext';
import { Gauge, CalendarDays, Bookmark, Clock, Gamepad2 } from 'lucide-react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/* ─── Animated Layout Shell ─── */
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'all' }
    );
  }, { dependencies: [location.pathname] });

  const isExperience = location.pathname === '/experience';

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isExperience ? 'bg-[#0a0a0f]' : ''}`}>
      {/* ── Navbar ── */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/4">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/modern-flag-p-letter-logo-f69c3ca7-eb30-40f8-806d-45fbb183d56e.png" alt="Pitlane Logo" className="h-8 object-contain drop-shadow-[0_0_10px_rgba(225,6,0,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(225,6,0,0.5)] transition-all" />
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-black tracking-tight text-white uppercase">Pitlane</span>
              <span className="text-[10px] font-mono text-on-surface-muted tracking-[0.15em]">FORMULA 1</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            <NavLink to="/" icon={<Gauge size={16} />} text="Paddock" />
            <NavLink to="/experience" icon={<Gamepad2 size={16} />} text="Experience" />
            <NavLink to="/calendrier" icon={<CalendarDays size={16} />} text="Grid" />
            <NavLink to="/mongarage" icon={<Bookmark size={16} />} text="Garage" />
            <NavLink to="/masaison" icon={<Clock size={16} />} text="Season" />
          </div>
        </div>
      </nav>

      {/* ── Page Content ── */}
      {isExperience ? (
        <main ref={containerRef} className="flex-1 w-full relative">
          {children}
        </main>
      ) : (
        <main ref={containerRef} className="flex-1 w-full">
          <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-8 md:py-10">
            {children}
          </div>
        </main>
      )}

      {/* ── Footer ── */}
      {!isExperience && (
        <footer className="border-t border-white/4 mt-auto">
          <div className="max-w-[1400px] mx-auto px-5 md:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-on-surface-muted tracking-wider">
              PITLANE © 2026 — F1 FAN COMPANION
            </span>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-mono text-on-surface-muted/60 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                100% SUSTAINABLE FUEL
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/* ─── Nav Link Component ─── */
function NavLink({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) {
  const location = useLocation();
  const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Link
      ref={linkRef}
      to={to}
      className={`
        relative flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-semibold tracking-wide uppercase
        transition-all duration-200
        ${isActive
          ? 'text-white bg-white/8'
          : 'text-on-surface-muted hover:text-white hover:bg-white/4'
        }
      `}
    >
      <span className={isActive ? 'text-primary' : ''}>{icon}</span>
      <span className="nav-label">{text}</span>
      {isActive && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-primary rounded-full" />
      )}
    </Link>
  );
}

/* ─── Scroll To Top Component ─── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/* ─── App Root ─── */
export default function App() {
  return (
    <BrowserRouter>
      <UserDataProvider>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/experience" element={<Experience />} />
            <Route path="/calendrier" element={<Calendar />} />
            <Route path="/calendrier/:raceId" element={<RaceDetail />} />
            <Route path="/mongarage" element={<MyGarage />} />
            <Route path="/masaison" element={<MySeason />} />
          </Routes>
        </Layout>
      </UserDataProvider>
    </BrowserRouter>
  );
}
