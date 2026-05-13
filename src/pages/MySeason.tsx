import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import racesData from '../data/races.json';
import { Eye, CheckCircle2, ArrowRight, CalendarDays, X } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

gsap.registerPlugin(ScrollTrigger);

export default function MySeason() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { season, removeFromSeason } = useUserData();
  const displayRaces = racesData.filter(r => season.includes(r.id));

  /* ── ScrollTrigger glow animation ── */
  useGSAP(() => {
    gsap.from('.season-header', { y: -15, opacity: 0, duration: 0.5, ease: 'power3.out' });

    const nodes = gsap.utils.toArray<HTMLElement>('.tl-node');
    nodes.forEach((node) => {
      gsap.to(node, {
        scrollTrigger: {
          trigger: node,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        },
        scale: 1,
        backgroundColor: '#e10600',
        boxShadow: '0 0 16px rgba(225, 6, 0, 0.6), 0 0 4px rgba(225, 6, 0, 0.8)',
        duration: 0.4,
        ease: 'power2.out'
      });

      const card = node.closest('.tl-entry')?.querySelector('.tl-card');
      if (card) {
        gsap.from(card, {
          scrollTrigger: {
            trigger: node,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          },
          x: -25,
          opacity: 0,
          duration: 0.5,
          delay: 0.08,
          ease: 'power3.out'
        });
      }
    });
  }, { scope: containerRef, dependencies: [displayRaces.length] });

  const handleRemove = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const el = document.getElementById(`tl-${id}`);
    if (el) {
      gsap.to(el, {
        x: 40,
        opacity: 0,
        height: 0,
        marginBottom: 0,
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => removeFromSeason(id)
      });
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="season-header pb-6 border-b border-white/[0.06]">
        <p className="text-[11px] font-mono text-primary tracking-[0.15em] uppercase mb-1">Personal Track Log</p>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">My Season</h1>
        <p className="text-sm text-on-surface-muted mt-1">
          {displayRaces.length} race{displayRaces.length !== 1 ? 's' : ''} logged
        </p>
      </div>

      {/* ── Timeline ── */}
      {displayRaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-5 glass-panel rounded-xl text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Eye size={28} className="text-on-surface-muted" />
          </div>
          <div>
            <p className="text-lg font-bold text-white mb-1">No races logged yet</p>
            <p className="text-sm text-on-surface-muted font-mono">Add races from the Grid to build your season timeline.</p>
          </div>
          <Link to="/calendrier" className="btn-primary mt-2">
            <CalendarDays size={15} /> Explore Grid
          </Link>
        </div>
      ) : (
        <div className="relative pl-10 md:pl-14 py-4 max-w-3xl">
          {/* Vertical line */}
          <div className="absolute left-[18px] md:left-[26px] top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-white/10 to-transparent" />

          <div className="flex flex-col gap-10">
            {displayRaces.map((race) => (
              <div key={race.id} id={`tl-${race.id}`} className="tl-entry relative flex items-start gap-5">
                {/* Node dot */}
                <div
                  className="tl-node absolute -left-10 md:-left-14 top-4 w-3.5 h-3.5 rounded-full bg-surface-container-highest border-2 border-surface-base z-10"
                  style={{ transform: 'scale(0.7)' }}
                />

                {/* Card */}
                <Link
                  to={`/calendrier/${race.id}`}
                  className="tl-card glass-panel-solid rounded-xl overflow-hidden w-full card-glow group block"
                >
                  {/* Circuit image strip */}
                  <div className="relative h-28 overflow-hidden">
                    <img
                      src={`/circuits/${race.id}.png`}
                      alt={race.circuit}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/50 to-transparent" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-2">
                      <span className="text-2xl">{race.country}</span>
                      <span className="text-[10px] font-mono text-white/70 tracking-wider bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                        Round {race.round.toString().padStart(2, '0')}
                      </span>
                    </div>
                    {/* Remove button on image */}
                    <button
                      onClick={(e) => handleRemove(race.id, e)}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 backdrop-blur-sm text-white/60 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                      aria-label="Remove from season"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="p-5 pt-3">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-on-surface-muted">
                        {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-1 text-accent text-[10px] font-mono uppercase tracking-wider">
                        <CheckCircle2 size={11} /> Logged
                      </div>
                    </div>

                    {/* Race info */}
                    <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors mb-0.5">
                      {race.name}
                    </h3>
                    <p className="text-[11px] font-mono text-on-surface-muted mb-3">{race.circuit}</p>

                    {/* Telemetry row */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                      <div className="flex gap-4">
                        <span className="data-chip">{race.laps} LAPS</span>
                        <span className="data-chip">{race.length}</span>
                        <span className={`${race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}`}>{race.type}</span>
                      </div>
                      <ArrowRight size={14} className="text-on-surface-muted/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
