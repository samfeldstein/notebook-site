// Filters a list as you type. Items are [data-item] elements inside [data-group] sections; a section
// with nothing left showing is hidden. On the recipes page, the tag, time, and effort menus filter
// too, and ?tag= in the address picks a tag (recipe pages link their tags that way).
const input = document.querySelector('[data-filter]');
const form = document.querySelector('[data-filters]');
const items = [...document.querySelectorAll('[data-item]')];
const groups = [...document.querySelectorAll('[data-group]')];
const none = document.querySelector('.none');
const az = document.querySelector('.az');

const tag = new URLSearchParams(location.search).get('tag');
if (form && tag) form.elements.tag.value = tag;

function apply() {
  const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
  const f = form?.elements;
  let shown = 0;
  for (const item of items) {
    const d = item.dataset;
    const ok =
      words.every((w) => d.text.includes(w)) &&
      (!f?.tag.value || d.tags.split(' ').includes(f.tag.value)) &&
      (!f?.minutes.value || (d.minutes && Number(d.minutes) <= Number(f.minutes.value))) &&
      (!f?.effort.value || d.effort === f.effort.value);
    item.hidden = !ok;
    if (ok) shown++;
  }
  for (const g of groups) g.hidden = !g.querySelector('[data-item]:not([hidden])');
  // The notes index's A to Z row: letters whose section is hidden can't be jumped to.
  if (az) for (const a of az.querySelectorAll('a')) a.toggleAttribute('aria-disabled', !!document.querySelector(`${a.hash}`)?.closest('[data-group]')?.hidden);
  if (none) none.hidden = shown > 0;
}

input.addEventListener('input', apply);
form?.addEventListener('change', apply);
form?.addEventListener('submit', (e) => e.preventDefault());
apply();
