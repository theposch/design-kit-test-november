import { Button } from '@repo/ui';
import { useState } from 'react';

export function App() {
  const [dark, setDark] = useState(false);

  const toggleMode = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6">
      <h1 className="type-heading-2 text-foreground">__NAME__</h1>
      <p className="type-body-base text-muted-foreground">
        Tokens and components from @repo/ui, ready to riff on.
      </p>
      <Button onClick={toggleMode}>
        {dark ? 'Switch to light' : 'Switch to dark'}
      </Button>
    </main>
  );
}
