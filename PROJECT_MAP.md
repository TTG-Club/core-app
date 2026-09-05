# 🗺️ TTG Club Core App — Project Map

> **Purpose:** Online D&D 5e reference **and toolset** — reference content
> (species, classes, spells, bestiary, magic items, items, feats, backgrounds,
> glossary, sources), interactive tools (tokenator, dice roller, ability
> calculator, dice calculator, initiative tracker, character sheet),
> news/articles publishing,
> page discussions, user accounts & subscriptions, admin & moderation, and a
> VTTG virtual-tabletop landing.
> **⚠️ ATTENTION:** This file contains only the domain map and project
> structure.
> **All coding rules, styles, DDD constraints, and AI agent guidelines have been
> moved to [AGENTS.md](./AGENTS.md).**

---

## 🏗️ Project Structure

```
core-app/
├── app/                            # 🖥️ Client-side (Nuxt app directory)
│   ├── app.vue                     # Root component
│   ├── error.vue                   # Root error page
│   ├── app.config.ts               # Nuxt UI configuration (icons, variants)
│   ├── assets/
│   │   ├── css/                    # Tailwind v4 + SCSS: themes (dark/light/svifty7), variables, lib overrides
│   │   └── icons/                  # Custom SVG icons (`ttg` collection, glob-registered)
│   ├── composables/                # ⚡ Global composables (auto-import)
│   ├── features/                   # 🏗️ DDD domains (27) — core business logic
│   ├── layouts/                    # Layouts: default, detail, section, vttg
│   ├── middleware/                 # Route middleware: auth.global, close-overlay.global
│   ├── pages/                      # 📄 Routes (file-based routing)
│   ├── plugins/                    # anchorScroll, dayjs, online-heartbeat, scrollBehavior, scrollbarWidth
│   ├── shared/                     # 🔧 Global shared layer (FSD-style)
│   │   ├── api/                    # Typed API fetchers (dictionaries/select-options)
│   │   ├── consts/                 # Global constants (levels, layout-width, theme, fetch-status, button action labels)
│   │   ├── enums/                  # Enums (comparison, …)
│   │   ├── types/                  # base, wiki, user, subscription, upload, composable, abilities, dictionaries
│   │   ├── ui/                     # 🎨 UI Kit (28 components)
│   │   └── utils/                  # Dictionary validation only (`validation/dictionaries.ts`)
│   └── utils/                      # ⚡ Global utilities (auto-import)
├── server/                         # 🔒 Server-side (Nitro)
│   ├── api/                        # HTTP handlers: catch-all proxy + auth/*, admin/*, user/*, bug-report, online
│   ├── domain/                     # Server domains: s3 (model / service / utils), online (service only), vttg (service / utils)
│   ├── middleware/                 # 001 validate/refresh token, 002 append auth header
│   ├── routes/                     # manifest.json, online/heartbeat, s3 (upload/get/delete/copy)
│   └── utils/                      # Service clients (auth/admin/subscriber/comments), secrets, JWT, proxy, display-name, image compression
├── shared/                         # 📦 Isomorphic shared (client + server)
│   ├── consts/                     # Cookie/theme keys, durations, source platform (`SITE_5E24`), mailing limits & placeholders
│   ├── types/                      # auth (JWT payload), vttg (build DTO), mailing (send report)
│   └── utils/                      # consola, env, faker, slug, plural, status message, sort, error response, mailing labels
├── modules/                        # 🧩 Nuxt modules
│   └── auto-aliases.ts             # Auto-generation of ~domain aliases from app/features
├── public/                         # Static files (favicons, img, fonts — incl. the character-sheet PDF TTFs)
└── .github/workflows/              # CI/CD pipelines
    ├── code-check.yml              # PR checks: stylelint → eslint → type-check
    ├── codeql.yml                  # PR: CodeQL security analysis (TypeScript)
    └── deploy.yml                  # Push main/dev: `TTG-Club/shared-workflows/standard` → build, cosign-sign, Dokploy deploy
```

---

## 🌍 Domains (DDD Architecture in `app/features/`)

27 feature domains, grouped below by area.

### 📚 Reference content (D&D 5e wiki)

> **Uniform layout per domain:** `body` (full detail renderer) · `drawer`
> (side-panel that fetches `/api/v2/{domain}/{url}`) · `editor` (workshop CRUD
> form) · `link` (list card that opens the drawer) · `preview` (live editor
> preview via `POST /api/v2/{domain}/preview`) · `model` (create/detail/link
> types + schemas). The table lists only what each domain adds on top.
> **Endpoint exceptions:** `items` and `sources` call the API in the singular —
> `/api/v2/item/…` and `/api/v2/source/…`, not the domain folder name.

| Domain        | Purpose                                            | Notable extras                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `species`     | Races/species with nested lineages (sub-races)     | `lineages`, `lineages-drawer`; editor split into «Основное / Характеристики / Умения / Дары / Заклинания / Эффекты / Изображения» tabs, grants reuse the feat row editors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `classes`     | Classes, subclasses & multiclass builder           | `multiclass-drawer`, `subclasses-drawer` (body = Class + Multiclass); editor split into nine tabs, features are collapsed rows (scaling, options, mechanics and effects in sections under each feature); fighting style and ASI are `FEAT` grant rows, the legacy flags are derived on save (`model/features.ts`); class spells and spell-list expansion live on the «Заклинательство» tab; class resources are counter rows on «Дары» (of the class or of a feature), not table columns; the multiclass spell-slot table shows a warlock's Pact Magic as its own highlighted row (levels summed from the segments whose `casterType` is `PACT` in `POST /api/v2/multiclass` — they never enter `spellcastingLevel`) |
| `spells`      | Spells; class-grouped infinite-scroll list         | `groups`, `composable` (class pagination), `legend`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `bestiary`    | Creatures grouped by challenge rating; stat blocks | `composable` (CR group order); editor split into «Основное / Статблок / Действия / Эффекты / Изображения» tabs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `magic-items` | Magic items grouped by rarity                      | `composable` (rarity order), `legend` (attunement); editor split into «Основное / Свойства / Применение / Эффекты» tabs, magic's own damage uses the shared `~ui/damage-formula` parts                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `backgrounds` | Character backgrounds                              | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `feats`       | Feats                                              | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `glossary`    | Rules terms / glossary                             | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `items`       | Mundane items: weapons, armor, tools, gear         | editor switches sub-form by `category`; weapon damage uses the shared `~ui/damage-formula` parts, legacy dice kept in sync on the «Совместимость» tab                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `sources`     | Source books (publisher/translation, tags)         | model layer is named `types/` (not `model/`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### 🛠️ Interactive tools

| Domain            | Purpose                                                                                                                                                                                                       | Sub-features                                                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenator`       | Canvas VTT token generator (`/tokenator`): mask/frame/tint/text/3D lighting, export. Dexie (IndexedDB) + Pinia store                                                                                          | `canvas`, `controls`, `preview`, `model`, `composables`                                                                                  |
| `dice-roller`     | Dice-notation roller w/ crit detection + history; float/sidebar toggle, inline links, modal                                                                                                                   | `modal`, `float-button`, `sidebar-button`, `link`, `composables`, `model` (+ legacy `const.ts` / `types.ts` / `utils.ts` at domain root) |
| `calculator`      | Character-math tools container (`/calculators/abilities`, `/tools/dice-calculator`)                                                                                                                           | `abilities` — ability-score calc (Point Buy / Standard Array / Random Roll); `dice` — roll calculator with probability analysis          |
| `initiative`      | Initiative tracker (`/tools/initiative[/:id]`): participants, HP/AC editing, bestiary lookup, players from character sheets (own + saved shared, see below); anonymous slot in localStorage + `X-Tracker-Key` | `list`, `workspace`, `ui-kit`, `composables`, `model`                                                                                    |
| `character-sheet` | D&D 2024 character sheet (`/tools/character-sheet[/:id]`; the list page is public and shows a sign-in prompt to guests, creating/saving needs an account) — see the breakdown below                           | `body`, `list`, `controls`, `drawer`, `composables`, `model`                                                                             |

#### `calculator/dice`: formula syntax and probability

`/tools/dice-calculator` has its own formula parser (`model/tokenizer.ts` +
`model/parser.ts`), separate from the `dice-roller` domain, which uses the
`@ttg-club/dice-roller-parser` package. The two are **not** interchangeable, and
this one cannot be replaced by the package: it adds checks against a target
(`d20 + 6 СЛ 15`, with `КД`/`AC`/`DC` aliases) and damage that depends on the
outcome (`* (2d6 + 3) crit (4d6 + 3)`, `save half`), and it exposes the AST that
`model/distribution.ts` needs to compute probabilities — the package offers
neither. Both accept `+ - * /` and Cyrillic `к` as a synonym for `d`; the
modifier notation differs (`kh`/`kl`/`r` here, `вх`/`вл`/`ул`/`ух`/`пр`/`пб`
there).

Arithmetic is integer throughout: division rounds down (`model/operators.ts`),
matching the D&D rule and the halving done by `save half`. A literal `/ 0` is
rejected while parsing; a divisor that only evaluates to zero yields zero, so
neither the result nor the histogram can catch an `Infinity`.

`save half` is written from the target's point of view: the d20 roll **is** the
saving throw, so meeting the DC halves the damage and failing it deals the full
amount. This is the opposite of an attack against AC, where a miss deals nothing
at all.

A critical hit doubles the damage dice by default, so a plain
`(d20 + 5 КД 15) * (2d6 + 3)` already handles a natural 20 correctly. The
optional `crit (…)` clause overrides that, and exists only for crit damage that
is not simply doubled dice (brutal critical and friends).

Four toggles — advantage, disadvantage, critical damage and resistance — change
the roll without touching the text in the input. The critical toggle means "this
hit crits": on a formula with a check it makes every hit deal the crit damage
(the `crit (…)` clause if declared, doubled dice otherwise) and copies that into
the crit branch too, so a natural 20 cannot double what is already doubled; on a
plain damage formula it simply doubles the dice. `useDiceCalculator` parses the
formula, rewrites the tree (`model/roll.ts` for the modes, `model/transform.ts`
for crit and resistance, in that order: crit doubles the dice, then resistance
halves the total), and records which toggles applied. Since the input still
shows the original formula, `createRollLabel` is what explains the difference —
it appends `· преимущество · крит. урон · сопротивление` to the result caption,
and the same string keys the analysis cache. Advantage and disadvantage are
hidden unless the formula holds a lone d20 for them to change; crit and
resistance apply to anything, so they sit ahead of the modes and never move.

Probabilities come from `model/distribution.ts`. Formulas without checks are
computed exactly (convolution for plain sums, a CDF shortcut for `kh1`/`kl1`,
full enumeration for wider `kh`/`kl`), falling back to 60 000 sampled rolls when
the exact space would be too large. Formulas with checks are always sampled,
because the outcome of the check decides which dice are rolled next; the samples
are split into miss / hit / crit so the histogram can stack them.

#### `initiative`: players from character sheets

**Everything a participant carries lives on the server.** Hit points (current and
the master's maximum), a player's AC, the icon colour, the link to a character
sheet and the conditions are columns of `initiative_participant` in core-api —
`localStorage` kept none of it beyond one browser, so a second device or a
cleared site data lost the whole fight. They are written by the same
`PUT /participants/{id}` that renames a participant (`null` = не менять,
`conditions` arrives whole), and a player joins with all of it in the single
`POST /participants`, so no id has to be fished out of the response.

Besides the manual player form, the add panel of an authorized master offers
`SheetPlayerAddForm` — a picker over their own active sheets and the shared ones
they saved (`useSheetPlayerOptions` reads both lists straight through
`~character-sheet/model`, in parallel and independently, so one failing list
still shows the other). `buildSheetPlayerOption` takes the name, the initiative
bonus, the AC and the hit points from the sheet (clamped to the tracker's own
limits) and the link itself, so the row shows the character's avatar, marks
itself «лист персонажа» and opens the sheet from its menu (own sheets by id,
saved ones by share token). Sheets already standing in the fight are badged in
the list, and the picker reloads on demand.

Hit points travel back: damage and healing marked on a player built from a sheet
are written into that sheet's `health.current` (`useSheetHitPointsSync`) — only
the current value, never the maximum, which the sheet computes itself. An own
sheet is saved whole (`PUT`), so the document is re-read right before the write
and a sheet the player edited meanwhile is not overwritten by the snapshot taken
when they joined the fight. Someone else's sheet is reached through the narrow
endpoint of its saved link (`PATCH /tools/character-sheet/saved/{id}/health`,
`updateSavedCharacterSheetHitPoints`): the master has no rights to the rest of
the document, the server clamps the value to that sheet's own maximum, and the
right to write comes from having saved the link rather than from the token
itself. Writes are debounced and queued per sheet, and temporary hit points the
tracker knows nothing about stay untouched either way.

The avatar itself is shared by the row and the reel (`useParticipantAvatars`):
the creature's stat-block picture, the sheet's avatar for a linked player, and a
per-participant fallback colour for everyone drawn as an icon or initials (the
seven semantic colours of the theme). The colour is picked from the avatar
itself — it doubles as the popover trigger whenever there is no picture — and
paints both the row circle and the reel token, replacing the primary highlight on
the token whose turn it is, so a colour chosen for a player does not vanish
exactly when they act.

Two things the tracker now does by itself. A creature whose hit points reach
zero is marked defeated (and un-marked when it is healed above zero) — the same
`dead` flag the row menu sets, so it keeps its place in the order and is skipped
in the turn queue; players are left alone, since at zero a character falls
unconscious rather than out of the fight, and that call is the master's. And the
header carries the tracker's own «Новая инициатива каждый раунд» switch
(`rerollEachRound` on the tracker, `PUT /tools/initiative/{id}`): the re-roll
itself belongs to the backend, which rolls every living participant on the round
change and hands the turn to the first one of the new order.

Conditions are the fifteen PHB 2024 ones with the names and artwork of VTTG
(`app/assets/icons/status-*.svg`, taken from its `assets/status`; the two without
their own picture fall back to `tabler`, as they do there) plus six common combat
effects that are not conditions by the rules — concentration, haste, slow,
enlarge, reduce, polymorph. They are added from the row itself: a palette with an
optional duration in rounds and, for a timed one, the moment it drops — in the
start of its owner's turn (default), in the end of it, or on the round boundary
(«начало» and «конец» of a round name the same instant, so that is one option).
A timed condition stores not the remaining rounds but the round it drops on, so
a reload cannot lose count of it, and the backend removes it at the matching
moment of `nextTurn` — the same server that moves the turn, so two open screens
cannot disagree. `prevTurn` only rewinds the pointer and the round: a condition
already dropped is not brought back, and the master re-applies it by hand.
Finishing the fight («Пересоздать бой») clears the conditions along with the
rolls, since the backend revives the defeated at the same moment; hit points it
leaves alone — the end of a fight does not heal.

#### `character-sheet` in detail

The largest tool domain (`body/ui` alone holds 50+ `Sheet*.vue` panels and
modals), so its capabilities are listed here rather than squeezed into the table.

**Sheet lifecycle**

- Wizards for species / class / background; rolls go through `dice-roller`
  (universal `SheetRollModal`).
- «Калькулятор характеристик» in the sheet action menu (`SheetAbilityScoresModal`) sets
  all six scores the way `/calculators/abilities` does. The three generators
  (random roll / standard array / point buy) plus the resulting summary live in
  one component of the calculator domain — `CalculatorAbilityScores`
  (`~calculator/abilities`) — used by the calculator page and the sheet alike;
  the sheet passes its background ability bonuses as a bonus source, so they are
  shown in the summary and added on apply (the sheet stores scores together with
  them). Applying goes through `setAbilityScores` — one edit, so Constitution
  moves the hit points once, and the only place where the range is clamped. The
  set is written only when all six are assigned, and the class template button
  of the standard array is hidden where no class is picked next to it. The set
  replaces all six values outright: level-up ability increases are baked into
  `abilities` and kept in no separate ledger, so they cannot be carried over —
  the modal says so before applying.
- The class wizard asks everything in one review step split into «Основное /
  Снаряжение / Умения / Характеристики» tabs, each carrying the number of
  answers it still waits for. The button on the right walks the tabs («Далее»)
  and turns into «Применить» only on the last one, where it stays disabled
  until every counter is zero.
- The class and background wizards also hand out the starting equipment. The
  reference `startingEquipment` field carries the official options («А», «Б»,
  «В») as structured item lists plus coins, so the review step shows them as a
  radio row (`SheetStartingEquipmentChoice`, first option preselected, «Не
  добавлять» last) and applying pulls each catalog item through
  `/item/{url}` — a weapon lands with its attack, a suit of armour with its AC —
  while a line without a catalog slug becomes a homebrew row the player renames.
  Items merge into the inventory by quantity instead of replacing it, and the
  coins are added to the wallet, so re-picking a class never wipes what was
  bought. What each source handed out is remembered on `characterClass` /
  `characterBackground` (`startingEquipment`) and taken back the next time that
  same source is picked — exactly the granted quantities and coins, so the set
  never accumulates and anything bought on top survives. Sheets saved before the
  field existed carry no record, so their first re-pick has nothing to take back.
  Entries the reference has no structured data for simply show no picker.
- The background wizard also creates a homebrew one (`SheetCustomBackgroundModal`,
  opened over the catalog list): name, a +2/+1 or +1/+1/+1 ability spread, two
  skills, one tool from the catalog and an origin feat (category `ORIGIN` of
  `/feats/select`, profile sources respected). It goes through the same
  `setBackground` and is stored with a `custom:<uuid>` url, so it never mixes with
  a catalog background.
- The species wizard does the same for a homebrew species
  (`SheetCustomSpeciesModal`, opened over the catalog list): name, size,
  movement and vision as add-a-row lists (`SheetDistanceRows` — type select +
  distance in feet, each type once, options from the `SPEED_*` / `VISION_*`
  orders of the sheet's own modals; hover appears once a flying speed exists),
  plus any number of features (name + `MarkupEditor` description).
  It goes through the same `setSpecies` and is stored with a
  `custom:<uuid>` url; features land with origin `species`, so re-picking a
  species replaces them like catalog ones.
- The class wizard does the same for a homebrew class (`SheetCustomClassModal`,
  opened over the catalog list): name, an optional subclass name, hit die,
  saving throws, skill proficiencies, a caster type
  (`CUSTOM_CLASS_CASTER_TYPE_OPTIONS` — spell slots follow it) and any number of
  features (name + `MarkupEditor` description). It goes through the same
  `setClass` and is stored with a `custom:<uuid>` url; features land with origin
  `class`, so re-picking a class replaces them like catalog ones. Armour, weapon
  and tool proficiencies plus class resources are left to the sheet's own panels
  — a homebrew class has no proficiency prose or table to derive them from.
  Levelling one up falls back to the wizard's no-class path (average hit points,
  no feature steps), since the level-up wizard resolves features by class url.
- Multiclassing per the 2024 rules. The sheet keeps a primary class
  (`characterClass`) plus `additionalClasses`, each with its own `level`; the
  character level is their sum, and proficiency bonus and experience follow it.
  Clicking the class in the header opens the class list (`SheetClassesModal`) —
  edit the primary one, add another (`SheetClassWizardModal` in `add` mode:
  classes already taken are filtered out, the level is 1, no starting equipment)
  or drop one (inline confirmation; a nested `ConfirmDialog` would sit under the
  outer modal's `aria-hidden`). Removing a class takes back its features,
  resources, hit dice and the maximum hit points recorded for it —
  `health.levelGains` entries carry a `classUrl` for exactly that.
  Feature keys and table column names repeat across classes in the reference, so
  ids are scoped by class url (`class:<classUrl>:<key>`,
  `class:res:<classUrl>:<name>`); sheets saved before multiclassing are migrated
  in `normalizeCharacterClasses` (`character-schema.ts`), which also derives the
  primary class level and moves the sheet-wide spellcasting ability onto it.
  Spell slots follow the multiclass caster level — full classes in full, half
  casters rounded **up**, third casters rounded **down** (verified against the
  `spellcastingLevel` of `POST /api/v2/multiclass`); a warlock's Pact Magic stays
  separate (`SpellSlotRow.kind`, its own circles in the level divider, returned by
  a short rest). Save DC and attack bonus are computed per caster class
  (`getSpellcastingRows`), so the spells tab shows one tile per class. The
  reduced multiclass proficiency set is not granted: `multiclassProficiency` is
  empty for every class in the reference, so the wizard only shows the class's
  own prose for the player to tick manually, and the «13 in the ability»
  requirement warns instead of blocking.
- Level-up wizard inside the experience modal (`composables/useLevelUpWizard.ts`):
  one step per gained level with its own hit-point mode (average / roll / max),
  the class and subclass features of that level with their choices, and the
  subclass picker at level 3 **in that class** filtered by the profile sources on
  the client (`/classes/{url}/subclasses` ignores `source`). With several classes
  the steps run class by class, each with its own hit die. The experience modal
  lists a level per class (each capped by what is left of 20) and offers
  «Пропустить подготовку» — the level is applied straight away through
  `setClassLevels` with average hit points and no feature steps. Applied
  atomically by `applyLevelUp`, which keeps spent hit dice and class resources.
  The modal is as wide as the catalog pickers (`sm:max-w-5xl`): on the left a
  rail of steps (`SheetLevelUpStepsRail` — «Уровень и опыт», then «Колдун ·
  11 уровень» with what the step contains and a warning badge with the number
  of choices still open; ability improvements nest under their level; on
  narrow screens the rail folds into a swipeable strip of chips), on the right
  the step in section cards (`SHEET_WIZARD_SECTION_CLASS`: hit points,
  subclass, feature cards with an origin badge and a pending badge). The rail
  lists the levels ahead from the moment they are typed in — before «Далее»
  builds the real steps it shows one unreachable item per gained level — and
  each column scrolls on its own, so a long feature description never carries
  the list of steps away. The rail only goes backwards; «Далее» checks the step
  through `getStepPendingCount`.
- Every choice a record asks for — skills, tools, languages, invocations,
  spells, feats, subclasses, ability slots of a feat — is asked by the same
  picker: `SheetChoicePickerField` (title, an explanation of what the feature
  grants and why, chosen values as chips, a «Выбрать» button) opens
  `SheetChoicePickerModal` (search, groups, «Все | Выбранные» tabs, a counter).
  A row is two buttons side by side. Where the options have descriptions, the
  window is `sm:max-w-4xl` and keeps a `SheetChoiceDetailPane` on the right
  (spell / feat / item / class body by url or the option's own markup): the
  name opens the description there, the check mark alone picks the option, and
  the description stays readable even when the limit is reached. Where there is
  nothing to describe (skills, languages, abilities) or the pane is switched off
  (`hide-detail-pane` for subclasses), the window narrows to `sm:max-w-lg`, the
  name picks the option and the neighbouring button opens the section drawer —
  the same on narrow screens, where the pane is hidden anyway. Options are
  built once for all wizards by `buildChoiceControl` → `toChoicePickerOptions`
  (`SheetChoiceOption`: `value` stays the stored answer — a name for skills,
  tools, options and spells, a url for feats and subclasses). Skills the
  character already has carry a `SKILL_OWNED_HINTS` badge and trigger
  `SKILL_DUPLICATE_WARNING` once picked again: under the 2024 rules a duplicate
  proficiency grants nothing and never turns into Expertise. It stays
  selectable on purpose — a DM may still run the 2014 «take another
  proficiency instead» rule.
- Debounced autosave, a server-side limit of active sheets, soft delete with
  restore history, and copy — `model/api.ts` covers
  `POST|GET|PUT|DELETE /…/{id}` plus `/{id}/restore` and `/{id}/share`.
- Shared action menu in the sheet header and in the list card.

**Import / export**

- JSON export (without the portrait link) and JSON import from the section
  controls.
- The same import button also accepts a Long Story Short export (its character
  document is a JSON string inside `data`). `model/import` is a lazily imported
  sub-module (like `model/pdf`, so it stays out of the main bundle): `schema.ts`
  parses the foreign file with catch-everything Zod, `tiptap.ts` rewrites its
  TipTap texts into site markup (`{@list}` / `{@bold}` / `{@link}`), `convert.ts`
  maps abilities, skills, hit points, resources, coins, the header details
  (alignment and appearance go straight into `personality`, the LSS keys being
  the same as ours; only what has no field of its own — the player's name —
  still becomes the «О персонаже» note) and text blocks (traits and feats become
  sheet features, the rest become notes), and `catalog.ts`
  matches class, subclass, species, background and every equipment line against
  the site catalogs by name — anything not found stays a homebrew entry. Spells
  cannot be carried over (the file keeps only LSS-internal ids), so the import
  says so in a toast.
- PDF export from the same action menu. `model/pdf` draws its own vector layout
  close to the official D&D 2024 sheet with Russian labels: main page,
  personality (appearance boxes and the long description — the page is skipped
  when nothing is filled in), equipment, spells, and a reference section with
  full descriptions.
  Descriptions of catalog spells and items are not stored in the sheet document,
  so `model/pdf/catalog.ts` fetches them on export — batched, cached per page
  load, and best-effort (a failed request only costs one reference entry).
  `pdf-lib` + `@pdf-lib/fontkit` are imported dynamically to stay out of the main
  bundle, and the PT Sans / PT Serif TTFs live in
  `public/fonts/character-sheet` because pdf-lib cannot embed woff2 and its
  built-in fonts have no Cyrillic.

**Content on the sheet**

- Tool proficiencies are catalog-backed: the sheet keeps no tool list of its own,
  `composables/useToolCatalog.ts` builds one from the «Предметы» section
  (`itemType` = `ARTISAN_S_TOOLS` / `GAMING_SET` / `INSTRUMENT` / `TOOL`, group
  titles taken from `/item/filters`, profile sources respected). A proficiency
  stores `{ name, url }`, so its chip opens the item drawer; anything the site
  does not have — including tools named in class or background prose — is kept as
  the player's own entry without a link, and one can be typed in by hand in the
  proficiency modal.
- Character portrait uploaded to S3 (hover the avatar to add / replace /
  remove); the chosen file first goes through the `shared/ui/image-crop`
  square-crop editor.
- Homebrew spells added by a form (`custom:` url, description in site markup,
  expandable card on the spells tab).
- Homebrew equipment added by the same kind of form (weapon / armor / trinket,
  each with its own fields — custom armor is equippable and adds to AC, custom
  weapons roll attack & damage). The form is split in two tabs: «Основное» holds
  the mundane parameters (a versatile weapon also names the two-handed die, which
  switches the grip from the row menu), «Магические свойства» everything a magic
  item does. That tab is gated by a switch — its fields stay visible and go
  disabled while the item is not magic, rather than appearing out of nowhere —
  and holds the attunement requirement, the charge pool, the weapon's own to-hit
  bonus and extra damage dice with their own type, plus the item's passive
  bonuses. Those are added one row at a time: a searchable target (any ability
  score, ability checks, any skill of this sheet including the player's own, one
  saving throw or all six, one movement speed or all of them, AC, initiative,
  spell save DC, spell attack) and a value; a live summary at the bottom of the
  tab shows what the item will hand the sheet. Passive bonuses count while the
  item is equipped, and an item that requires attunement only while attuned —
  the row badges say «Настроен» / «Нужна настройка». Ability bonuses reach every
  derived number through `getEffectiveAbilities` / `getAbilityModifier`, while
  the score written on the sheet stays what the ability modal edits (the tile
  shows the total and explains it in its tooltip); hit points are the one thing
  a Constitution item does not move, since the sheet stores them as a number.
- The carried-weight row of the equipment tab is also the way into its limit
  (`SheetCarryingCapacityModal`, opened by the row itself — a pencil revealed on
  hover, like every other edit control of the sheet). By the rules the limit is
  Strength × 15 with a size correction (`CARRYING_CAPACITY_SIZE_MULTIPLIERS`),
  and the modal offers three ways to bend it: a flat number instead of the
  calculation, a bonus in pounds on top of it (a negative one lowers the limit)
  and a size to count the correction by other than the character's own — that is
  «Мощное телосложение», carrying as one category larger without being it. All
  three live in `Character.carryingCapacity`, where `null` / `null` / `0` means
  «по правилам», so sheets saved before the setting count exactly as they did.
  The row, the modal preview and the PDF all read
  `getCarryingCapacityBreakdown`, so the number cannot diverge between them.
- Next to the carried weight stands the attunement tile: how many items are
  attuned out of how many may be («2 / 3»), the same shape the prepared-spells
  tiles have on the spells tab. It opens `SheetAttunementModal`, where the 2024
  limit of three items bends the way the weight limit does — a flat number
  instead of the calculation, an ability whose modifier becomes the base instead
  of the rule (home rules and artificer-like features), and a bonus on top of
  the base. All three live in `Character.attunement`, where `null` / `null` /
  `0` means «по правилам», so sheets saved before the setting count exactly as
  they did. Attuning past the limit is refused with a toast, the way preparing
  one spell too many is; the tile, the modal preview and that guard all read
  `getAttunementBreakdown`, so the number cannot diverge between them.
- Catalog rows on the equipment and spells tabs can be copied into the sheet
  from the row action menu. The `custom:` copy keeps quantity, equipped state
  and combat parameters, and pulls the description — for a spell also its
  casting time / range / components / duration — from the section detail into
  the sheet document; it is edited afterwards by the same homebrew form. A
  copied magic item keeps its group, and its kind follows the parameters it
  carries — «trinket» unless a mundane base gave it weapon or armour data.
- The «Добавить магический предмет» catalog groups its rows the way the section
  does, and the grouping is picked from a dropdown under the filter button (by
  rarity in the dictionary order — the shared `useMagicItemRarityGroupOrder` —
  by category, or none). State and menu come from the section infrastructure
  (`~infrastructure/list-presentation`), so the choice survives reopening in
  `localStorage`; only grouping is offered because the order inside a group is
  always the Russian name. Entries whose rarity varies («Оружие +1, +2 или +3»)
  are left out of the list — one such record stands for a whole family of items,
  so neither a price nor a single mundane base can be pinned to it. The rarity
  dictionary is what maps the search's Russian rarity label to `VARIES`, so the
  list waits for it in every grouping, not only «По редкости».
- A magic item is priced by its rarity — `MAGIC_ITEM_RARITY_COSTS`, read from
  `/magic-items/{url}/raw` together with the editor's «Связанные предметы», since
  neither the search nor the public detail carries them. Built on exactly **one**
  mundane item, it also takes that item's weight and combat parameters — a magic
  shield is equippable and counts towards AC, a magic weapon rolls attack and
  damage — and adds the base price converted to gold through
  `CURRENCY_GOLD_RATES` (a rare dagger of poison: 4000 + 2 = «4002 зм»). Several
  links or none leave weight and combat data empty, but the rarity price stands
  on its own («Сумка хранения» → «400 зм»). An artifact is «Бесценный»; a rarity
  with no price in the table falls back to the base item's own cost, and with no
  base to fall back to the cost stays empty. LSS import goes through the same
  `fetchMagicItemSummary`.
- The workshop editor also carries three numeric bonuses per magic item
  (`MagicItemBonuses` — «Бонус к атаке» / «к урону» / «к КД»), and the sheet lays
  them over the mundane base: the attack bonus becomes `InventoryWeapon.attackBonus`
  and joins proficiency + ability in `getWeaponAttackBonus`, the damage bonus is
  folded into the weapon's own `damage.bonus` (both grips), and the AC bonus goes
  into `armor.baseArmorClass` so a magic shield still competes as a shield. An item
  with no armour base keeps its AC bonus in `CharacterInventoryItem.armorClassBonus`
  — a flat term the AC breakdown sums over every equipped item («Магические
  предметы» row), because a cloak and a ring of protection stack rather than
  compete. Homebrew items keep the same bonus in an `armor-class` row instead, and
  `getInventoryItemArmorClassBonus` reads both; on a suit of armour it joins that
  armour's own value so the «best armour wins» comparison stays honest, and an
  item that requires attunement contributes nothing until it is attuned. Sheets
  saved before the fields existed read them as `0`.
- Next to those bonuses the editor's «Свойства» tab carries what the D&D system
  keeps on the item itself: «Дополнительный урон» (`damageParts`, the shared
  `~ui/damage-formula` editor — «2к6 огнём» of a Flame Tongue on top of the base
  weapon's roll), «Заклинательная фокусировка» (`focus`) and «Адамантиновый»
  (`adamantine`). The sheet folds the first damage part into
  `InventoryWeapon.extraDamage` (it wins over the base item's own extra damage —
  it _is_ what the magic added); the two flags exist for the VTTG export, where
  `isFocus` is also inherited from a linked mundane base. All three are optional:
  an empty value means «as before», so no catalogue record needed backfilling.
- «Условие применения» (`mechanics.activation`) now reaches the sheet as
  `CharacterInventoryItem.bonusActivation`: `CARRIED` → bonuses work without
  equipping, `CONSUMED`/`MANUAL` → they wait for the row's «включён» switch,
  everything else → equipped, as the sheet always behaved. «Пассивные свойства»
  land in `passiveNote` and join the item's bonus summary as a plain line.
  Charges carry their recharge rule (`InventoryCharges.recovery`), and a rest
  restores them — a short rest closes `SHORT_REST`, a long rest also `LONG_REST`
  and `DAWN` (dawn ends the night at the table); a recharge formula («1к6+4») is
  rolled and added up to the maximum, no formula recharges in full. Items on
  sheets saved before these fields read as «equipped», no note and no rule.
- The section page and drawer show the structure in a «Свойства» block
  (`body/ui/PropertiesBlock.vue` fed by `getMagicItemPropertyRows`): bonuses,
  extra damage, charges with their recharge, passive properties and the two
  flags. A record with no structure renders no block at all.
- Everything else a magic item does to the sheet comes from the workshop's
  «Активные эффекты» block (`mechanics.activeEffects`). `model/effects.ts`
  translates each plain numeric change into an `InventoryItemBonus` when the item
  is added, so the sheet keeps working offline off its own snapshot: `ability.*`,
  `save.*`, `skill.*` (the VTTG camelCase id is mapped through
  `SKILL_NAME_BY_API_KEY`), `movement.*`, `armorClass`, `initiative`,
  `spellSaveDC`, `attack.spell`, `attack.melee` / `attack.ranged`,
  `proficiencyBonus` and `hitPoints.max` reach their targets. What a snapshot
  cannot carry is computed on every read instead of being dropped
  (`getLiveEffectBonusEntries`): changes with a carrier condition («while wearing
  armour») and formula values (`@mod.*`, `@prof`, `@level`), both in `add` mode
  only — the value-setting modes with a formula belong to the AC body
  (`getArmorClassEffectBody`). A formula that names the very value being computed
  cannot loop: the target already in progress gets no live bonuses. Senses
  (`sense.darkvision` and friends) join the sheet's vision through
  `getVisionGrants`, and an effect's `conditionImmunities` reach the defences
  panel. Still dropped: the `multiply` / `custom` modes, auras, damage parts,
  conditions the sheet cannot evaluate (`roll.*`, `target.*`), the `@mod.spell` /
  `@speed.*` tokens and keys the sheet has no target for, as are disabled effects
  and effects aimed at someone else. The `transfer` flag is not read — the
  sheet's own gate (the item's activation condition, and attunement where the
  item asks for it) plays that role. A bonus therefore carries a `mode` (`add` / `override` / `upgrade` /
  `downgrade`) and a `priority`, and every total is folded rather than summed
  (`getInventoryBonusTotal(character, targets, base)`): the sheet computes the
  base itself (`getBaseAbilityScore`, `getBaseSavingThrowValue`,
  `getBaseSkillValue`) and equipment takes it from there, so a headband of
  intellect raises Intelligence to 19 while a written 20 stays untouched. The
  breakdown rows come out of the same fold, so each item is credited with what it
  actually changed. AC is the exception in shape only: an item's `add` rows keep
  flowing through the «best armour wins» comparison and the flat item term, the
  value-setting modes are applied to the finished number
  (`getArmorClassWithItemLimits`), and everything else — live rows from any
  record plus the plain rows of features and of the sheet's own effects — is
  summed into the «Эффекты» line of the breakdown. Bonuses saved
  before the modes existed read as plain `add`, and an item already sitting on a
  sheet keeps its old snapshot — effects added in the workshop later need the
  item re-added.
- Species, lineages, classes, subclasses and their features may each carry
  «Активные эффекты» of their own. They ride onto the sheet with the record:
  passive changes are frozen into the feature's `bonuses` (the same shape
  equipment uses), while the effects themselves stay on the record so conditional
  and formula changes are re-checked on every read. The sheet's own effects
  (`Character.activeEffects`, the «Эффекты» tab and the conditions grid) are a
  third source of the very same bonuses: nothing freezes them, so their changes
  are translated on every read. Effects of the
  species or class record itself land as their own feature row rather than being
  pinned to the first feature — a lineage has no features at all, and a class
  grants them by being taken; the class row appears only at its first level. The
  «Эффекты» tab shows them in a block of their own («От умений и черт») beside
  the sheet's own effects and the equipment ones: the effect's name, the record
  that granted it and its description. They are neither editable nor removable —
  they arrive with the record and leave with it — but each carries a switch, and
  turning one off rebuilds that feature's frozen `bonuses` out of the effects
  still enabled, so a disabled effect stops moving the sheet by either route.
- The species wizard no longer reads darkvision, proficiencies and choices out of
  feature prose: `properties.darkVision`, `mechanics.proficiencies` and
  `mechanics.choices` (of the record and of every feature already in effect at the
  character's level) are used instead, with the prose parse left as the fallback
  for entries that have no structure yet. Skills granted this way go to the skill
  rows, not to the proficiency list; the record's own choices get their own row —
  a lineage has no features to hang them on.
- A feat a species feature asks for («Универсальность» of the human wants an
  origin feat) is picked in the species wizard the same way the class and
  level-up wizards pick one: `SheetFeatChoiceField` (the unified picker with the
  feat pool and one more field per ability slot of the chosen feat) — because
  the pool is the whole feats section and the mechanics carry urls, not names. A `feat`
  choice therefore never reaches the plain select: `resolveChoiceOptions` returns
  an empty pool for it instead of falling through to the tool branch, which is
  what used to offer alchemist's supplies in place of a feat. The chosen feat
  becomes a sheet record of its own whose origin is the species (or the lineage),
  so removing the species takes it away with the feature that granted it, and
  whose id keeps the `:feat:` segment, so it counts as taken and is not offered
  twice.
- A class feature carries the same mechanics a feat does — grants, choices,
  counters, granted spells, a spellcasting ability — and both the class wizard and
  the level-up wizard ask **every** choice a feature declares, not one: expertise
  wants two skills, a subclass feature may want a skill and a language. The parse
  is literally the feat's (`toMechanicChoices`, `collectChosenProficiencies`): the
  `MechanicChoice` model in core-api is shared, so a second copy would drift.
  Answers land as a snapshot on the feature record — the grant ledger owns them
  from there, exactly as with a feat, which is why the wizard no longer puts
  feature-choice skills and languages into the `setClass` payload: two owners
  would mean removing the class takes the grant back only halfway. A feature's
  counter reaches the resource panel and its granted spell reaches the spellbook
  through the paths feats already use.
- A spell or cantrip a class feature — or one of its options — asks for is picked
  in every wizard exactly as a feat asks for one: the unified picker shows the
  pool grouped by circle with the spell body in the detail pane, and the pool
  itself is a catalog search (`useChoiceSpellPools` → `fetchChoiceSpells`)
  narrowed by the class and the circle the mechanics name, because the
  reference stores no list of its own. Such a question arrives with the option
  that owns it («Маг» of the druid's primal order grants an extra druid
  cantrip), so the wizard reloads the pools whenever the set of spell questions
  changes (`getSpellChoicesKey`) rather than once per class. The pool carries a
  status (`getStatus`: loading / ready / error): while it is loading or failed
  the choice counts as pending and the field shows «Загрузка списка…» or
  «Не удалось загрузить — Повторить» (`retry`), so a step can no longer pass
  with «Выберите 0» and no spell («Таинственный арканум» of the warlock used
  to do that). The answer lands on the feature record
  (`withChosenFeatureSpells`), which puts it under «Врождённые и от черт» on the
  spells tab, keeps it out of the prepared count and takes it away with the
  class. Data caveat: the four arcanum choices of `warlock-phb` need
  `requiredLevel` 11/13/15/17 in the reference, otherwise all four are asked at
  level 11 and none later.
- A feature's own list of options (warlock invocations, battle-master manoeuvres,
  sorcerer metamagic) is asked by the wizards only when the record carries
  `optionsChoice`; without it the list stays a reference on the class page, as it
  was before the field existed. The pool is the feature's `options` themselves —
  no second list — narrowed by each option's `requiredClassLevel`, and the count
  grows in steps that name the total to a level, so the wizard asks the
  difference from the previous step. An option taken on one step leaves the pool
  of the others unless it is marked `repeatable`: a repeatable one stays in the
  list and the feature line shows its multiplicity («Инфузия ×2»). Every answer
  also becomes a sheet record of its own carrying the option's description, and
  the same descriptions open in the shared `FeatureOptionsDrawer` — the class
  page and both wizards render it.
- Depth in the class editor is drawn with two visual languages, not seven
  identical frames: a BOX is a list object (feature, option, grant row, effect)
  and a RAIL — `EditorNestedSection`, a line running down from the collapse
  chevron — is a section inside it («Варианты», «Механика и эффекты», «Дары»).
  Nesting is read by counting rails, and while the caret is inside a field every
  rail and box above it is highlighted, so the path to it lights up on its own.
  The headers of an expanded feature and of an expanded option stick to the top
  of the window (`top-0` and `top-10`), which keeps «Воззвания → Мучительная
  кара» in view while editing mechanics several screens deep; that is why the
  features card has to opt out of the card theme's `overflow-hidden`.
- An option carries the same mechanics block as the feature that owns it
  (`mechanics` + `activeEffects`): proficiencies, sheet modifiers, resources,
  granted spells, spell-list expansion and effects. They land on the option's own
  sheet record, so the features list shows which invocation granted a
  proficiency, and removing the class takes the record away with its feature.
  Questions an option asks («выбери навык» of a manoeuvre) are marked with its
  key and appear in the wizards only once the option itself is taken — an answer
  left over from an option the player dropped never reaches the grant ledger.
  A reference list asks nothing, so its options' questions are not built at all.
- A class feature flagged `informationalOnly` («Подкласс волшебника») never
  becomes a sheet record: the progression table needs the line, the sheet does
  not.
- The «Добавить заклинание» catalog opens preset to what the character can
  actually learn: the class chip is picked by the class slug (the same id the
  `className` filter group uses) and the level chips cover every circle the
  class grants slots for at its level, cantrips included. Nothing is stored for
  it — the preset is derived from `casterType` + level on every open, so a
  level-up or level-down changes it by itself, and the usual filter reset drops
  it when the player wants the whole catalog.
- Innate spells granted by the species stand in their own «Врождённые» group and
  have the same row menu: copying one moves it into the spell book as a `custom:`
  record (editable afterwards), removing one drops it from
  `species.innateSpells` so the next level-up does not bring it back. Both are
  undone by picking the species again in the wizard.
- An innate spell is prepared from the start and never takes a slot in the
  prepared pool: the counter (`getPreparedSpellsBreakdown`) reads
  `character.spells` alone, so the limit neither shrinks nor blocks the mark.
  Its icon still toggles — the flag lives in `species.innateSpells[].spell`
  where a missing value reads as prepared (`isInnateSpellPrepared`), which is
  what sheets saved before the flag get. Copying such a spell into the book
  drops the mark: there it would count against the limit.
- Feats are added from the «Особенности» tab (`SheetFeatAddModal`, catalog
  list with profile sources respected) or handed out by the background and
  level-up wizards, and what a feat does to the sheet comes from its workshop
  `mechanics` — parsed once by `parseFeatDetail` and stored as a snapshot on
  the feature record, so a feat keeps working offline and stops changing when
  the catalog entry is edited. Applied at once: hit points, AC, speeds, senses
  (they raise the sheet's vision through `getEffectiveVision`, never lower
  it), a flat and a proficiency-bonus initiative term (each becomes its own
  read-only row in the initiative breakdown, labelled with the feat), granted
  proficiencies — weapon and armour categories become «вся группа» records,
  skills, tools and languages are translated through `SKILL_NAME_BY_API_KEY` /
  `LANGUAGE_NAME_BY_API_KEY` — and ability increases. Everything a feat hands
  out goes through the grant ledger (`proficiencyGrants`), so removing the
  feat takes back exactly what it gave; ability increases are written into
  `abilities` as a difference the same way hit points are, with the rules cap
  (`upto`) applied once at pick time so removal never drops a score below
  where it started. Resistances, immunities, vulnerabilities, condition
  immunities, a new creature type and telepathy have no sheet field of their
  own: they are collected on the fly by `getFeatDefences` into the read-only
  `SheetDefencesPanel`, which appears under the proficiencies panel only when
  a feat granted something. A defence whose damage type the player picks is
  not in the snapshot's sets — the snapshot only links the choice
  (`damage.defenseChoices`, legacy `resistanceFromChoiceKey`), and
  `getFeatDefences` reads the answer off `choiceAnswers`.
- A feat that asks the player something shows a second step in the same modal
  (`getVisibleFeatChoices` decides what is asked): a skill for proficiency or
  expertise (the «Наблюдательный» case turns a skill the character already has
  into expertise), a tool, a language, a spellcasting ability, a spell or
  cantrip (the pool is a catalog search, `fetchChoiceSpells`), the spell list
  a feat draws from (the answer narrows the pool through
  `classesFromChoiceKey`, and a background that names the class itself still
  wins), the damage type a defence applies to («Закалённая кожа» resists
  bludgeoning OR slashing; an empty pool in the mechanics means any type), and
  which abilities an increase raises — a feat offering «или» variants asks
  which variant first. Two more are asked since the mechanics grew them: the
  saving throw a feat grants proficiency in («Устойчивый», «Здоровяк» — the
  pool drops throws the character already has, and «Устойчивый» ties its +1 to
  the same answer through `fromChoiceKey`) and the weapon mastery
  («Мастер оружия» — the pool is the weapons the character is proficient with,
  group records expanded by `getOwnedWeaponNames`). Both travel through the
  grant ledger like the rest, so removing the feat takes the proficiency back.
  Answers are kept on the feature record (`choiceAnswers`) so a later level-up
  can reason about them; the ones the sheet applies immediately land in the
  proficiency snapshot, the granted spells or the ability increases. Choice
  kinds the sheet cannot apply — armour and the per-option menus of the Kindred
  disciplines, where the reference stores the options but not what each one
  does — are not asked at all.
- A feat with `mechanics.counters` brings its resource onto the resources
  panel: taking «Везунчик» adds its luck points, removing the feat takes them
  away, and what was spent survives the rebuild (`withFeatResources`, the same
  idempotent pattern as the feat initiative bonuses — records are rebuilt from
  the snapshot, the player's own resources are left alone). They are spendable
  but not editable: the reference owns their name, maximum and rest, so an edit
  would come back at the next feat change.
- The «Личность» tab holds the person rather than the build: seven appearance
  tiles (alignment from the `alignments` dictionary plus age, height, weight,
  eyes, hair and skin as free text — clicking a tile opens the form with the
  caret already in that field), the background pulled from
  `characterBackground` on its own with its ability bonuses and a drawer for the
  catalog description (a homebrew one has no page to open, and an empty panel
  offers the same wizard the header does), and a long description in site markup
  edited by `MarkupEditor`. It all lives in `Character.personality`; sheets saved
  before the block existed read every field as empty.

**Play**

- Spell slots derived from the reference `casterType` of the class/subclass
  (full / half / third caster, warlock pact magic) plus the character level;
  spent by clicking the circles in each spell-level divider.
- Prepared counts on the spells tab, next to the save DC / attack tile: two
  tiles, «Подготовленные» for circles 1+ and «Заговоры» for cantrips, since the
  reference class table counts them in separate columns («Подг. закл.» and
  «Заговоры», both matched by letters because the wording is abbreviated
  differently per class and sometimes lives only on the subclass). Both
  progressions are snapshotted into the sheet by the class wizard and refreshed
  by every level-up; each tile shows the value for the current level. Clicking a
  tile opens its own settings: either a custom number (the class count is then
  ignored) or a bonus added to the class count. A tile reads «marked / allowed»
  (`4 / 17`) and turns red when the allowance drops below what is already marked.
- Prepared spells marked by clicking the spell icon in the row — the same
  gesture as equipping armour. Only the icon square lights up (the row itself
  keeps its usual look), the flag lives in `spell.prepared`, and marking more
  than the allowed number warns instead. Cantrips are prepared the same way but
  counted against their own tile; innate species spells are always available, so
  their icon toggles nothing. With no allowance known (the class gives none and
  no custom number is set) marking is unlimited.
- Spell list narrowed by a chip row above the groups: «Подготовленные» plus one
  chip per circle (cantrips as «З», the full name in the tooltip), several
  circles at a time, and a reset button once anything is picked. Nothing is
  stored — the chips are derived from what the list already shows
  (`getSpellListLevels`: spell circles + circles with slots), so a circle the
  character has not reached never appears and a pick that disappears stops
  narrowing by itself. The prepared chip is skipped when the book is empty
  (innate spells only) and keeps prepared cantrips alongside prepared spells.
- Weapon attack & damage rolled straight from their tiles in the equipment list
  (damage dice come from the item `/raw` response). A versatile weapon also
  keeps the second roll of that response, and the row action menu switches its
  grip — taken in two hands it rolls the bigger die on the tile, in the roll and
  in the PDF attack table, and the row is marked with a «Двумя руками» badge.
  Weapons added before the second roll was stored do not offer the switch until
  they are added from the catalog again.
- Armour that hampers hiding (`armor.stealth` of the workshop form — plate, half
  plate, chain mail and the rest) opens the Stealth check with disadvantage
  already set. It reaches the roll as the ordinary `skill.stealth.disadvantage`
  flag (`getSheetRollFlags`), so advantage from any effect cancels it by the 5e
  rule instead of stacking, and every equipped suit counts — unlike AC, where
  only the best one does. The AC tile's tooltip names the disadvantage, and the
  homebrew item form carries its own checkbox so editing a copy of a catalogue
  suit does not silently drop it. Sheets saved before the field existed keep a
  snapshot that cannot tell padded armour (disadvantage) from leather (none), so
  the seven PHB suits are restored by catalogue url on load
  (`LEGACY_STEALTH_DISADVANTAGE_ARMOR_URLS`).
- Spell damage rolled from the same kind of tile on the spells tab. The formulas
  (`8к6@dmg.fire`) are not stored in the sheet: `composables/useSpellDamage.ts`
  pulls them from the spell `/raw` response on demand and caches them per app,
  so old sheets and innate spells get the tile too. A roll of a levelled spell
  also spends a slot of its circle — cantrips and circles the class does not
  grant spend nothing, and an exhausted circle warns instead.
- Short & long rest from the header: short rest spends Hit Point Dice one by
  one, adding the Constitution modifier to every roll; long rest refills hit
  points, spell slots, feature counters and every spent Hit Point Die (the 2024
  rules return all of them, not half), and removes one Exhaustion level. The
  shared `SheetHitDiceSelect` picks which dice.
- The resources panel («Ресурсы») holds three kinds at once: the ones the
  reference declares (a class, its feature, a species or a feat — all through
  `mechanics.counters`), the ones derived from a class table, and the player's
  own. A own resource can tie its maximum to the sheet instead of a fixed
  number — proficiency bonus, an ability modifier or the character level, each
  with a signed offset («бонус мастерства минус один» of «Слабокровный») and a
  floor (`min`) that props the result up without adding to it: Bardic
  Inspiration equals the Charisma modifier but never drops below one. The rule
  is stored (`maxRule`), the number is not: `getResourceMax` computes it on
  every read, so the maximum grows with the character on the panel, on rest and
  in the PDF alike. Reference resources parse the formula (`@prof`, `@level`,
  `@mod.<abbr>`) into the same rule through `parseResourceMaxFormula`, and their
  recovery becomes a rest rule per rest kind — `SHORT_REST_ONE` means one charge
  back on a short rest and all of them on a long one («Второе дыхание»).
  A class table column stops being a resource: the workshop no longer offers
  `resourceRecovery` on it, and `deriveClassResources` reads the old ones only
  until their class is saved again. A resource marked «Указать в таблице»
  (`showInTable`) comes back as a table column instead — the reference derives
  the per-level row from the resource's own steps or formula (`@prof`,
  `@level`), so the numbers live in one place; a maximum that depends on an
  ability modifier has no single row and gets no column.
- Exhaustion sits in its own panel right below the health one
  (`SheetExhaustionPanel`): six steps, a click sets that level and a click on
  the current one drops it by one (`setExhaustion`, a play action — a locked
  sheet still allows it, a shared one does not). Each step spells out what it
  costs (`getExhaustionSummary`: −2 per level on every D20 test, −5 ft of Speed
  per level, death on the sixth) and the panel header opens the rule list.
- Exhaustion is applied, not just displayed. The D20 penalty
  (`getExhaustionD20Penalty`) is subtracted once per roll at each site that
  produces one — skills (so passive scores drop too), saving throws, initiative
  (a Dexterity check in 2024), weapon and spell attacks, and the ability-check
  roll (`getAbilityCheckValue`; the ability modifier itself stays intact, it also
  feeds AC, hit points and the spell save DC, which are not D20 tests). The
  Speed penalty gives `getEffectiveSpeed` — what the tile and the PDF show, while
  the speed editor keeps writing the stored values; it counts in the sheet's own
  unit (`EXHAUSTION_SPEED_PENALTY_BY_UNIT`: 5 ft = 1.5 m, road miles and
  kilometres untouched). The skill hint and the initiative section of the sheet
  settings show the penalty as its own line, so the numbers add up. The level
  lives in `health.exhaustion`, so it is saved by the usual autosave and sheets
  stored before it read as `0`; the PDF prints it as a combat tile.
- Ability settings (`SheetAbilityModal`, opened by the gear next to the tile
  title — the same reveal-on-hover control every other panel has — or by a long
  press on the tile itself): the written score plus any number of
  `CharacterCustomBonus` rows on top (`SheetCustomBonusRows` with a narrowed
  source list, `ABILITY_BONUS_SOURCE_OPTIONS` — a flat number, the proficiency
  bonus or a level; an ability modifier is no summand of a score and a pair of
  such bonuses would send the maths round in circles). The bonus raises the score itself, so
  it flows through `getEffectiveAbilities` / `getAbilityModifier` into every
  derived number — modifier, saving throws, skills and their passive values, AC,
  attacks, spellcasting, carrying capacity and the PDF — exactly like an item
  bonus, hit points excluded for the same reason. The proficiency-bonus kind is
  counted on a character stripped of these bonuses (`toBaseAbilityCharacter`),
  since the proficiency bonus itself may take an ability modifier and the two
  would otherwise call each other forever. The tile shows the total, underlines
  nothing but explains itself in the tooltip (`getAbilityScoreHint` — the written
  score, every item by name, every bonus by its label), while ± and the score
  field keep editing the written value. Sheets saved before them read empty lists.
- Skill settings (`SheetSkillsSettingsModal`, opened by the gear next to the
  «Навыки» panel title — revealed on hover and always visible below `lg`, like
  every other edit control of the sheet): every skill gets its ability picked
  (the roll, the passive value and the PDF follow it), its proficiency level
  cycled and any number of `CharacterCustomBonus` rows on top
  (`SheetCustomBonusRows` again). A changed skill is outlined and can be reset
  to the rules in one click (`getDefaultSkillAbility`), and in the panel its
  modifier is underlined with a tooltip breaking the value down
  (`getSkillBonusHint`: ability + proficiency + every bonus). The bonuses live
  in `skill.bonuses` and flow through `getSkillValue`, so they reach the roll,
  the passive value and the PDF; sheets saved before them read an empty list.
- The same modal adds skills of your own (a name plus an ability, up to
  `CUSTOM_SKILLS_MAX` — the PDF prints them under their ability and the panel
  there is not endless). A custom skill lands in the shared list sorted by name
  (`sortSkillsByName`), behaves like any other one — proficiency, bonuses, roll,
  passive value, PDF — and is told apart by its name alone: whatever is not in
  the sheet template is custom (`isCustomSkill`), so the row offers deletion
  instead of a reset. Names are compared loosely (case, «ё», spacing) so the
  same skill cannot be added twice.
- Hovering an ability tile (or reaching it with the keyboard) highlights every
  skill that ability feeds: its own ones and those taking a
  `CharacterCustomBonus` of the «ability modifier» kind from it
  (`SkillRow.bonusAbilities`). Only the row's own ability also gets its label
  coloured, so a highlight coming through a bonus is still told apart. The tile
  reads its element through the component ref (`useElementHover`, `onLongPress`),
  which is why `SheetPanel` must stay single-root — a comment before its
  `fieldset` makes the root a fragment in dev builds and quietly kills both.
- Saving-throw settings (`SheetSavingThrowsSettingsModal`, opened by the gear
  next to the «Спасброски» panel title — the same reveal-on-hover control the
  skills panel has): each of the six gets its ability picked, its proficiency
  toggled and any number of `CharacterCustomBonus` rows on top, and above them
  all sits a shared «Ко всем спасброскам» block whose bonuses count in every one
  (`commonSavingThrowBonuses` — a cloak of protection or a paladin's aura is
  entered once instead of six times). A changed saving throw is outlined and
  reset to the rules in one click (`toDefaultSavingThrow`; proficiency is left
  alone — it comes from the class, not from the maths), and in the panel its
  value is underlined with a tooltip breaking it down
  (`getSavingThrowBonusHint`: ability + proficiency + every bonus + exhaustion).
  Everything flows through `getSavingThrowValue`, so the roll and the PDF follow
  it. Storage moved from the flat `savingThrowProficiencies` list of abilities to
  a `savingThrows` record per ability (`CharacterSavingThrow`); the legacy list is
  migrated on read (`toSavingThrows` in `character-schema.ts`) and the records are
  always six in sheet order. Picking a class rewrites only the proficiencies
  (`withSavingThrowProficiencies`), so a swapped ability and its bonuses survive.
- Sheet settings (`SheetSettingsModal`, opened from the sheet header and from the
  list card) split into two tabs: «Атака оружием» (base attack ability) and
  «Свои бонусы». The second tab holds two identical sections
  (`SheetCustomBonusSection`) — proficiency bonus and initiative — each showing
  three tiles (base · own bonuses · total) over the editable bonus rows.
- Section base: the base tile is also its own control, so nothing is shown twice
  — the tile is a button captioned with the current source, and a pencil revealed
  on hover (`SHEET_REVEAL_CONTROL_CLASS`, as on the sheet panels) opens a popover
  with the source and the value. By default the proficiency bonus is derived from
  the level and initiative from the Dexterity modifier, but the popover swaps
  either one for a flat number (`customProficiencyBase`,
  `customInitiativeBase`), and initiative can be based on any other ability
  (`initiativeAbility`) — `null` in all three means «по правилам», so old sheets
  keep counting as before. Read them via `getBaseProficiencyBonus` /
  `getInitiativeAbility` / `getBaseInitiativeBonus`, never by hand.
- Section bonuses: unlimited rows (`SheetCustomBonusRows`) added on top of the
  base, so the proficiency total flows into saving throws, skills, weapon attacks
  and spellcasting (`getCharacterProficiencyBonus`) and the initiative total into
  the tile, its roll and the PDF (`getInitiativeBonus`). A row is one
  `CharacterCustomBonus` — the record skills use as well: an optional label plus
  a source. That source is a flat number, an ability (its modifier is taken
  automatically and follows the ability afterwards), the proficiency bonus, the
  character level or the level of one class — everything but the flat number
  grows with the character, and the class levels are collected from the sheet
  itself (`getCustomBonusSourceOptions`), so a class dropped from the sheet
  leaves its bonus counting zero (`getCustomBonusesValue`). The proficiency
  bonus is no summand of itself (`PROFICIENCY_BONUS_SOURCE_OPTIONS`), or the
  count would never end. Sheets saved with the earlier single number migrate
  it into one number row; sheets saved before the bonuses existed read them as an
  empty list. Drafts are cleaned on save (`toStoredSettings`): a cleared input
  reads as `NaN`, and the proficiency bonus would spread it across the sheet.

**Sharing**

- Share-by-link from the header action menu: the owner issues / revokes a token
  and guests open `/tools/character-sheet/shared/<token>` — access is decided by
  the token, not the session — in a read-only mode with no autosave. Of the
  section pages only `/:id` keeps an auth guard: the list page is public and
  swaps its private content for a sign-in prompt when there is no session.
- A viewer with access to the tool gets two extra items in the header action
  menu of a shared sheet: **copy** the document into their own sheets
  (`copyShared`, no backend of its own — a plain `POST` of the copied document)
  or **save the link** into the «Другие листы» section (`saved/`, `/…/saved`
  endpoints, server-side limit of 4, subscription-ready). The token the sheet
  was opened by lives in `useCharacterSheetShare().viewedShareToken` — the
  public endpoint never returns one.
- Saved links stay read-only and behave like own cards — drawer in standard
  mode, right panel in wide mode via `?detail=shared:<token>`, «↗» to the shared
  page. A revoked or deleted sheet keeps a dimmed card explaining the loss
  instead of disappearing.

### 📰 Content & publishing

| Domain           | Purpose                                                                                                                                                                                                                                                                                                     | Sub-features                                                                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles`       | News/article publishing (`NEWS`/`ARTICLE`; draft·active·scheduled·link-access flags); markup content. Public `/articles`, `/news`                                                                                                                                                                           | `admin`, `body`, `card`, `drawer`, `editor`, `link`, `listing`, `preview`, `model`                                                                                                                                                                                         |
| `home`           | Landing-page building blocks composed on `pages/index.vue`                                                                                                                                                                                                                                                  | `news`, `articles` (separate index block from `news`), `sections`, `banners` (VTTG promo card above the tools block), `tools` (compact tools card, role-gated items), `community`, `counters`, `greetings`, `recent-changes`, `background`, `social-links`, `link-to-5e14` |
| `workshop`       | Content-creation admin (`/workshop/*`, ADMIN or MODERATOR): reusable form engine + section entry cards + revision history. `useWorkshopForm` keys its `useState` by `actionUrl` — without a key every section would share one state object, and a form would briefly render on the previous section's shape | `composable` (`useWorkshopForm`), `section`, `revision`                                                                                                                                                                                                                    |
| `active-effects` | Shared «Активные эффекты» editor in the VTTG vocabulary — one model + one form for every section that changes sheet numbers: spells, feats, magic items, items, backgrounds, species, classes and creatures                                                                                                 | `editor` (`ActiveEffects` card, per-effect tabs, changes/flags/damage parts), `model` (types & Zod, change & flag menus, PHB 2024 condition templates, `describeActiveEffect`)                                                                                             |
| `roadmap`        | Project roadmap (`/roadmap`): feature cards with community ratings + admin editor                                                                                                                                                                                                                           | `feature`, `detail`, `editor`, `preview`, `types`                                                                                                                                                                                                                          |
| `comments`       | Threaded discussions on wiki & article pages via external **comments-service**; public read, auth to post, soft-delete tombstones, reports                                                                                                                                                                  | `section` (page block + feed), `admin` (moderation rows), `my` (own comments + replies to them in profile), `recent` (site-wide feed on `/comments`), `composables`, `model`                                                                                               |

### 🛡️ Admin & moderation

| Domain       | Purpose                                                                                                                                                                                                                                                                       | Sub-features                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `admin`      | Admin panel (`/admin`, ADMIN-only): dashboard tiles, top nav, live presence, character-sheet counts, personas, subscriptions & promo codes, bulk code mailing (`/admin/mailing`), users. Pages also cover article CRUD (`articles/admin`) and tokenator frame upload/ordering | `character-sheets`, `dashboard`, `mailing`, `navigation`, `online`, `personas`, `subscriptions`, `users` |
| `moderation` | Moderator panel (`/moderation`, ADMIN or MODERATOR): dashboard routing to bug triage & comment moderation                                                                                                                                                                     | `model` (routes + dashboard labels)                                                                      |
| `bug-report` | Bug reporting (screenshot + annotate + text-selection + formatted description → submit) + admin triage/rating + author's own reports in profile                                                                                                                               | `modal`, `selection`, `sidebar-button`, `admin`, `my`, `composables`, `model`                            |

### 👤 User & account

| Domain    | Purpose                                                                                                                                                            | Sub-features                                                  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `profile` | User cabinet (`/user/profile`, USER role; bare `/user` redirects there): tabbed account wired to subscription/rewards, display name instead of login in `settings` | `sidebar`, `general`, `activation`, `security`, `settings`    |
| `user`    | Auth entry points in the app shell                                                                                                                                 | `auth-modal` (login/register), `helmet` (profile-helmet menu) |

> **Display name.** The name is owned by **core-api**, not by the JWT: the server
> reads it via `server/utils/displayName.ts` and pushes it to comments through
> the internal `X-Service-Token` API (`server/utils/commentsRename.ts`,
> `POST /api/user/comments/sync-name`, scoped by `SOURCE_PLATFORM`).

### 🌐 Landing & infrastructure

| Domain           | Purpose                                                                     | Sub-features                                                                                                                                                                                                                                                               |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vttg`           | Marketing landing for the VTTG virtual tabletop (`/vttg`) + build downloads | `model`, `ui` (hero / features / FAQ / video sections, `VttgDownloadModal` — early-access notice behind the hero «Скачать» button, `VttgDownloadBuilds` — per-platform rows with their own version), `composables` (`useVttgBuilds` — every build from the update channel) |
| `infrastructure` | Cross-cutting app shell & chrome                                            | `sidebar`, `search`, `filter`, `list-presentation`, `footer`, `cookie-consent`, `pwa`                                                                                                                                                                                      |

### Anatomy of a Feature (Example: `tokenator`)

```
app/features/tokenator/
├── canvas/                     # "Canvas" Feature
│   ├── TokenatorCanvas.vue     # Root component: [Domain][Feature].vue
│   ├── ui/                     # Feature UI components
│   └── index.ts                # Public API
├── controls/                   # "Controls" Feature
│   ├── TokenatorControls.vue   # Root component: [Domain][Feature].vue
│   ├── composables/            # Composables NEXT TO model, not inside
│   ├── ui/                     # Internal UI components
│   └── index.ts                # Public API
├── model/                      # Shared domain model
│   ├── consts.ts               # Constants
│   ├── types.ts                # Types
│   ├── db.ts                   # IndexedDB (Dexie)
│   ├── utils/                  # Model utilities
│   └── index.ts                # Public API
├── preview/                    # "Preview" Feature
│   ├── TokenatorPreview.vue    # Root component: [Domain][Feature].vue
│   ├── ui/
│   └── index.ts
└── composables/                # Domain-level composables
```

Each sub-feature exposes a public API through its `index.ts` barrel and is
imported via the auto-generated `~<domain>` alias (see
[modules/auto-aliases.ts](./modules/auto-aliases.ts)).

---

## 🎨 Shared UI Kit (`app/shared/ui/` — 32 components)

**UI Components Priority:** Nuxt UI → `shared/ui` → `features/*/ui`

| Component         | Purpose                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | Inline titled action block (markup)                                                                                                                                                                                                               |
| `affiliation`     | Comma-separated links to related entities (spell classes, feat backgrounds)                                                                                                                                                                       |
| `animated-number` | Count-up animated number                                                                                                                                                                                                                          |
| `card`            | Workshop entity card                                                                                                                                                                                                                              |
| `collapse`        | Collapsible / accordion primitive                                                                                                                                                                                                                 |
| `copy-button`     | Copy-to-clipboard buttons: share link + copy entity as Markdown                                                                                                                                                                                   |
| `damage-formula`  | VTTG damage/heal formula input & parts editor (spells, weapons, active effects)                                                                                                                                                                   |
| `date-picker`     | Date/time picker input                                                                                                                                                                                                                            |
| `detail-pane`     | Wide-mode entity detail panel                                                                                                                                                                                                                     |
| `drawer`          | Overlay drawer (+ header/body/title/actions, DrawerCollection)                                                                                                                                                                                    |
| `editor`          | Workshop form controls (array/form controls, ability mastery, `EditorNestedSection` — the nesting rail)                                                                                                                                           |
| `gallery`         | LightGallery image viewer                                                                                                                                                                                                                         |
| `grouped-list`    | Grouped/sorted entity grid list                                                                                                                                                                                                                   |
| `icon`            | SVG icon / logo / loader / hamburger                                                                                                                                                                                                              |
| `image-crop`      | Square-crop editor modal for an uploaded image (move / resize the frame)                                                                                                                                                                          |
| `input`           | URL input field                                                                                                                                                                                                                                   |
| `kbd-shortcut`    | Keyboard shortcut hint display                                                                                                                                                                                                                    |
| `link`            | Card & small entity links                                                                                                                                                                                                                         |
| `markup`          | Custom `{@...}` markup parser/renderer + Homebrewery Markdown converter                                                                                                                                                                           |
| `markup-editor`   | Tiptap markup WYSIWYG editor (+ insert panel/toolbar, `preset` full/basic)                                                                                                                                                                        |
| `page`            | Page grid / actions / result / legend scaffolding                                                                                                                                                                                                 |
| `pagination`      | Page-number pagination control                                                                                                                                                                                                                    |
| `placeholder`     | Dashed empty-state placeholder                                                                                                                                                                                                                    |
| `rating`          | Star rating widget                                                                                                                                                                                                                                |
| `result`          | Status/result screen (404 / 403 / error / info)                                                                                                                                                                                                   |
| `section`         | Section content + sidebar layout parts                                                                                                                                                                                                            |
| `select`          | Domain `USelectMenu` wrappers (41 `Select*.vue`, e.g. class, spell level, damage type); catalog-backed ones (items, spells, feats, species, backgrounds) open `CatalogPickerModal` instead — section filters on the left, paged list on the right |
| `skeleton`        | Link skeleton loaders                                                                                                                                                                                                                             |
| `source-tag`      | Sourcebook source/group tag badge                                                                                                                                                                                                                 |
| `tooltip`         | Info tooltip                                                                                                                                                                                                                                      |
| `updates-dot`     | Unread-updates indicator dot                                                                                                                                                                                                                      |
| `upload`          | Image & gallery upload widgets                                                                                                                                                                                                                    |

---

## 🖥️ Cross-cutting client layer

- **Composables** (`app/composables/`) — layout & navigation glue: the Wide/split
  mode triad (`useLayoutWidth` → `useSectionDetail` / `useSectionDetailRedirect`
  / `useSectionLink`) switches entities between an overlay drawer and a
  `?detail=` query pane, joined by `useOpenEntityPath` and `useSectionListScroll`;
  plus `useUser` / `useUserRoles`, `useTheme`, `useDrawer`, `useAnchorScroll`,
  `useBreakpoints`, `useCanvasExport`, `useCommentsNameSync` (fire-and-forget
  display-name sync after renaming or posting), `useCopyAndShare`, `useDayjs`,
  `useEntityMarkdown` (lazy Markdown getter for the section copy buttons),
  `useImageUpload` (validate → `/s3/upload` → delete/copy, used by
  `shared/ui/upload` and the character-sheet avatar), `useImageCrop` (square
  crop geometry + canvas export for `shared/ui/image-crop`),
  `useResizableHeight`, `useSidebarPopover` (21 in total).
- **Plugins** (`app/plugins/`) — `anchorScroll.client`, `dayjs`,
  `online-heartbeat.client` (30 s presence ping), `scrollBehavior`, `scrollbarWidth`.
- **Middleware** (`app/middleware/`) — `auth.global` (role guard vs
  `route.meta.auth.roles`), `close-overlay.global`.
- **Utils** (`app/utils/`) — `convertKeyboardLayout` (QWERTY → ЙЦУКЕН, used by the
  character-sheet catalog search),
  `createLruCache`, `downloadBlob` (blob → file, used by `useCanvasExport` and
  the character-sheet JSON/PDF export), `getOrigin`, `getSeoImageUrl`,
  `getSlicedString`, `icons` (build-time SVG glob), `modifier` (ability-score
  math), `preventRouting`, `zod` (Russian-localized).

---

## 🔒 Server layer (`server/`)

Thin Nitro layer that proxies to external microservices and handles auth,
uploads and presence.

| Area                                    | Responsibility                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/[...].ts`                          | Catch-all proxy (`getProxyPath`) → `subscriber-service` for `/api/subscriptions` & `/api/rewards`, `comments-service` for `/api/v1/comments`, otherwise `core-api`                                                                                                                                                                                                                |
| `api/auth/*`                            | Sign-in/up, logout, me, email confirm, password reset/change, roles, admin users — proxied to **auth-service**                                                                                                                                                                                                                                                                    |
| `api/admin/*`                           | Admin bug list/status/filter options (author & status-updater logins), subscription grant/revoke/codes, comment hide/restore by author — ADMIN-gated proxies to bug-report, subscriber & comments services (the last via `X-Service-Token` internal API, not the user JWT)                                                                                                        |
| `api/admin/mailing/*`                   | Bulk promo-code mailing (ADMIN-only): issues one code per address through the subscriber admin API and sends a personal letter over SMTP (`utils/mailer`, `utils/mailingTemplate`, SMTP env shared with auth-service: `SPRING_MAIL_*` + `APP_MAIL_FROM`); `test` sends a sample letter without issuing a code                                                                     |
| `api/bug-report*`                       | Create report (streams multipart), public stats, my count-by-status, my reports list + updates summary (both strip `statusUpdatedBy`/`userLogin`/`sessionId` via a Zod allow-list) → external **bug-report** service                                                                                                                                                              |
| `api/user/comments/sync-name`           | Best-effort display-name sync: reads the name from core-api, then renames the author's comments through the comments internal API, scoped by `SOURCE_PLATFORM`                                                                                                                                                                                                                    |
| `api/online`, `routes/online/heartbeat` | Presence heartbeat + stats via **online-app**                                                                                                                                                                                                                                                                                                                                     |
| `api/vttg/builds`, `domain/vttg`        | All VTTG builds: reads every manifest of the update channel (`runtimeConfig.vttg.updateBaseUrl`) — electron-updater `latest*.yml` for desktop, `latest-node-linux-*.json` / `latest-docker.json` for server — and returns version / size / download links per platform, cached by Nitro. A missing manifest (platform not released yet) yields an empty build instead of an error |
| `domain/s3`, `routes/s3/*`              | S3 upload (image compression via sharp) / get / delete / copy (new key for a duplicated entity)                                                                                                                                                                                                                                                                                   |
| `routes/manifest.json`                  | Theme-aware PWA manifest from `runtimeConfig.pwa`                                                                                                                                                                                                                                                                                                                                 |
| `middleware/`                           | `001` verify access JWT + silent single-flight refresh, `002` inject `Bearer` from cookie                                                                                                                                                                                                                                                                                         |
| `utils/`                                | Service clients (auth / auth-admin / subscriber-admin / comments-admin / bug-report), `displayName` + `commentsRename`, `getUser` / `getTokenFromRequest`, `secrets` (env accessor), JWT (jose), proxy, error normalization, image compression                                                                                                                                    |

**Backend topology:** `core-api` (default), `auth-service` (auth), `subscriber-service`
(subscriptions/rewards), `comments-service` (discussions, `NITRO_COMMENTS_API_URL`),
`online-app` (presence), external `bug-report` service.
Access token in cookie `ttg-user-token`, refresh in httpOnly `ttg-user-refresh-token`.

---

## ⚙️ Configuration & Infrastructure Control

| File / Folder             | Purpose                                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`               | **Primary source of coding rules and style**                                                                                                          |
| `CLAUDE.md`               | Entry point for AI agents — points to `AGENTS.md`, this map and the skills                                                                            |
| `README.md`               | Human-facing overview: stack, quick start, scripts, checks before a PR                                                                                |
| `CONTRIBUTING.md`         | CLA, Conventional Commits, PR rules                                                                                                                   |
| `.agents/skills/`         | **Directory containing AI agents skills**                                                                                                             |
| `docs/`                   | Author-facing guides (e.g. `markup-formatting-guide.md` for `{@...}` markup)                                                                          |
| `nuxt.config.ts`          | Nuxt configuration: modules, security/CSP, robots, per-route rate limiter (`routeRules`), `~ui` alias, prosemirror dedupe for tiptap, `runtimeConfig` |
| `app/app.config.ts`       | Nuxt UI configuration (icons, variants)                                                                                                               |
| `modules/auto-aliases.ts` | Generates `~<domain>` aliases from `app/features/`                                                                                                    |
| `eslint.config.ts`        | ESLint (via @svifty7/eslint-config)                                                                                                                   |
| `stylelint.config.js`     | Stylelint (clean-order)                                                                                                                               |
| `nano-staged.js`          | Pre-commit staged-file hooks (`simple-git-hooks`)                                                                                                     |
| `Dockerfile`              | Production image built by the deploy workflow                                                                                                         |
| `.editorconfig`           | LF, 2 spaces, final newline                                                                                                                           |
