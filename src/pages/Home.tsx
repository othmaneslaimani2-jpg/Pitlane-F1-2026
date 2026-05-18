import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import races from '../data/races.json';
import { ArrowRight, Zap, Users, Fuel, Flag, Volume2, VolumeX, Camera, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from "@/lib/utils";
import {
  ContainerAnimated,
  ContainerStagger
} from '../components/ui/animated-gallery';
import {
  DraggableContainer,
  GridBody,
  GridItem
} from '../components/ui/infinite-drag-scroll';

gsap.registerPlugin(ScrollTrigger);

const HERO_VIDEO_URL = 'https://file.garden/aC_DHjCefTOrIs4s/pitlane.webm';
const SPOTLIGHT_RADIUS = 140; // px — radius of the clear (non-blurred) circle

const ALBUM_IMAGES_1 = [
  "/Album/00faca8c91391b29c11ff5a51c5e86c6.jpg",
  "/Album/145ee7aee8d2d5135c53247283b93e16.jpg",
  "/Album/153f5957dd38fb61011c449042b9ef9f.jpg",
  "/Album/17752c5ecc9a1cbc6c7a91033df1774f.jpg",
  "/Album/1ae1bfc39c52b9f47fd45563eec1f068.jpg",
  "/Album/39c1b8bb8ce8890bf6cbcf5127e42ee2.jpg",
  "/Album/43b370b00155ba139048118c6e405d79.jpg",
  "/Album/5014726effb322bde8573e967d9b235a.jpg",
  "/Album/53e339929097a1ea712fe4bf88b58063.jpg",
];

const ALBUM_IMAGES_2 = [
  "/Album/6b016811002735df8d26a2da6e65a26a.jpg",
  "/Album/6b15c1719d1aa41fedfde48c81e405cd.jpg",
  "/Album/721591650f5c2f79d7c224212532f078.jpg",
  "/Album/788850931723da2a8133406e1fe449c6.jpg",
  "/Album/7c9651b10b9e8587ef19d7513d5ca453.jpg",
  "/Album/888e5480146d24eb005d4f395041d992.jpg",
  "/Album/997f6ffade8abfff88785845d676844f.jpg",
  "/Album/9e48903d390fb915b4dfb6625925dcae.jpg",
  "/Album/9f32f0ed178ff54b928765dc19d24e8f.jpg",
];

const ALBUM_IMAGES_3 = [
  "/Album/a1690e6228ef9cda37ebe73b8080dc48.jpg",
  "/Album/b6013521f914353f0a86746a314fb265.jpg",
  "/Album/bb11adc290c678f5b68005965bc9b32d.jpg",
  "/Album/bbe759eea7cb64f9dc668b61aa18e50b.jpg",
  "/Album/cdcb1b148564435bbaf75fd76a5647ed.jpg",
  "/Album/e0d2d53d9206dc355997beba5445d7d1.jpg",
  "/Album/e98fd4985dc853770845a6058968f0f3.jpg",
  "/Album/f4473c5ddbc58b17af5c8313ecf02855.jpg",
  "/Album/f6c8a3480cd1421e3ab48e082809bb1d.jpg",
];
const ALL_ALBUM_IMAGES = [
  ...ALBUM_IMAGES_1.map((src, idx) => ({ id: idx + 1, src, alt: `F1 Image ${idx + 1}` })),
  ...ALBUM_IMAGES_2.map((src, idx) => ({ id: idx + 10, src, alt: `F1 Image ${idx + 10}` })),
  ...ALBUM_IMAGES_3.map((src, idx) => ({ id: idx + 19, src, alt: `F1 Image ${idx + 19}` }))
];

export default function Home() {
  const [albumVariant, setAlbumVariant] = useState<'default' | 'masonry' | 'polaroid'>('masonry');
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroVideoWrapRef = useRef<HTMLDivElement>(null);
  const sharpLayerRef = useRef<HTMLDivElement>(null);
  const blurVideoRef = useRef<HTMLVideoElement>(null);
  const sharpVideoRef = useRef<HTMLVideoElement>(null);

  /* ── Video hover spotlight state ── */
  const [isHovering, setIsHovering] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const mousePos = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mousePos.current = { x, y };

    if (sharpLayerRef.current) {
      sharpLayerRef.current.style.maskImage =
        `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${x}px ${y}px, black 0%, transparent 100%)`;
      sharpLayerRef.current.style.webkitMaskImage =
        `radial-gradient(circle ${SPOTLIGHT_RADIUS}px at ${x}px ${y}px, black 0%, transparent 100%)`;
    }
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovering(true), []);
  const handleMouseLeave = useCallback(() => setIsHovering(false), []);

  /* ── Sync the two video elements so the spotlight mask stays seamless ── */
  useEffect(() => {
    const blur = blurVideoRef.current;
    const sharp = sharpVideoRef.current;
    if (!blur || !sharp) return;

    const syncVideos = () => {
      if (Math.abs(blur.currentTime - sharp.currentTime) > 0.05) {
        sharp.currentTime = blur.currentTime;
      }
    };

    blur.addEventListener('timeupdate', syncVideos);
    blur.addEventListener('play', () => { sharp.play().catch(() => {}); });
    blur.addEventListener('pause', () => { sharp.pause(); });

    return () => {
      blur.removeEventListener('timeupdate', syncVideos);
    };
  }, []);

  /* ── Video Volume Control ── */
  useEffect(() => {
    if (blurVideoRef.current) blurVideoRef.current.volume = volume;
    if (sharpVideoRef.current) sharpVideoRef.current.volume = volume;
  }, [volume]);

  /* ── Countdown State ── */
  const [now] = useState(() => Date.now());
  const nextRace = races.find(r => new Date(r.date).getTime() > now) || races[0];
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
      .from('.hero-sub', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
      .from('.hero-cta', { y: 20, opacity: 0, duration: 0.5 }, '-=0.3');

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
    .filter(r => new Date(r.date).getTime() > now)
    .slice(0, 4);

  return (
    <div ref={containerRef} className="flex flex-col gap-14">

      {/* ══════ VIDEO HERO ══════ */}
      <section ref={heroRef} className="relative -mx-6 md:-mx-10 -mt-6">
        {/* Video container with spotlight blur effect */}
        <div
          ref={heroVideoWrapRef}
          className="hero-video-wrap relative w-full overflow-hidden rounded-b-2xl"
          style={{ height: 'clamp(420px, 65vh, 720px)' }}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Layer 1: Blurred video (visible on hover) */}
          <video
            ref={blurVideoRef}
            className="hero-video-blur absolute inset-0 w-full h-full object-cover"
            src={HERO_VIDEO_URL}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            style={{
              filter: isHovering ? 'blur(18px) brightness(0.55)' : 'none',
              transition: 'filter 0.45s cubic-bezier(0.4,0,0.2,1)',
              transform: 'scale(1.04)', // prevent blur edge-bleed
            }}
          />

          {/* Layer 2: Sharp video masked to spotlight (only visible on hover) */}
          <div
            ref={sharpLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: isHovering ? 1 : 0,
              transition: 'opacity 0.35s ease',
              maskImage: 'radial-gradient(circle 140px at 50% 50%, black 0%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle 140px at 50% 50%, black 0%, transparent 100%)',
            }}
          >
            <video
              ref={sharpVideoRef}
              className="absolute inset-0 w-full h-full object-cover"
              src={HERO_VIDEO_URL}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              style={{ transform: 'scale(1.04)' }}
            />
          </div>

          {/* Gradient overlays for readability */}
          <div className="absolute inset-0 bg-linear-to-t from-surface-base via-surface-base/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-linear-to-r from-surface-base/30 to-transparent pointer-events-none" />

          {/* Audio Controls */}
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 pointer-events-auto group">
            {/* Mute button */}
            <button
              onClick={() => setIsMuted(m => !m)}
              className="text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {/* Volume slider */}
            <div className="w-24 transition-all duration-300 ease-in-out flex items-center">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  setVolume(newVol);
                  if (newVol > 0 && isMuted) setIsMuted(false);
                  if (newVol === 0 && !isMuted) setIsMuted(true);
                }}
                className="w-24 h-1.5 rounded-full appearance-none bg-white/20 outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                style={{
                  background: `linear-gradient(to right, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Hero content overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-end text-center pb-12 px-6 pointer-events-none">
            <div className="hero-badge inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 mb-5 pointer-events-auto">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="text-[11px] font-mono text-white/70 tracking-[0.12em] uppercase">
                2026 regulations — new era
              </span>
            </div>

            <h1 className="hero-title text-5xl sm:text-6xl md:text-[5rem] lg:text-[6rem] font-black uppercase leading-[0.9] tracking-[-0.03em] mb-4">
              <span className="block text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">Feel Every</span>
              <span className="block bg-linear-to-r from-primary via-primary-soft to-primary bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(225,6,0,0.4)]">
                Lap Live
              </span>
            </h1>

            <p className="hero-sub text-base md:text-lg text-white/70 max-w-xl leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] mb-6">
              Your premium companion for the most revolutionary season in Formula 1 history.
              Track every race, build your garage, log your season.
            </p>
            <div className="hero-cta pointer-events-auto">
              <Link
                to="/experience"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-black font-mono font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/20 hover:shadow-primary/40 cursor-pointer"
              >
                <span>Launch 3D WebGL Experience</span>
                <Gamepad2 size={14} className="animate-pulse" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COUNTDOWN CARD ══════ */}
      <section className="countdown-card">
        <div className="glass-panel rounded-xl overflow-hidden">
          {/* Scan line accent */}
          <div className="h-[2px] bg-linear-to-r from-transparent via-primary to-transparent opacity-40" />

          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: Race info */}
            <div className="flex items-center gap-5">
              <div className="shrink-0 w-14 h-14 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
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
              <div className="shrink-0 w-10 h-10 rounded-md bg-white/4 border border-white/6 flex items-center justify-center">
                <span className="text-xs font-mono font-bold text-on-surface-muted">
                  R{race.round.toString().padStart(2, '0')}
                </span>
              </div>

              {/* Flag + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl shrink-0">{race.country}</span>
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
              <div className="hidden md:block text-right shrink-0 w-28">
                <p className="text-xs font-mono text-on-surface-muted">
                  {new Date(race.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </p>
              </div>

              {/* Arrow */}
              <ArrowRight size={16} className="text-on-surface-muted/40 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══════ ALBUM SECTION ══════ */}
      <section className="relative overflow-hidden mt-12 mb-10">
        <ContainerStagger className="relative z-10 px-6 pt-12 text-center flex flex-col items-center mb-8">
          <ContainerAnimated>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Camera size={14} className="text-primary animate-pulse" />
              <span className="text-[10px] font-mono text-primary tracking-[0.15em] uppercase">
                Pitlane Moments
              </span>
            </div>
          </ContainerAnimated>
          <ContainerAnimated>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-2">
              Season <span className="bg-linear-to-r from-primary to-primary-soft bg-clip-text text-transparent">Album</span>
            </h2>
          </ContainerAnimated>
          <ContainerAnimated>
            <p className="text-sm text-on-surface-muted max-w-xl leading-relaxed mb-6">
              Experience the intensity, speed, and drama of the 2026 Season through our lens. Hover and scroll or drag the grid infinitely to explore.
            </p>
          </ContainerAnimated>

          {/* Segmented Cockpit Viewport Variant Selector */}
          <ContainerAnimated>
            <div className="inline-flex bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-2xl">
              {(['default', 'masonry', 'polaroid'] as const).map((variant) => (
                <button
                  key={variant}
                  onClick={() => setAlbumVariant(variant)}
                  className={cn(
                    "px-5 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer",
                    albumVariant === variant
                      ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105 font-black"
                      : "text-on-surface-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  {variant}
                </button>
              ))}
            </div>
          </ContainerAnimated>
        </ContainerStagger>

        {/* Ambient background glow matching the F1 premium aesthetic */}
        <div 
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-0 z-0 h-[600px] w-[800px] opacity-15"
          style={{
            background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
            filter: "blur(90px)",
            mixBlendMode: "screen",
          }}
        />

        {/* Fullscreen Draggable Gallery Frame */}
        <div className="relative w-full h-[65vh] md:h-[75vh] rounded-2xl overflow-hidden border border-white/5 bg-surface-base/80 shadow-3xl">
          {/* High-tech UI overlay frames */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1 font-mono text-[9px] md:text-[10px] text-primary/70">
            <span>GRID_STATUS: ACTIVE</span>
            <span>LAYOUT: {albumVariant.toUpperCase()}</span>
          </div>
          <div className="absolute bottom-4 right-4 z-10 pointer-events-none font-mono text-[9px] md:text-[10px] text-on-surface-muted/50 uppercase tracking-wider">
            DRAG TO PAN CANVAS • WHEEL SCROLL TO ZOOM/SLIDE
          </div>

          <DraggableContainer variant={albumVariant} className="gap-8 p-4">
            <GridBody>
              {ALL_ALBUM_IMAGES.map((img) => (
                <GridItem key={img.id} className="relative w-[150px] h-[200px] md:w-[260px] md:h-[340px] flex items-center justify-center">
                  {albumVariant === 'polaroid' ? (
                    <div className="w-full h-full p-2 bg-white text-black shadow-2xl flex flex-col justify-between select-none">
                      <div className="w-full h-[84%] overflow-hidden bg-neutral-900">
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                        />
                      </div>
                      <div className="h-[16%] flex items-center justify-center font-mono text-[8px] md:text-[10px] font-bold text-neutral-800 tracking-wider">
                        PITLANE_2026 // #{img.id.toString().padStart(2, '0')}
                      </div>
                    </div>
                  ) : (
                    <div className="group relative w-full h-full overflow-hidden rounded-xl border border-white/10 bg-neutral-950/40 backdrop-blur-xs shadow-lg transition-all duration-300 select-none">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 pointer-events-none"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                        <span className="text-[10px] font-mono text-primary tracking-widest uppercase">FRAME #{img.id.toString().padStart(2, '0')}</span>
                        <h4 className="text-xs font-bold text-white uppercase tracking-tight mt-0.5">{img.alt}</h4>
                      </div>
                    </div>
                  )}
                </GridItem>
              ))}
            </GridBody>
          </DraggableContainer>
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
          : 'bg-white/4 text-white border border-white/6'
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
    <div className="stat-card glass-panel-solid rounded-lg p-4 md:p-5 flex flex-col gap-3 border border-white/4 hover:border-white/8 transition-colors">
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
