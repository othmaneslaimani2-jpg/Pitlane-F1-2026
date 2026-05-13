import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import races from '../data/races.json';
import { ArrowRight, Zap, Users, Fuel, Flag } from 'lucide-react';
import { Link } from 'react-router';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  /* ── Countdown State ── */
  const nextRace = races.find(r => new Date(r.date).getTime() > Date.now()) || races[0];
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(nextRace.date).getTime();
    const tick = () => {
      const diff = targetDate - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000)
        });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextRace.date]);

  /* ── GSAP Entrance + ScrollTrigger ── */
  useGSAP(() => {
    if (!containerRef.current) return;

    // Hero entrance (above the fold — immediate animation)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-badge', { y: -10, opacity: 0, duration: 0.4 })
      .from('.hero-title span', { y: 40, opacity: 0, stagger: 0.08, duration: 0.6 }, '-=0.2')
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3');

    // Countdown card — scroll triggered
    gsap.from('.countdown-card', {
      scrollTrigger: {
        trigger: '.countdown-card',
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      },
      y: 40,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out'
    });

    // Stat cards — staggered scroll trigger
    gsap.utils.toArray<HTMLElement>('.stat-card').forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        },
        y: 30,
        opacity: 0,
        scale: 0.95,
        duration: 0.5,
        delay: i * 0.08,
        ease: 'power3.out'
      });
    });

    // Upcoming header — scroll trigger
    gsap.from('.upcoming-header', {
      scrollTrigger: {
        trigger: '.upcoming-header',
        start: 'top 90%',
        toggleActions: 'play none none reverse'
      },
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power3.out'
    });

    // Race rows — staggered scroll trigger
    gsap.utils.toArray<HTMLElement>('.race-row').forEach((row, i) => {
      gsap.from(row, {
        scrollTrigger: {
          trigger: row,
          start: 'top 92%',
          toggleActions: 'play none none reverse'
        },
        x: -30,
        opacity: 0,
        duration: 0.5,
        delay: i * 0.07,
        ease: 'power3.out'
      });
    });

  }, { scope: containerRef });

  /* ── Upcoming Races (next 4) ── */
  const upcoming = races
    .filter(r => new Date(r.date).getTime() > Date.now())
    .slice(0, 4);

  return (
    <div ref={containerRef} className="flex flex-col gap-14">

      {/* ══════ HERO ══════ */}
      <section ref={heroRef} className="relative pt-6 md:pt-12 pb-4">
        {/* Background decorations */}
        <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
          <div className="hero-badge inline-flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-mono text-on-surface-muted tracking-[0.12em] uppercase">
              2026 regulations — new era
            </span>
          </div>

          <h1 className="hero-title text-5xl sm:text-6xl md:text-[5rem] lg:text-[6rem] font-black uppercase leading-[0.9] tracking-[-0.03em]">
            <span className="block text-white">Feel Every</span>
            <span className="block bg-gradient-to-r from-primary via-primary-soft to-primary bg-clip-text text-transparent">
              Lap Live
            </span>
          </h1>

          <p className="hero-sub text-base md:text-lg text-on-surface-muted max-w-xl leading-relaxed">
            Your premium companion for the most revolutionary season in Formula 1 history.
            Track every race, build your garage, log your season.
          </p>
        </div>
      </section>

      {/* ══════ COUNTDOWN CARD ══════ */}
      <section className="countdown-card">
        <div className="glass-panel rounded-xl overflow-hidden">
          {/* Scan line accent */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-40" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Race info */}
            <div className="flex items-center gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                <span className="text-xl">{nextRace.country}</span>
              </div>
              <div>
                <p className="text-[11px] font-mono text-primary tracking-[0.15em] uppercase mb-0.5">
                  Round {nextRace.round} — Next Race
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-white">{nextRace.name}</h2>
                <p className="text-xs text-on-surface-muted mt-0.5 font-mono">{nextRace.circuit}</p>
              </div>
            </div>

            {/* Right: Countdown */}
            <div className="flex items-center gap-2">
              <CountdownUnit value={timeLeft.days} label="DAYS" />
              <Separator />
              <CountdownUnit value={timeLeft.hours} label="HRS" />
              <Separator />
              <CountdownUnit value={timeLeft.minutes} label="MIN" />
              <Separator />
              <CountdownUnit value={timeLeft.seconds} label="SEC" highlight />
            </div>
          </div>
        </div>
      </section>

      {/* ══════ STAT CARDS ══════ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Flag size={18} />} value="24" label="Grands Prix" />
        <StatCard icon={<Users size={18} />} value="11" label="Teams" accent />
        <StatCard icon={<Fuel size={18} />} value="100%" label="Sustainable" />
        <StatCard icon={<Zap size={18} />} value="350+" label="KW ERS" accent />
      </section>

      {/* ══════ UPCOMING RACES ══════ */}
      <section>
        <div className="upcoming-header flex items-center justify-between mb-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              Upcoming
            </h2>
            <p className="text-xs font-mono text-on-surface-muted mt-1 tracking-wider">NEXT ON THE CALENDAR</p>
          </div>
          <Link
            to="/calendrier"
            className="btn-secondary text-xs"
          >
            Full Grid <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {upcoming.map((race) => (
            <Link
              key={race.id}
              to={`/calendrier/${race.id}`}
              className="race-row group glass-panel-solid rounded-lg px-5 py-4 flex items-center gap-5 card-glow cursor-pointer"
            >
              {/* Round badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-on-surface-muted">
                  R{race.round.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Flag + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">{race.country}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                    {race.name}
                  </p>
                  <p className="text-[11px] font-mono text-on-surface-muted truncate">{race.city} — {race.circuit}</p>
                </div>
              </div>

              {/* Type badge */}
              <span className={race.type === 'Sprint' ? 'tag-sprint' : 'tag-standard'}>
                {race.type}
              </span>

              {/* Date */}
              <div className="hidden md:block text-right flex-shrink-0 w-28">
                <p className="text-xs font-mono text-on-surface-muted">
                  {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight size={16} className="text-on-surface-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Countdown Unit ─── */
function CountdownUnit({ value, label, highlight }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`
        min-w-[56px] md:min-w-[68px] py-2.5 rounded-lg text-center font-mono text-2xl md:text-3xl font-bold
        ${highlight
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'bg-white/[0.04] text-white border border-white/[0.06]'
        }
      `}>
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-[9px] font-mono text-on-surface-muted tracking-[0.15em]">{label}</span>
    </div>
  );
}

/* ─── Colon Separator ─── */
function Separator() {
  return <span className="text-on-surface-muted/30 font-mono text-xl font-bold mb-4">:</span>;
}

/* ─── Stat Card ─── */
function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent?: boolean }) {
  return (
    <div className="stat-card glass-panel-solid rounded-lg p-4 md:p-5 flex flex-col gap-3 border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center ${accent ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</p>
        <p className="text-[11px] font-mono text-on-surface-muted tracking-wider uppercase mt-0.5">{label}</p>
      </div>
    </div>
  );
}
