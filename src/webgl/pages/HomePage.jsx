import React from 'react';
import { useTeams } from '../state/TeamsContext.jsx';
import './HomePage.css';

export default function HomePage({ onStart, onOpenSettings, onOpenTeams }) {
  const { team } = useTeams();
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full px-6 py-16 overflow-hidden z-10">
      {/* Decorative animated background layers */}
      <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="home-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="home-bg-lines">
          <span /><span /><span /><span /><span />
        </div>
        {/* Subtle grid and vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#1a1a26_0%,#07070d_55%)] -z-20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_50%_50%,#000_30%,transparent_80%)] -z-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,transparent_30%,rgba(0,0,0,0.6)_100%)] -z-10" />
      </div>

      {/* Centerpiece HUD Status Card */}
      <div className="relative flex flex-col items-center justify-center p-8 md:p-10 rounded-2xl glass-panel-solid border border-white/10 max-w-lg w-full my-6 text-center bg-black/45 backdrop-blur-xl card-glow pointer-events-auto">
        {/* Subtle radial overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.03)_0%,transparent_70%)] pointer-events-none" />
        
        {/* HUD corner accents */}
        <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t border-l border-white/20 rounded-tl" />
        <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t border-r border-white/20 rounded-tr" />
        <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b border-l border-white/20 rounded-bl" />
        <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b border-r border-white/20 rounded-br" />

        {/* High-tech animated status core */}
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-dashed border-accent/50 animate-[spin_15s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full bg-accent/5 border border-accent/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" style={{ boxShadow: '0 0 10px #00ff88' }} />
          </div>
        </div>

        {/* Centerpiece Text */}
        <div className="flex flex-col gap-1 items-center justify-center">
          <span className="text-xs font-mono text-white/50 tracking-[0.25em] uppercase">SYSTEM ONLINE</span>
          <h1 className="text-3xl md:text-4xl font-black font-sans text-white tracking-wider drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] uppercase">
            SYSTEM READY
          </h1>
          <div className="w-12 h-px bg-white/10 my-2" />
          <span className="text-xs md:text-sm font-mono text-accent font-semibold tracking-[0.2em] uppercase animate-pulse">
            WEBGL ACTIVE
          </span>
        </div>

        {/* Tech Diagnostic Stats */}
        <div className="w-full border-t border-white/5 mt-6 pt-5 grid grid-cols-2 gap-x-6 gap-y-2.5 text-left font-mono text-[9px] tracking-wider text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent/60" />
            <span>CORE ENGINE: STABLE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent/60" />
            <span>RENDER FRAME: 60 FPS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent/60" />
            <span>LIVERY MAP: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-accent/60" />
            <span>INPUT BUS: ONLINE</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex gap-3 mt-10 flex-wrap justify-center">
        <div className="glass-panel-solid rounded-xl px-6 py-4 text-center border border-white/5 hover:border-primary/30 transition-colors card-glow min-w-[120px]">
          <div className="font-mono text-2xl md:text-3xl font-bold bg-linear-to-br from-white to-neutral-400 bg-clip-text text-transparent">5</div>
          <div className="text-[10px] text-on-surface-muted tracking-widest uppercase mt-1 font-mono">Camera Views</div>
        </div>
        <div className="glass-panel-solid rounded-xl px-6 py-4 text-center border border-white/5 hover:border-primary/30 transition-colors card-glow min-w-[120px]">
          <div className="font-mono text-2xl md:text-3xl font-bold bg-linear-to-br from-white to-neutral-400 bg-clip-text text-transparent">60</div>
          <div className="text-[10px] text-on-surface-muted tracking-widest uppercase mt-1 font-mono">FPS Target</div>
        </div>
        <div className="glass-panel-solid rounded-xl px-6 py-4 text-center border border-white/5 hover:border-primary/30 transition-colors card-glow min-w-[120px]">
          <div className="font-mono text-2xl md:text-3xl font-bold bg-linear-to-br from-white to-neutral-400 bg-clip-text text-transparent">∞</div>
          <div className="text-[10px] text-on-surface-muted tracking-widest uppercase mt-1 font-mono">Free Roam</div>
        </div>
      </div>

      {/* Selected team summary */}
      {team.id !== 'default' && (
        <div className="flex items-center gap-4 px-5 py-3 mt-8 bg-surface-container/80 border rounded-xl backdrop-blur-md" style={{ borderColor: team.color, boxShadow: `0 0 24px ${team.color}20` }}>
          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" />
          <div className="flex flex-col gap-0.5 text-left">
            <div className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: team.color }}>SELECTED LIVERY</div>
            <div className="text-sm font-medium text-white tracking-wide">{team.name}</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col items-center gap-4 mt-12">
        <button className="btn-primary px-10 py-4 text-[15px] tracking-[0.15em]" onClick={onStart}>
          START DRIVING <span aria-hidden className="ml-1 group-hover:translate-x-1 transition-transform inline-block">→</span>
        </button>
        <div className="flex gap-3 flex-wrap justify-center">
          <button className="btn-secondary text-[11px] px-5 py-2.5" onClick={onOpenTeams}>
            <span aria-hidden className="mr-1 text-sm">🏁</span> Choose Your Team
          </button>
          <button className="btn-secondary text-[11px] px-5 py-2.5" onClick={onOpenSettings}>
            <span aria-hidden className="mr-1 text-sm">⚙</span> Configure Controls
          </button>
        </div>
      </div>

      {/* Footer / hint strip */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-4 md:gap-6 items-center text-[10px] md:text-[11px] text-white/50 tracking-wider uppercase w-full px-4">
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 font-mono font-bold text-white bg-white/5 border border-white/10 border-b-2 rounded">R</kbd> Switch Camera
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 font-mono font-bold text-white bg-white/5 border border-white/10 border-b-2 rounded">SPACE</kbd> Handbrake
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-2 py-1 font-mono font-bold text-white bg-white/5 border border-white/10 border-b-2 rounded">↑↓←→</kbd> Drive
        </div>
      </div>
    </div>
  );
}
