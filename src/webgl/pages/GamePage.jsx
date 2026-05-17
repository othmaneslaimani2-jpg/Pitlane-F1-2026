import React, { useEffect, useRef, useState } from 'react';
import { useKeyBindings } from '../state/KeyBindingsContext.jsx';
import { useTeams } from '../state/TeamsContext.jsx';
import { createRacingEngine } from '../engine/racingEngine.js';
import GameSettings from './GameSettings.jsx';
import './GamePage.css';

const CAMERA_NAMES = ['BROADCAST', 'CINEMATIC', 'COCKPIT', 'TOP DOWN', 'SIDE'];
const MAX_SPEED_DISPLAY = 320;

export default function GamePage({ onBack }) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const { bindingsRef } = useKeyBindings();
  const { teamRef, team } = useTeams();

  const [hud, setHud] = useState({
    speedKmh: 0,
    cameraName: 'BROADCAST',
    cameraIndex: 0,
    throttle: false,
    brake: false,
    handbrake: false,
    steerLeft: false,
    steerRight: false,
    stopped: true,
  });

  // Audio settings — persisted only for the lifetime of the page
  const [muted, setMuted] = useState(false);
  const [engineVolume, setEngineVolume] = useState(0.85);
  const [crowdVolume, setCrowdVolume] = useState(0.7);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = createRacingEngine({
      container: containerRef.current,
      bindingsRef,
      teamRef,
      onHudUpdate: setHud,
    });
    engineRef.current = engine;

    // Push initial volume values into the engine
    engine.setEngineVolume(engineVolume);
    engine.setCrowdVolume(crowdVolume);
    engine.setMuted(muted);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindingsRef, teamRef, team.id]);

  const setCamera = (index) => engineRef.current?.setCameraMode(index);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.setMuted(next);
  };

  const handleEngineVolume = (v) => {
    setEngineVolume(v);
    engineRef.current?.setEngineVolume(v);
  };

  const handleCrowdVolume = (v) => {
    setCrowdVolume(v);
    engineRef.current?.setCrowdVolume(v);
  };

  const speedPct = Math.min(100, (hud.speedKmh / MAX_SPEED_DISPLAY) * 100);
  const throttleLevel = hud.throttle ? 100 : 0;
  const brakeLevel = hud.brake || hud.handbrake ? 100 : 0;

  return (
    <div className="game-page">
      <div ref={containerRef} className="game-canvas-container" />

      {/* TOP BAR */}
      <div className="g-topbar">
        <button className="g-back-btn" onClick={onBack}>
          <span aria-hidden>←</span>
          <span>Menu</span>
        </button>

        {team.id !== 'default' && (
          <div className="g-team-pill" style={{ '--team-color': team.color }}>
            <img src={team.logo} alt={team.name} className="g-team-pill-logo" />
            <span className="g-team-pill-name">{team.short.toUpperCase()}</span>
          </div>
        )}

        <div className="g-mute-row">
          <button
            className={`g-icon-btn ${muted ? 'is-off' : 'is-on'}`}
            onClick={toggleMute}
            title={muted ? 'Unmute audio' : 'Mute audio'}
          >
            <span className="g-icon">{muted ? '🔇' : '🔊'}</span>
          </button>
          <button
            className="g-icon-btn"
            onClick={() => setShowSettings(true)}
            title="Audio settings"
          >
            <span className="g-icon">⚙</span>
          </button>
        </div>
      </div>

      {/* CAMERA RAIL (right side) */}
      <div className="g-camera-rail">
        <div className="g-rail-label">CAMERA</div>
        <div className="g-rail-list">
          {CAMERA_NAMES.map((name, i) => (
            <button
              key={name}
              className={`g-rail-item ${i === hud.cameraIndex ? 'is-active' : ''}`}
              onClick={() => setCamera(i)}
            >
              <span className="g-rail-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="g-rail-name">{name}</span>
            </button>
          ))}
        </div>
        <div className="g-rail-hint"><kbd>R</kbd> to cycle</div>
      </div>

      {/* SPEEDOMETER (bottom-left) */}
      <div className="g-speedo">
        <div className="g-speedo-row">
          <span className="g-speedo-value">{hud.speedKmh}</span>
          <span className="g-speedo-unit">KM/H</span>
        </div>
        <div className="g-speedo-bar">
          <div className="g-speedo-fill" style={{ width: `${speedPct}%` }} />
          <div className="g-speedo-ticks">
            {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
          </div>
        </div>
        <div className="g-speedo-foot">
          <span>0</span><span>{MAX_SPEED_DISPLAY}</span>
        </div>
      </div>

      {/* INPUT KEYPAD (bottom-right) */}
      <div className="g-inputs">
        <div className="g-inputs-title">INPUT</div>
        <div className="g-keypad">
          <div className={`g-key g-key-up ${hud.throttle ? 'is-active' : ''}`}>↑</div>
          <div className={`g-key g-key-left ${hud.steerLeft ? 'is-active' : ''}`}>←</div>
          <div className={`g-key g-key-right ${hud.steerRight ? 'is-active' : ''}`}>→</div>
          <div className={`g-key g-key-down ${hud.brake ? 'is-active' : ''}`}>↓</div>
          <div className={`g-key g-key-space ${hud.handbrake ? 'is-active' : ''}`}>SPACE</div>
        </div>
      </div>

      {/* PEDAL BARS (bottom-center) */}
      <div className="g-pedals">
        <div className="g-pedal">
          <div className="g-pedal-label">THROTTLE</div>
          <div className="g-pedal-bar">
            <div className="g-pedal-fill g-pedal-throttle" style={{ width: `${throttleLevel}%` }} />
          </div>
        </div>
        <div className="g-pedal">
          <div className="g-pedal-label">BRAKE</div>
          <div className="g-pedal-bar">
            <div className="g-pedal-fill g-pedal-brake" style={{ width: `${brakeLevel}%` }} />
          </div>
        </div>
      </div>

      {/* STATUS PILL (when stopped) */}
      {hud.stopped && (
        <div className="g-status-pill">
          <span className="g-status-dot" />
          <span>STATIONARY · Drag mouse to orbit</span>
        </div>
      )}

      {/* AUDIO SETTINGS MODAL */}
      {showSettings && (
        <GameSettings
          engineVolume={engineVolume}
          crowdVolume={crowdVolume}
          muted={muted}
          onEngineChange={handleEngineVolume}
          onCrowdChange={handleCrowdVolume}
          onToggleMute={toggleMute}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
