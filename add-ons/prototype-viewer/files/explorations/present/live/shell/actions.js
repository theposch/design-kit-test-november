// Things the person does that save something: each says what happened, or
// that it could not be saved. Shared so every menu reports the same way.

import { engine } from './engine.js';

/**
 * Runs `work`; says `done` when it worked, and that it failed when it didn't.
 * Resolves to what the work returned (or true) when it worked, false when it failed.
 */
export async function saving(work, done) {
  try {
    const result = await work();
    if (done) engine.toast(done);
    return result ?? true;
  } catch {
    engine.toast('Could not save. Try again');
    return false;
  }
}

/** Shows a prototype to the client, or hides it. */
export function setShown(name, on) {
  const api = engine.prototypes();
  // (on Sites, the prototype's own access follows once Claude syncs it)
  const said = `${on ? 'Shown to the client' : 'Hidden from the client'}${api.online() ? '. Ask Claude to sync client access' : ''}`;
  return saving(() => api.setShown(name, on), said);
}
