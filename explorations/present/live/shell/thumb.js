// A small live picture of one screen: the prototype itself, opened on that
// screen and scaled down. The grid and the flow canvas both show these, so a
// screen looks the same wherever it appears.

import { h } from './dom.js';
import { engine } from './engine.js';

const SIZES = { phone: { w: 402, h: 874 }, desktop: { w: 1440, h: 900 } };

export const screenSize = proto => SIZES[proto.device === 'desktop' ? 'desktop' : 'phone'];

/** The height a thumbnail of this width has, so layouts can be worked out before any is drawn. */
export const thumbHeight = (proto, width) => Math.round(width * screenSize(proto).h / screenSize(proto).w);

// thumbnails load only once they come near the window: a long prototype has many
const loader = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const frame = entry.target;
    loader.unobserve(frame);
    frame.src = frame.dataset.src;
  }
}, { rootMargin: '400px' });

const matchTheme = frame => {
  try {
    frame.contentDocument.documentElement.classList.toggle('dark', !engine.theme.isLight());
  } catch {}
};

const matchPhone = frame => {
  try {
    engine.room(frame.contentDocument);
  } catch {}
};

export function screenThumb(proto, screen, width) {
  const size = screenSize(proto);
  const scale = width / size.w;
  const frame = h('iframe', {
    class: 'sh-thumb-frame',
    title: screen.title,
    tabindex: '-1',
    'aria-hidden': 'true',
    dataset: { src: `../${proto.name}/#${screen.id}` },
  });
  frame.style.cssText = `width:${size.w}px;height:${size.h}px;transform:scale(${scale})`;
  frame.addEventListener('load', () => {
    matchTheme(frame);
    matchPhone(frame);
    frame.classList.add('ready');
    // (for whoever draws on top of the picture: the flow view finds the tapped parts in it)
    frame.dispatchEvent(new CustomEvent('sh-thumb-ready', { bubbles: true }));
  });
  loader.observe(frame);
  const thumb = h('div', { class: 'sh-thumb' }, frame);
  thumb.style.cssText = `width:${width}px;height:${thumbHeight(proto, width)}px`;
  return thumb;
}

/** Thumbnails already on the page follow the light and dark switch. */
export function rethemeThumbs() {
  for (const frame of document.querySelectorAll('.sh-thumb-frame.ready')) matchTheme(frame);
}
