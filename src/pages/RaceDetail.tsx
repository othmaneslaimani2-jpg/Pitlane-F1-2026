import { useRef } from 'react';
import { useParams, Link } from 'react-router';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import races from '../data/races.json';
import { ArrowLeft, MapPin, Clock, Globe, Bookmark, CalendarDays, Gauge, RotateCcw, Trophy, Route, Eye } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

gsap.registerPlugin(ScrollTrigger);

export default function RaceDetail() {
  const { raceId } = useParams<{ raceId: string }>();
  const race = races.find(r => r.id === raceId);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isInGarage, isInSeason, toggleGarage, toggleSeason } = useUserData();

  /* ── GSAP Entrance + ScrollTrigger ── */
  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.from('.detail-back', { x: -10, opacity: 0, duration: 0.3, ease: 'power3.out' });
    gsap.from('.detail-hero', { y: 30, opacity: 0, duration: 0.7, delay: 0.1, ease: 'power3.out' });

    gsap.utils.toArray<HTMLElement>('.detail-stat').forEach((stat, i) => {
      gsap.from(stat, {
        scrollTrigger: {
          trigger: stat,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        delay: i * 0.08,
        ease: 'power3.out'
      });
    });

    gsap.utils.toArray<HTMLElement>('.scroll-section').forEach((section) => {
      gsap.from(section, {
        scrollTrigger: {
          trigger: section,
          start: 'top 88%',
          toggleActions: 'play none none reverse'
        },
        y: 40,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
    });
  }, { scope: containerRef });

  if (!race) {
    return (
      <div className="py-24 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <MapPin size={28} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white">Circuit Not Found</h1>
        <p className="text-on-surface-muted text-sm font-mono">The requested race does not exist in the 2026 calendar.</p>
        <Link to="/calendrier" className="btn-primary mt-4">Return to Grid</Link>
      </div>
    );
  }

  const raceDate = new Date(race.date);
  const isPast = raceDate.getTime() < Date.now();
  const inGarage = isInGarage(race.id);
  const inSeason = isInSeason(race.id);

  return (
    <div ref={containerRef} className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* ── Back link ── */}
      <Link to="/calendrier" className="detail-back inline-flex items-center gap-2 text-on-surface-muted hover:text-white transition-colors text-sm font-semibold w-fit group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Grid
      </Link>

      {/* ══════ HERO WITH IMAGE ══════ */}
      <div className="detail-hero rounded-xl overflow-hidden relative">
        {/* Circuit Image */}
        <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
          <img
            src={`/circuits/${race.id}.png`}
            alt={race.circuit}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-surface-container/50 to-transparent" />
          
          <div className={`absolute top-0 left-0 right-0 h-[3px] ${race.type === 'Sprint' ? 'bg-gradient-to-r from-primary via-primary-soft to-transparent' : 'bg-gradient-to-r from-white/30 via-white/10 to-transparent'}`} />
        </div>

        {/* Content overlaid on image bottom */}
        <div className="relative -mt-32 md:-mt-36 p-6 md:p-10 z-10">
          {/* Badge row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}>
              {race.type} Weekend
            </span>
            <span className="text-[10px] font-mono text-white/70 tracking-[0.12em] uppercase bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
              Round {race.round.toString().padStart(2, '0')} of 24
            </span>
            {isPast && (
              <span className="text-[10px] font-mono text-accent tracking-[0.1em] uppercase flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Completed
              </span>
            )}
          </div>

          {/* Title */}
          <div className="flex items-start gap-4 mb-2">
            <span className="text-5xl drop-shadow-lg">{race.country}</span>
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none drop-shadow-lg">
                {race.name}
              </h1>
              <p className="text-sm font-mono text-white/70 mt-2 flex items-center gap-1.5 drop-shadow">
                <MapPin size={12} /> {race.circuit}, {race.city}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />
      </div>

      {/* ══════ ACTION BUTTONS (prominent) ══════ */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => toggleGarage(race.id)}
          className={`group flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 ${
            inGarage
              ? 'bg-primary/15 border-2 border-primary/40 text-primary shadow-[0_0_20px_rgba(225,6,0,0.15)] hover:bg-primary/20'
              : 'glass-panel-solid border-2 border-white/[0.06] text-on-surface-muted hover:border-primary/30 hover:text-primary'
          }`}
        >
          <Bookmark size={18} className={`transition-transform duration-200 group-hover:scale-110 ${inGarage ? 'fill-primary' : ''}`} />
          {inGarage ? 'Saved to Garage' : 'Add to Garage'}
        </button>
        <button
          onClick={() => toggleSeason(race.id)}
          className={`group flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 ${
            inSeason
              ? 'bg-accent/15 border-2 border-accent/40 text-accent shadow-[0_0_20px_rgba(0,230,118,0.15)] hover:bg-accent/20'
              : 'glass-panel-solid border-2 border-white/[0.06] text-on-surface-muted hover:border-accent/30 hover:text-accent'
          }`}
        >
          <Eye size={18} className="transition-transform duration-200 group-hover:scale-110" />
          {inSeason ? 'Logged in Season' : 'Add to Season'}
        </button>
      </div>

      {/* ══════ STAT ROW ══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <DetailStat icon={<CalendarDays size={16} />} label="Date" value={raceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
        <DetailStat icon={<Clock size={16} />} label="Lights Out" value={raceDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
        <DetailStat icon={<RotateCcw size={16} />} label="Laps" value={race.laps.toString()} />
        <DetailStat icon={<Gauge size={16} />} label="Circuit Length" value={race.length} />
      </div>

      {/* ══════ CIRCUIT INFO SECTION ══════ */}
      <div className="scroll-section glass-panel-solid rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-5 flex items-center gap-2">
          <Route size={16} className="text-primary" /> Circuit Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg overflow-hidden h-48 relative group">
            <img
              src={`/circuits/${race.id}.png`}
              alt={race.circuit}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-sm font-bold text-white">{race.circuit}</p>
              <p className="text-[11px] font-mono text-white/60">{race.city}</p>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Trophy size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-mono text-on-surface-muted tracking-wider uppercase">Type</p>
                <p className="text-sm font-semibold text-white">{race.type} Weekend</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
                <RotateCcw size={18} className="text-accent" />
              </div>
              <div>
                <p className="text-xs font-mono text-on-surface-muted tracking-wider uppercase">Race Distance</p>
                <p className="text-sm font-semibold text-white">{race.laps} laps × {race.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <CalendarDays size={18} className="text-on-surface-muted" />
              </div>
              <div>
                <p className="text-xs font-mono text-on-surface-muted tracking-wider uppercase">Race Day</p>
                <p className="text-sm font-semibold text-white">
                  {raceDate.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ REGION SECTION ══════ */}
      <div className="scroll-section glass-panel-solid rounded-xl p-6 md:p-8">
        <h2 className="text-lg font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
          <Globe size={16} className="text-primary" /> Region
        </h2>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xl">
            {race.country}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{race.continent}</p>
            <p className="text-[11px] font-mono text-on-surface-muted">{race.city}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Detail Stat Card ─── */
function DetailStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="detail-stat glass-panel-solid rounded-lg p-4 border border-white/[0.04]">
      <div className="flex items-center gap-1.5 mb-2 text-primary">
        {icon}
        <span className="text-[10px] font-mono text-on-surface-muted tracking-[0.12em] uppercase">{label}</span>
      </div>
      <p className="text-lg md:text-xl font-bold text-white font-mono">{value}</p>
    </div>
  );
}
