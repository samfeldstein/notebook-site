// The header's back button leaves the page: it goes back to the last page of this site, skipping
// moves within the page (a letter of the A to Z list, a contents entry). With nothing of this site
// to go back to, it follows its link up to the list the page belongs to. The server sends no
// referrer, so "something to go back to" comes from the navigation history where the browser keeps
// one, or from a flag each page leaves in the tab's session storage. The trip itself is always the
// browser's own back, repeated past moves within the page, because Safari's navigation history can
// be incomplete and a jump chosen from it landed on the wrong page.
const back = document.querySelector('.back');
const page = (url) => { const u = new URL(url); u.hash = ''; return u.href; };
let seen = false;
try {
  seen = sessionStorage.getItem('seen') === '1';
  sessionStorage.setItem('seen', '1');
} catch {}

const nav = window.navigation;
const canGoBack = () => seen || (nav?.currentEntry?.index ?? 0) > 0;

// The page being left, while backing out of moves within it.
let leaving = null;
addEventListener('popstate', () => {
  if (leaving && page(location.href) === leaving) history.back();
  else leaving = null;
});

back?.addEventListener('click', (e) => {
  if (!canGoBack()) return;
  e.preventDefault();
  leaving = page(location.href);
  history.back();
});
