// Where on its screen a move is made: the part that is tapped, found inside
// that screen's live thumbnail. The flow view starts each arrow there, as a
// design tool's prototype arrows start at the button, not at the screen's edge.
//
// A move names its part with `tap` (a selector, prototype.json); without one
// it is the first clickable part whose words are the move's label.

const CLICKABLE = 'button, a, [role="button"], [role="link"], [role="tab"]';
const words = text => String(text ?? '').trim().toLowerCase();

function tappedPart(doc, move) {
  if (move.tap) return doc.querySelector(move.tap);
  if (!move.label) return null;
  return [...doc.querySelectorAll(CLICKABLE)].find(el => words(el.textContent) === words(move.label)) ?? null;
}

/**
 * The tapped part's box inside a thumbnail, in the thumbnail's own (scaled)
 * pixels; null while the thumbnail is still loading, or when the part isn't
 * there or sits below the first screenful.
 */
export function tappedBox(frame, move, scale) {
  try {
    const part = tappedPart(frame.contentDocument, move);
    const r = part?.getBoundingClientRect();
    if (!r || !r.width || !r.height || r.top < 0 || r.bottom > frame.contentWindow.innerHeight) return null;
    return { x: r.left * scale, y: r.top * scale, w: r.width * scale, h: r.height * scale };
  } catch {
    return null;
  }
}
