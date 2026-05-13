import { useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router';
import races from '../data/races.json';
import { ArrowRight, MapPin, LayoutGrid, List, Bookmark, Eye } from 'lucide-react';
import { useUserData } from '../context/UserDataContext';

gsap.registerPlugin(ScrollTrigger);

export default function Calendar() {
  const [filterContinent, setFilterContinent] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const containerRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);
  const { isInGarage, isInSeason, toggleGarage, toggleSeason } = useUserData();

  const continents = ['All', ...Array.from(new Set(races.map(r => r.continent)))];
  const types = ['All', ...Array.from(new Set(races.map(r => r.type)))];

  const filteredRaces = races.filter(race =>
    (filterContinent === 'All' || race.continent === filterContinent) &&
    (filterType === 'All' || race.type === filterType)
  );

  /* ── One-time entrance animation (header + filters) ── */
  useGSAP(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    gsap.from('.page-header', { y: -15, opacity: 0, duration: 0.5, ease: 'power3.out' });
    gsap.from('.filter-bar', { y: 10, opacity: 0, duration: 0.4, delay: 0.1, ease: 'power3.out' });
  }, { scope: containerRef });

  /* ── Animate cards with ScrollTrigger when filter/view changes ── */
  const animateCards = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const cards = el.querySelectorAll('.race-card');

    cards.forEach(card => {
      ScrollTrigger.getAll().forEach(st => {
        if (st.trigger === card) st.kill();
      });
    });

    cards.forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 30, scale: 0.96 },
        {
          scrollTrigger: {
            trigger: card,
            start: 'top 93%',
            toggleActions: 'play none none reverse'
          },
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          delay: i * 0.04,
          ease: 'power2.out',
          clearProps: 'all'
        }
      );
    });
  }, []);

  const isPast = (date: string) => new Date(date).getTime() < Date.now();

  /* ── Action button handler (prevents navigation) ── */
  const handleAction = (e: React.MouseEvent, callback: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="page-header flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <p className="text-[11px] font-mono text-primary tracking-[0.15em] uppercase mb-1">Season Calendar</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
            The Grid
          </h1>
          <p className="text-sm text-on-surface-muted mt-1">
            {filteredRaces.length} race{filteredRaces.length !== 1 ? 's' : ''} · {new Set(filteredRaces.map(r => r.continent)).size} continent{new Set(filteredRaces.map(r => r.continent)).size !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-surface-container rounded-md p-0.5">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white/[0.08] text-white' : 'text-on-surface-muted hover:text-white'}`}
          >
            <LayoutGrid size={15} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white/[0.08] text-white' : 'text-on-surface-muted hover:text-white'}`}
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-mono text-on-surface-muted tracking-[0.12em] uppercase mr-1">Filter:</span>
        
        <div className="flex flex-wrap gap-1.5">
          {continents.map(c => (
            <button
              key={c}
              onClick={() => setFilterContinent(c)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200
                ${filterContinent === c
                  ? 'bg-primary text-white shadow-[0_0_12px_rgba(225,6,0,0.3)]'
                  : 'bg-white/[0.04] text-on-surface-muted border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                }
              `}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1 hidden md:block" />

        <div className="flex gap-1.5">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`
                px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200
                ${filterType === t
                  ? 'bg-white/[0.12] text-white'
                  : 'bg-white/[0.04] text-on-surface-muted border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                }
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ══════ GRID VIEW ══════ */}
      {viewMode === 'grid' ? (
        <div
          key={`grid-${filterContinent}-${filterType}`}
          ref={animateCards}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filteredRaces.map((race) => {
            const inGarage = isInGarage(race.id);
            const inSeason = isInSeason(race.id);

            return (
              <Link
                key={race.id}
                to={`/calendrier/${race.id}`}
                className={`race-card group rounded-xl overflow-hidden card-glow block relative bg-surface-container border border-white/[0.06] ${isPast(race.date) ? 'opacity-60' : ''}`}
              >
                {/* ── Circuit Image ── */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={`/circuits/${race.id}.png`}
                    alt={race.circuit}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/60 to-transparent" />
                  
                  {/* Top badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-black/60 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded tracking-wider">
                      R{race.round.toString().padStart(2, '0')}
                    </span>
                    <span className={race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}>
                      {race.type}
                    </span>
                  </div>

                  {/* Flag */}
                  <div className="absolute top-3 right-3 text-2xl drop-shadow-lg">
                    {race.country}
                  </div>

                  {/* Date */}
                  <div className="absolute bottom-3 right-3 text-xs font-mono text-white/70 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded">
                    {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {/* ── Card Body ── */}
                <div className="p-4 pt-3">
                  <h3 className="text-[15px] font-bold text-white mb-1 group-hover:text-primary transition-colors leading-tight">
                    {race.name}
                  </h3>
                  <p className="text-[11px] font-mono text-on-surface-muted mb-3 flex items-center gap-1">
                    <MapPin size={10} /> {race.circuit}
                  </p>

                  {/* Telemetry + Actions row */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                    <div className="flex gap-3">
                      <span className="data-chip">{race.laps} LAPS</span>
                      <span className="data-chip">{race.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Garage (Bookmark) button */}
                      <button
                        onClick={(e) => handleAction(e, () => toggleGarage(race.id))}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          inGarage
                            ? 'text-primary bg-primary/10 hover:bg-primary/20'
                            : 'text-on-surface-muted/40 hover:text-primary hover:bg-white/[0.04]'
                        }`}
                        title={inGarage ? 'Remove from Garage' : 'Add to Garage'}
                      >
                        <Bookmark size={14} className={inGarage ? 'fill-primary' : ''} />
                      </button>
                      {/* Season (Eye) button */}
                      <button
                        onClick={(e) => handleAction(e, () => toggleSeason(race.id))}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          inSeason
                            ? 'text-accent bg-accent/10 hover:bg-accent/20'
                            : 'text-on-surface-muted/40 hover:text-accent hover:bg-white/[0.04]'
                        }`}
                        title={inSeason ? 'Remove from Season' : 'Add to Season'}
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* ══════ LIST VIEW ══════ */
        <div
          key={`list-${filterContinent}-${filterType}`}
          ref={animateCards}
          className="flex flex-col gap-2"
        >
          {filteredRaces.map(race => {
            const inGarage = isInGarage(race.id);
            const inSeason = isInSeason(race.id);

            return (
              <Link
                key={race.id}
                to={`/calendrier/${race.id}`}
                className={`race-card group glass-panel-solid rounded-lg overflow-hidden flex items-center card-glow ${isPast(race.date) ? 'opacity-60' : ''}`}
              >
                {/* Mini thumbnail */}
                <div className="w-20 h-16 flex-shrink-0 overflow-hidden relative">
                  <img
                    src={`/circuits/${race.id}.png`}
                    alt={race.circuit}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-surface-container" />
                </div>

                <div className="flex items-center gap-4 flex-1 min-w-0 px-4 py-3">
                  <span className="text-xs font-mono text-on-surface-muted w-8">R{race.round.toString().padStart(2, '0')}</span>
                  <span className="text-xl flex-shrink-0">{race.country}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">{race.name}</p>
                    <p className="text-[11px] font-mono text-on-surface-muted truncate">{race.city}</p>
                  </div>
                  <span className={`hidden sm:inline-block ${race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}`}>
                    {race.type}
                  </span>
                  <span className="hidden md:flex gap-3">
                    <span className="data-chip">{race.laps} LAPS</span>
                    <span className="data-chip">{race.length}</span>
                  </span>
                  <span className="text-xs font-mono text-on-surface-muted w-16 text-right">
                    {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                  </span>

                  {/* Action buttons in list view */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleAction(e, () => toggleGarage(race.id))}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        inGarage
                          ? 'text-primary bg-primary/10'
                          : 'text-on-surface-muted/40 hover:text-primary hover:bg-white/[0.04]'
                      }`}
                      title={inGarage ? 'Remove from Garage' : 'Add to Garage'}
                    >
                      <Bookmark size={14} className={inGarage ? 'fill-primary' : ''} />
                    </button>
                    <button
                      onClick={(e) => handleAction(e, () => toggleSeason(race.id))}
                      className={`p-1.5 rounded-md transition-all duration-200 ${
                        inSeason
                          ? 'text-accent bg-accent/10'
                          : 'text-on-surface-muted/40 hover:text-accent hover:bg-white/[0.04]'
                      }`}
                      title={inSeason ? 'Remove from Season' : 'Add to Season'}
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  <ArrowRight size={14} className="text-on-surface-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {filteredRaces.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-on-surface-muted font-mono text-sm">No races match the selected filters.</p>
        </div>
      )}
    </div>
  );
}
