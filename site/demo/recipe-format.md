---
title: Recipe Format
summary: "My recipes live in recipes/<course>/ with time, servings, and effort in the front matter, and get their own filterable section."
tags: [docs, recipes, cooking]
created: 2026-10-27
updated: 2026-10-28
---

My recipes are notes with a few extra rules. They live in folders by course, like `recipes/soups/tomato-soup.md`. [The Recipes page](/recipes/) groups them by course and lets me filter by name or tag, time, and effort, which is how I actually pick what to cook.

## Front matter

```yaml
---
title: Tomato Soup
created: 2026-10-27
tags: [soups, vegetarian, pantry]
total_minutes: 35
servings: 4
effort: low
---
```

- The **first tag** is the course, and it matches the folder. The rest are tags for the filters.
- **`total_minutes`**, **`servings`**, and **`effort`** (low, medium, or high) become the facts line under the title, and they're what the filters use.

## The body

Each recipe has an "Instructions" section of numbered steps, with each ingredient and its amount in bold where it's used. That way there's no separate ingredient list for me to keep in sync. Footnotes hold the asides. See [Tomato Soup](recipes/soups/tomato-soup.md) and [Sheet Pan Chickpeas](recipes/entrees/sheet-pan-chickpeas.md).
