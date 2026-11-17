/*
 * Sorts a changed photo into the kind of change it shows, so a report of 500
 * changes after a palette tweak can be read as "490 colour only, 10 layout".
 *
 *   size    the photo's size changed: something grew, shrank or wrapped
 *   colour  the same shapes in the same places, in different colours
 *   layout  shapes moved, appeared or disappeared
 *
 * "Same shapes" is judged on edges: where brightness steps sharply between
 * neighbouring pixels. A colour change moves no edges; a layout change does.
 */

const EDGE_STEP = 10;
const SHIFT_TOLERANCE = 1;
const MAX_MOVED_SHARE = 0.02;

function brightness(data, width, height) {
  const out = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const a = data[i * 4 + 3] / 255;
    /* Transparent padding reads as white, like the page behind a story. */
    const mix = (v) => v * a + 255 * (1 - a);
    out[i] =
      0.299 * mix(data[i * 4]) +
      0.587 * mix(data[i * 4 + 1]) +
      0.114 * mix(data[i * 4 + 2]);
  }
  return out;
}

export function edges(data, width, height) {
  const light = brightness(data, width, height);
  const map = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const right = x + 1 < width ? Math.abs(light[i] - light[i + 1]) : 0;
      const down = y + 1 < height ? Math.abs(light[i] - light[i + width]) : 0;
      if (Math.max(right, down) >= EDGE_STEP) map[i] = 1;
    }
  }
  return map;
}

function near(map, width, height, x, y) {
  for (let dy = -SHIFT_TOLERANCE; dy <= SHIFT_TOLERANCE; dy += 1) {
    for (let dx = -SHIFT_TOLERANCE; dx <= SHIFT_TOLERANCE; dx += 1) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
        if (map[ny * width + nx]) return true;
      }
    }
  }
  return false;
}

/* Edges in one map with no edge within a pixel of them in the other. */
function moved(a, b, width, height) {
  let lost = 0;
  let total = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!a[y * width + x]) continue;
      total += 1;
      if (!near(b, width, height, x, y)) lost += 1;
    }
  }
  return { lost, total };
}

/* before and after: { data, width, height } with RGBA data, as pngjs reads them. */
export function changeKind(before, after) {
  if (before.width !== after.width || before.height !== after.height)
    return 'size';
  const { width, height } = before;
  const a = edges(before.data, width, height);
  const b = edges(after.data, width, height);
  const gone = moved(a, b, width, height);
  const came = moved(b, a, width, height);
  const total = Math.max(gone.total, came.total, 1);
  return (gone.lost + came.lost) / total <= MAX_MOVED_SHARE
    ? 'colour'
    : 'layout';
}

export const KIND_LABELS = {
  layout: 'Layout changed',
  size: 'Size changed',
  colour: 'Colour only',
};
