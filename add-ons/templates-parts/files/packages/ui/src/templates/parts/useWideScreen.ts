import { useSyncExternalStore } from 'react';

const WIDE = '(width >= 64rem)';

/* Whether the screen is desktop width, for layouts that change shape there. */
export function useWideScreen() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(WIDE).matches,
    () => true,
  );
}
