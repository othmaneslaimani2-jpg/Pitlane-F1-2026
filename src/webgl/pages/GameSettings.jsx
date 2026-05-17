import React from 'react';
import './GameSettings.css';

export default function GameSettings({
  onClose,
  engineVolume,
  crowdVolume,
  onEngineChange,
  onCrowdChange,
  muted,
  onToggleMute,
}) {
  return (
    <div className="gs-overlay" role="dialog" aria-modal="true">
      <div className="gs-card">
        <div className="gs-header">
          <h2>AUDIO SETTINGS</h2>
          <p className="gs-subtitle">Tune engine and crowd volume</p>
        </div>

        <div className="gs-row">
          <div className="gs-row-head">
            <span className="gs-row-label">
              <span className="gs-row-icon" aria-hidden>🏎</span>
              <span>Engine Volume</span>
            </span>
            <span className="gs-row-value">{Math.round(engineVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(engineVolume * 100)}
            onChange={(e) => onEngineChange(Number(e.target.value) / 100)}
            className="gs-slider gs-slider-engine"
          />
        </div>

        <div className="gs-row">
          <div className="gs-row-head">
            <span className="gs-row-label">
              <span className="gs-row-icon" aria-hidden>📣</span>
              <span>Crowd Volume</span>
            </span>
            <span className="gs-row-value">{Math.round(crowdVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(crowdVolume * 100)}
            onChange={(e) => onCrowdChange(Number(e.target.value) / 100)}
            className="gs-slider gs-slider-crowd"
          />
        </div>

        <div className="gs-mute-row">
          <button
            className={`gs-mute-btn ${muted ? 'is-muted' : ''}`}
            onClick={onToggleMute}
          >
            <span aria-hidden>{muted ? '🔇' : '🔊'}</span>
            <span>{muted ? 'Audio Muted' : 'Audio Enabled'}</span>
          </button>
        </div>

        <div className="gs-actions">
          <button className="gs-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
