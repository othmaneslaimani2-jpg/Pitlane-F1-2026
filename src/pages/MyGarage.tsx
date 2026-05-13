import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookmarkX, Bookmark, CalendarDays, MapPin } from 'lucide-react';
import { Link } from 'react-router';
import racesData from '../data/races.json';
import { useUserData } from '../context/UserDataContext';

gsap.registerPlugin(ScrollTrigger);

export default function MyGarage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { garage, removeFromGarage } = useUserData();
  const bookmarks = racesData.filter(r => garage.includes(r.id));

  /* ── Entrance + ScrollTrigger ── */
  useGSAP(() => {
    if (!containerRef.current) return;

    gsap.from('.page-header', { y: -15, opacity: 0, duration: 0.5, ease: 'power3.out' });

    gsap.utils.toArray<HTMLElement>('.garage-item').forEach((item, i) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        },
        x: -30,
        opacity: 0,
        duration: 0.5,
        delay: i * 0.06,
        ease: 'power3.out'
      });
    });

    const emptyState = containerRef.current.querySelector('.empty-state');
    if (emptyState) {
      gsap.from(emptyState, {
        scrollTrigger: {
          trigger: emptyState,
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out'
      });
    }
  }, { scope: containerRef, dependencies: [bookmarks.length] });

  const handleRemove = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const el = document.getElementById(`bk-${id}`);
    if (el) {
      gsap.to(el, {
        x: 60,
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginBottom: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => removeFromGarage(id)
      });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="page-header pb-6 border-b border-white/[0.06]">
        <p className="text-[11px] font-mono text-primary tracking-[0.15em] uppercase mb-1">Personal Collection</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">My Garage</h1>
        <p className="text-sm text-on-surface-muted mt-1">
          {bookmarks.length} race{bookmarks.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* ── Content ── */}
      {bookmarks.length === 0 ? (
        <div className="empty-state flex flex-col items-center justify-center py-20 gap-5 glass-panel rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Bookmark size={28} className="text-on-surface-muted" />
          </div>
          <div>
            <p className="text-lg font-bold text-white mb-1">Garage is empty</p>
            <p className="text-sm text-on-surface-muted font-mono">
              Browse the calendar and save your favourite races.
            </p>
          </div>
          <Link to="/calendrier" className="btn-primary mt-2">
            <CalendarDays size={15} /> Explore Grid
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {bookmarks.map((race) => (
            <Link
              key={race.id}
              id={`bk-${race.id}`}
              to={`/calendrier/${race.id}`}
              className="garage-item group glass-panel-solid rounded-lg overflow-hidden flex items-center card-glow"
            >
              {/* Circuit thumbnail */}
              <div className="w-24 h-20 flex-shrink-0 overflow-hidden relative">
                <img
                  src={`/circuits/${race.id}.png`}
                  alt={race.circuit}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container" />
              </div>

              <div className="flex items-center gap-5 flex-1 min-w-0 px-5 py-4">
                {/* Round */}
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-primary">
                    R{race.round.toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Flag + Info */}
                <span className="text-2xl flex-shrink-0">{race.country}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                    {race.name}
                  </p>
                  <p className="text-[11px] font-mono text-on-surface-muted truncate flex items-center gap-1">
                    <MapPin size={9} /> {race.city} — {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </p>
                </div>

                {/* Type */}
                <span className={`hidden sm:inline-block ${race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}`}>
                  {race.type}
                </span>

                {/* Remove */}
                <button
                  onClick={(e) => handleRemove(race.id, e)}
                  className="flex-shrink-0 p-2.5 rounded-md text-on-surface-muted/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  aria-label="Remove from garage"
                >
                  <BookmarkX size={18} />
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
