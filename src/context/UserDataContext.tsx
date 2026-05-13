import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

/* ── Types ── */
export interface Race {
  id: string;
  round: number;
  name: string;
  city: string;
  circuit: string;
  continent: string;
  country: string;
  date: string;
  type: string;
  laps: number;
  length: string;
}

interface UserDataContextType {
  garage: string[];        // Array of race IDs
  season: string[];        // Array of race IDs
  isInGarage: (id: string) => boolean;
  isInSeason: (id: string) => boolean;
  toggleGarage: (id: string) => void;
  toggleSeason: (id: string) => void;
  removeFromGarage: (id: string) => void;
  removeFromSeason: (id: string) => void;
}

const UserDataContext = createContext<UserDataContextType | null>(null);

/* ── Persistence helpers ── */
const GARAGE_KEY = 'pitlane_garage';
const SEASON_KEY = 'pitlane_season';

function loadFromStorage(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(key: string, data: string[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ── Provider ── */
export function UserDataProvider({ children }: { children: ReactNode }) {
  const [garage, setGarage] = useState<string[]>(() => loadFromStorage(GARAGE_KEY));
  const [season, setSeason] = useState<string[]>(() => loadFromStorage(SEASON_KEY));

  // Persist on change
  useEffect(() => { saveToStorage(GARAGE_KEY, garage); }, [garage]);
  useEffect(() => { saveToStorage(SEASON_KEY, season); }, [season]);

  const isInGarage = useCallback((id: string) => garage.includes(id), [garage]);
  const isInSeason = useCallback((id: string) => season.includes(id), [season]);

  const toggleGarage = useCallback((id: string) => {
    setGarage(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleSeason = useCallback((id: string) => {
    setSeason(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const removeFromGarage = useCallback((id: string) => {
    setGarage(prev => prev.filter(x => x !== id));
  }, []);

  const removeFromSeason = useCallback((id: string) => {
    setSeason(prev => prev.filter(x => x !== id));
  }, []);

  return (
    <UserDataContext.Provider value={{ garage, season, isInGarage, isInSeason, toggleGarage, toggleSeason, removeFromGarage, removeFromSeason }}>
      {children}
    </UserDataContext.Provider>
  );
}

/* ── Hook ── */
export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used inside UserDataProvider');
  return ctx;
}
