import React from 'react';
import { useTeams, TEAMS, DEFAULT_TEAM } from '../state/TeamsContext.jsx';
import './TeamsPanel.css';

const TEAM_LIST = [TEAMS.ferrari, TEAMS.redbull, TEAMS.mercedes];

export default function TeamsPanel({ onClose }) {
  const { teamId, selectTeam } = useTeams();

  const handleSelect = (id) => {
    selectTeam(id);
  };

  return (
    <div className="teams-panel" role="dialog" aria-modal="true">
      <div className="teams-card">
        <div className="teams-header">
          <h2>CHOOSE YOUR TEAM</h2>
          <p className="teams-subtitle">Select a livery to drive in</p>
        </div>

        <div className="teams-grid">
          {TEAM_LIST.map((t) => {
            const active = teamId === t.id;
            return (
              <button
                key={t.id}
                className={`team-card ${active ? 'is-active' : ''}`}
                onClick={() => handleSelect(t.id)}
                style={{ '--team-color': t.color, '--team-accent': t.accent }}
              >
                <div className="team-card-glow" />
                <div className="team-logo-wrap">
                  <img src={t.logo} alt={t.name} className="team-logo" />
                </div>
                <div className="team-meta">
                  <div className="team-short">{t.short}</div>
                  <div className="team-name">{t.name}</div>
                </div>
                {active && <div className="team-badge">SELECTED</div>}
              </button>
            );
          })}
        </div>

        <div className="teams-footer">
          <button
            className={`team-default-btn ${teamId === 'default' ? 'is-active' : ''}`}
            onClick={() => handleSelect('default')}
          >
            Use Default Livery
          </button>
          <button className="teams-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
