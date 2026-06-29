# Санжыра — Sary Bagysh genealogy app (prototype)

Digital version of the printed **sanjyra** (genealogy book) for the Sary Bagysh
uruu of Jalal-Abad. Web-first, mobile-first, Kyrgyz / Cyrillic. Free, read-only,
informational.

> **Status:** working clickable prototype with placeholder sample data
> (~64 invented people across 9 generations). Replace with the real family tree
> once transcribed from the book photos.

## Run it

```bash
cd sanjyra-app
npm install
npm run dev      # http://localhost:5174
```

## The three core screens

1. **Издөө (Search)** — Cyrillic-tolerant, fuzzy, partial matching. Handles
   spelling variants (ө/о, ү/у, ң/н) and Latin typing. Duplicate names are
   disambiguated by father's name + living/deceased avatar style.
2. **Адам (Person view)** — semicircular **жети-ата fan chart** (tap any wedge
   to recenter), full patronymic breadcrumb, bio, and immediate family
   (father / siblings / children / spouse).
3. **Тууганчылык (How are we related?)** — pick two people → walks both
   father-chains to the common **баба** → names the bond in Kyrgyz kinship
   terms → flags the **жети-ата** marriage rule. Shows a two-column lineage
   diagram down from the shared ancestor.

Live theme switcher (top-right) offers 3 color directions: **Көлдөө** (parchment
+ indigo), **Теңир** (sky + slate), **Көк** (dark mode).

## Architecture

Deliberately minimal for a ~100–few-thousand-person read-only v1:

- **React + Vite + TypeScript + Tailwind.** No backend. The whole tree is a
  single JSON-shaped TS file loaded into memory; pathfinding is instant.
- **SVG** for the fan chart and relationship diagram (scalable, themeable).
- The data model maps 1:1 onto a future **Postgres `people` table + `father_id`
  FK**, so nothing here is throwaway when we move to a real DB + community
  contributions.

```
src/
  types.ts              data model (Person, PersonNode)
  data/people.ts        SAMPLE seed data — replace with the real book
  lib/graph.ts          in-memory graph, ancestor chains, жети ата
  lib/kinship.ts        ⭐ pathfinding + Kyrgyz kinship naming (NEEDS VALIDATION)
  lib/search.ts         Cyrillic-tolerant fuzzy search
  components/           FanChart, PersonPicker, Avatar, ui
  screens/              SearchScreen, PersonScreen, RelateScreen
  App.tsx               shell: bottom nav + theme switcher
```

## ⚠️ Kinship terminology — needs your (and the aksakals') validation

The **algorithm** is solid: it always finds the correct common ancestor and the
exact generation distance on each side. What needs a human check is the **naming**
of each bond. All terms live in one place — `src/lib/kinship.ts` — so a
correction is a one-line edit. Current draft:

| Relationship (generations) | Draft term used |
| --- | --- |
| father / child | ата / бала |
| grandfather / grandchild | чоң ата / небере |
| great-grandfather / great-grandchild | баба / чөбөрө |
| 4th up / down | буба / чыбыра |
| same father (siblings) | бир тууган · ага/ини/эже/карындаш (by sex+age) |
| same grandfather (cousins) | бөлө (эки ата бир) |
| share ancestor N generations up | **N-ата бир** |
| uncle/nephew style | аба + descendant term |

**Please confirm or correct these**, especially: the word for paternal uncle
(аба?), the cousin terms, and the descendant chain past чөбөрө.

## Next steps

1. You send the book pages → I transcribe the real Sary Bagysh tree into
   `data/people.ts`.
2. You pick a color/layout direction (or mix).
3. You validate the kinship terms above.
4. Then: real DB (Supabase/Postgres) + moderation/suggestion flow for the
   full-scale, multi-thousand-person version.
