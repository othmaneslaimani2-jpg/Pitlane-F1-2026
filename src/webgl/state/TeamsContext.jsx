import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// =====================================================================
// Team definitions — texture paths for each F1 team
// =====================================================================
export const TEAMS = {
  ferrari: {
    id: 'ferrari',
    name: 'Scuderia Ferrari',
    short: 'Ferrari',
    color: '#dc0000',
    accent: '#fff200',
    logo: '/obj/textures/Teams Logos/Ferrari.png',
    textures: {
      bodyPaint: '/obj/textures/BodyPaint/BodyPaintFerrari.jpg',
      driver:    '/obj/textures/Driver/FerrariDriver.jpg',
      helmet:    '/obj/textures/Helmet/FerrariHelmet.jpg',
    },
  },
  redbull: {
    id: 'redbull',
    name: 'Oracle Red Bull Racing',
    short: 'Red Bull',
    color: '#1e3a8a',
    accent: '#ff1e1e',
    logo: '/obj/textures/Teams Logos/Red_Bull_Racing_2022.png',
    textures: {
      bodyPaint: '/obj/textures/BodyPaint/RedBull_Livery_V2.jpg',
      driver:    '/obj/textures/Driver/RedBull_Driver_Livery.jpg',
      helmet:    '/obj/textures/Helmet/RedbullHelmet.jpg',
    },
  },
  mercedes: {
    id: 'mercedes',
    name: 'Mercedes-AMG Petronas',
    short: 'Mercedes',
    color: '#00d2be',
    accent: '#000000',
    logo: '/obj/textures/Teams Logos/Mercedes-AMG_Petronas_F1_Team_logo_(2026).svg.png',
    textures: {
      bodyPaint: '/obj/textures/BodyPaint/Mercedes_Livery_HighFidelity.jpg',
      driver:    '/obj/textures/Driver/Mercedes_Driver_Livery.jpg',
      helmet:    '/obj/textures/Helmet/MercedesHelmet.jpg',
    },
  },
};

// Default fallback uses the original textures shipped with the project
export const DEFAULT_TEAM = {
  id: 'default',
  name: 'Default Livery',
  short: 'Default',
  color: '#888888',
  accent: '#aaaaaa',
  logo: null,
  textures: {
    bodyPaint: '/obj/textures/BodyPaint.jpg',
    driver:    '/obj/textures/Driver.jpg',
    helmet:    '/obj/textures/Helmet.jpg',
  },
};

const STORAGE_KEY = 'helloracer_team';
const TeamsContext = createContext(null);

export function TeamsProvider({ children }) {
  const [teamId, setTeamId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (TEAMS[saved] || saved === 'default')) return saved;
    } catch (e) {}
    return 'default';
  });

  const team = getTeam(teamId);

  // Keep a ref in sync with the current team. Doing this assignment
  // during render (not in an effect) guarantees that any component
  // reading teamRef.current inside its own useEffect — which fires
  // bottom-up, before the provider's useEffect — sees the new value.
  const teamRef = useRef(team);
  teamRef.current = team;

  // Persist selection to localStorage (side-effect, fine in useEffect)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, teamId); } catch (e) {}
  }, [teamId]);

  const selectTeam = useCallback((id) => setTeamId(id), []);

  return (
    <TeamsContext.Provider value={{ teamId, team, teamRef, selectTeam }}>
      {children}
    </TeamsContext.Provider>
  );
}

function getTeam(id) {
  if (id === 'default') return DEFAULT_TEAM;
  return TEAMS[id] || DEFAULT_TEAM;
}

export function useTeams() {
  const ctx = useContext(TeamsContext);
  if (!ctx) throw new Error('useTeams must be inside TeamsProvider');
  return ctx;
}
