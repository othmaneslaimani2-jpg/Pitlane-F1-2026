import React, { useState, useEffect } from 'react';
import { useKeyBindings, getKeyName } from '../state/KeyBindingsContext.jsx';
import './SettingsPanel.css';

const ROWS = [
  { key: 'accelerate', label: 'Accelerate' },
  { key: 'brake', label: 'Brake / Reverse' },
  { key: 'left', label: 'Steer Left' },
  { key: 'right', label: 'Steer Right' },
  { key: 'handbrake', label: 'Handbrake' },
];

export default function SettingsPanel({ onClose }) {
  const { bindings, updateBinding, reset } = useKeyBindings();
  const [listeningFor, setListeningFor] = useState(null);

  // Capture next keypress when in "listening" mode
  useEffect(() => {
    if (!listeningFor) return;
    const handler = (e) => {
      e.preventDefault();
      updateBinding(listeningFor, e.keyCode);
      setListeningFor(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [listeningFor, updateBinding]);

  return (
    <div className="settings-panel open" role="dialog" aria-modal="true">
      <div className="settings-card">
        <h2>Controls</h2>
        {ROWS.map((row) => (
          <div className="key-row" key={row.key}>
            <label>{row.label}</label>
            <button
              className={`key-btn ${listeningFor === row.key ? 'listening' : ''}`}
              onClick={() => setListeningFor(row.key)}
            >
              {listeningFor === row.key ? '...' : getKeyName(bindings[row.key])}
            </button>
          </div>
        ))}
        <div className="settings-actions">
          <button className="btn-sm" onClick={reset}>Reset</button>
          <button className="btn-sm primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
