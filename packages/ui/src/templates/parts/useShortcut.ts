import { useEffect } from 'react';

/* Runs `onPress` on ⌘ plus `key` (Ctrl plus `key` on Windows and Linux). */
export function useShortcut(key: string, onPress: () => void) {
  useEffect(() => {
    function listen(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
        event.preventDefault();
        onPress();
      }
    }
    window.addEventListener('keydown', listen);
    return () => window.removeEventListener('keydown', listen);
  }, [key, onPress]);
}
