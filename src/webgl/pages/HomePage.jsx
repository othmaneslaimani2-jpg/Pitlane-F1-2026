import React from 'react';
import { useTeams } from '../state/TeamsContext.jsx';
import './HomePage.css';

export default function HomePage({ onStart, onOpenSettings, onOpenTeams }) {
  const { team } = useTeams();
  return (
    <div className="home-page">
      {/* Decorative animated background layers */}
      <div className="home-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      <div className="home-bg-lines">
        <span /><span /><span /><span /><span />
      </div>



      {/* Status badge */}
      <div className="home-badge">
        <span className="home-dot" />
        <span>System Ready</span>
        <span className="home-badge-sep" />
        <span>WebGL Active</span>
      </div>

      {/* Title with decorative chrome */}
      <div className="home-title-wrap">
        <span className="title-tag">F1 SIMULATION</span>
        <h1 className="home-title">
          <span className="title-row">PITLANE</span>
          <span className="title-row title-row-accent">FORMULA 1</span>
        </h1>
        <p className="home-subtitle">Drive · Drift · Dominate</p>
      </div>

      {/* Stat / feature pills */}
      <div className="home-stats">
        <div className="stat-card">
          <div className="stat-value">5</div>
          <div className="stat-label">Camera Views</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">60</div>
          <div className="stat-label">FPS Target</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">∞</div>
          <div className="stat-label">Free Roam</div>
        </div>
      </div>

      {/* Selected team summary */}
      {team.id !== 'default' && (
        <div className="home-team-summary" style={{ '--team-color': team.color }}>
          <img src={team.logo} alt={team.name} className="home-team-summary-logo" />
          <div className="home-team-summary-text">
            <div className="home-team-summary-label">SELECTED LIVERY</div>
            <div className="home-team-summary-name">{team.name}</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="home-actions">
        <button className="btn-drive" onClick={onStart}>
          <span className="btn-drive-glow" />
          <span className="btn-drive-text">START DRIVING</span>
          <span className="btn-drive-arrow" aria-hidden>→</span>
        </button>
        <div className="home-actions-row">
          <button className="btn-team" onClick={onOpenTeams}>
            <span className="btn-team-icon" aria-hidden>🏁</span>
            <span>Choose Your Team</span>
          </button>
          <button className="btn-settings" onClick={onOpenSettings}>
            <span className="btn-settings-icon" aria-hidden>⚙</span>
            <span>Configure Controls</span>
          </button>
        </div>
      </div>

      {/* Footer / hint strip */}
      <div className="home-footer">
        <div className="footer-key"><kbd>R</kbd> Switch Camera</div>
        <div className="footer-key"><kbd>SPACE</kbd> Handbrake</div>
        <div className="footer-key"><kbd>↑↓←→</kbd> Drive</div>
      </div>
    </div>
  );
}
