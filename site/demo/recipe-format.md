---
title: Recipe Format
summary: "Recipes live in recipes/<course>/ with time, servings, and effort in the front matter, and get their own filterable section."
tags: [docs, recipes, cooking]
created: 2026-10-27
updated: 2026-10-28
---

Recipes are notes with a few extra rules. They live in folders by course: `recipes/soups/tomato-soup.md`. [The Recipes page](/recipes/) groups them by course and filters them by name or tag, time, and effort.

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

- The **first tag** is the course, matching the folder. The rest are filter tags.
- **`total_minutes`**, **`servings`**, and **`effort`** (low, medium, or high) become the facts line under the title, and power the filters.

## The body

An "Instructions" section of numbered steps, with each ingredient and its amount in bold where it's used, so there's no separate ingredient list to keep in sync. Footnotes hold the asides. See [Tomato Soup](recipes/soups/tomato-soup.md) and [Sheet Pan Chickpeas](recipes/entrees/sheet-pan-chickpeas.md).
