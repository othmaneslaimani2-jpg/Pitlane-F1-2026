import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const KEY_NAMES = {
  8: 'Backspace', 9: 'Tab', 13: 'Enter', 16: 'Shift', 17: 'Ctrl', 18: 'Alt',
  20: 'CapsLock', 27: 'Esc', 32: 'Space', 33: 'PgUp', 34: 'PgDn',
  35: 'End', 36: 'Home', 37: '←', 38: '↑', 39: '→', 40: '↓',
  45: 'Ins', 46: 'Del', 186: ';', 187: '=', 188: ',', 189: '-',
  190: '.', 191: '/', 192: '`', 219: '[', 220: '\\', 221: ']', 222: "'",
};

export function getKeyName(code) {
  if (KEY_NAMES[code]) return KEY_NAMES[code];
  if (code >= 65 && code <= 90) return String.fromCharCode(code);
  if (code >= 48 && code <= 57) return String.fromCharCode(code);
  if (code >= 96 && code <= 105) return 'Num' + (code - 96);
  if (code >= 112 && code <= 123) return 'F' + (code - 111);
  return 'Key' + code;
}

export const DEFAULT_BINDINGS = {
  accelerate: 38,
  brake: 40,
  left: 37,
  right: 39,
  handbrake: 32,
};

const STORAGE_KEY = 'helloracer_keys';

const KeyBindingsContext = createContext(null);

export function KeyBindingsProvider({ children }) {
  const [bindings, setBindings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_BINDINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return { ...DEFAULT_BINDINGS };
  });

  // Always-current ref (for the legacy engine to read inside its key handler)
  const bindingsRef = useRef(bindings);
  useEffect(() => { bindingsRef.current = bindings; }, [bindings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
    } catch (e) {}
  }, [bindings]);

  const updateBinding = useCallback((action, code) => {
    setBindings((prev) => ({ ...prev, [action]: code }));
  }, []);

  const reset = useCallback(() => {
    setBindings({ ...DEFAULT_BINDINGS });
  }, []);

  return (
    <KeyBindingsContext.Provider value={{ bindings, bindingsRef, updateBinding, reset }}>
      {children}
    </KeyBindingsContext.Provider>
  );
}

export function useKeyBindings() {
  const ctx = useContext(KeyBindingsContext);
  if (!ctx) throw new Error('useKeyBindings must be inside KeyBindingsProvider');
  return ctx;
}
