// A note's contents. On wide screens it sits in a side column (see site.css), where it stays open
// and marks the section being read, scrolling itself (never the page) to keep that entry in view.
// On narrow screens it goes back to how the page built it. "Wide" means the stylesheet made the
// contents sticky, so the breakpoint lives in one place.
const toc = document.querySelector('.toc');
const details = toc.querySelector('details');
const links = [...toc.querySelectorAll('a')];
const headings = links.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))));
const wide = { get matches() { return getComputedStyle(toc).position === 'sticky'; } };
const built = details.open;

// The current section is the last heading above the top quarter of the screen, or the last
// section once the page is scrolled to the bottom, since a short last section never reaches the line.
function mark() {
  const line = innerHeight / 4;
  const bottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  let i = bottom ? links.length - 1 : headings.findLastIndex((h) => h && h.getBoundingClientRect().top <= line);
  if (i < 0) i = 0;
  const current = links[i];
  if (current.hasAttribute('aria-current')) return;
  for (const a of links) a.removeAttribute('aria-current');
  current.setAttribute('aria-current', 'location');
  const top = current.getBoundingClientRect().top - toc.getBoundingClientRect().top + toc.scrollTop;
  if (top < toc.scrollTop || top + current.offsetHeight > toc.scrollTop + toc.clientHeight) {
    toc.scrollTop = top - toc.clientHeight / 3;
  }
}

let frame = 0;
const onScroll = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(mark);
};

let side = null;
function fit() {
  if (wide.matches === side) return;
  side = wide.matches;
  details.open = side || built;
  if (side) {
    addEventListener('scroll', onScroll, { passive: true });
    mark();
  } else {
    removeEventListener('scroll', onScroll);
    for (const a of links) a.removeAttribute('aria-current');
  }
}
addEventListener('resize', fit);
fit();
