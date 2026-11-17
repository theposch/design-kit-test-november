/*
 * The one keyboard focus indicator. Components compose these instead of
 * spelling the ring out, so the ring is tuned in one place; lint rejects a
 * hand-written `focus-visible:ring-*` anywhere else. `focus-visible`, never
 * `focus`: a mouse click must not draw the ring.
 */
export const focusRing = 'focus-visible:ring-3 focus-visible:ring-ring';

/* For bordered controls, whose border also shifts to the ring colour. */
export const focusRingBordered =
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring';

/*
 * For a part that wraps the focusable element, like the slider thumb around
 * its hidden range input.
 */
export const focusRingWithin =
  'has-focus-visible:ring-3 has-focus-visible:ring-ring';
