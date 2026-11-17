// Esc closes one thing at a time: whatever is on top. This runs before every
// other script on the page, so it is the first to hear the key and the only
// one to act on it: Marcus's page would otherwise take Esc for its own
// all-screens view, which the shell replaces.
//
// A part that can be closed registers a taker: presentEscape.add(priority,
// take). On Esc the takers are asked from the highest priority down, and the
// first whose take() returns true has dealt with it.

window.presentEscape = (() => {
  const takers = [];
  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    e.stopImmediatePropagation();
    for (const { take } of [...takers]) if (take()) return;
  }, true);
  return {
    /** Returns a function that takes the taker away again. */
    add(priority, take) {
      const taker = { priority, take };
      takers.push(taker);
      takers.sort((a, b) => b.priority - a.priority);
      return () => {
        const at = takers.indexOf(taker);
        if (at >= 0) takers.splice(at, 1);
      };
    },
  };
})();
