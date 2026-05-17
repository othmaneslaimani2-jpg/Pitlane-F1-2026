import React, { useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import SettingsPanel from './pages/SettingsPanel.jsx';
import TeamsPanel from './pages/TeamsPanel.jsx';
import GamePage from './pages/GamePage.jsx';
import { KeyBindingsProvider } from './state/KeyBindingsContext.jsx';
import { TeamsProvider } from './state/TeamsContext.jsx';

export default function App() {
  // Once "started" becomes true we keep the GamePage mounted for the
  // rest of the session. Going back to the home menu just hides it,
  // so the car's position, speed, and audio context are preserved
  // until the user refreshes the page.
  const [started, setStarted] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'game'

  const [showSettings, setShowSettings] = useState(false);
  const [showTeams, setShowTeams] = useState(false);

  const handleStart = () => {
    setStarted(true);
    setView('game');
  };

  const handleBackToHome = () => {
    setView('home');
  };

  return (
    <KeyBindingsProvider>
      <TeamsProvider>
        <div style={{ display: view === 'home' ? 'block' : 'none' }}>
          <HomePage
            onStart={handleStart}
            onOpenSettings={() => setShowSettings(true)}
            onOpenTeams={() => setShowTeams(true)}
          />
        </div>

        {/* Once started, keep GamePage mounted across all navigation so
            the car's state is preserved until a page refresh. */}
        {started && (
          <div style={{ display: view === 'game' ? 'block' : 'none' }}>
            <GamePage onBack={handleBackToHome} />
          </div>
        )}

        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
        {showTeams && (
          <TeamsPanel onClose={() => setShowTeams(false)} />
        )}
      </TeamsProvider>
    </KeyBindingsProvider>
  );
}
