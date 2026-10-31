// The header's back button leaves the page: it goes back to the last page of this site, skipping
// moves within the page (a letter of the A to Z list, a contents entry). With nothing of this site
// to go back to, it follows its link up to the list the page belongs to. The server sends no
// referrer, so the previous page is known from the navigation history, or, in browsers without
// one, from a flag each page leaves in the tab's session storage.
const back = document.querySelector('.back');
const page = (url) => { const u = new URL(url); u.hash = ''; return u.href; };
let seen = false;
try {
  seen = sessionStorage.getItem('seen') === '1';
  sessionStorage.setItem('seen', '1');
} catch {}

function previous() {
  const nav = window.navigation;
  if (!nav) return seen ? () => history.back() : null;
  const entries = nav.entries();
  for (let i = nav.currentEntry.index - 1; i >= 0; i--) {
    const entry = entries[i];
    if (new URL(entry.url).origin === location.origin && page(entry.url) !== page(location.href)) return () => nav.traverseTo(entry.key);
  }
  return null;
}

back?.addEventListener('click', (e) => {
  const go = previous();
  if (!go) return;
  e.preventDefault();
  go();
});
