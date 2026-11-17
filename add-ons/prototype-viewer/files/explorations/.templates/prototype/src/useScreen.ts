import { useEffect, useState } from 'react';

import about from '../prototype.json';

/*
 * The screen to show comes from the address (#home, #profile…), so the
 * prototype viewer can open any screen directly and follow along when you
 * tap through. The first screen in prototype.json is the default.
 */
const first = about.screens[0].id;
const fromHash = () => window.location.hash.slice(1) || first;

export function useScreen() {
  const [screen, setScreen] = useState(fromHash);
  useEffect(() => {
    const update = () => setScreen(fromHash());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const go = (id: string) => {
    window.location.hash = id;
  };
  return [screen, go] as const;
}
