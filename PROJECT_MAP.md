# 🗺️ TTG Club Core App — Project Map

> **Purpose:** Online D&D 5e reference **and toolset** — reference content
> (species, classes, spells, bestiary, magic items, items, feats, backgrounds,
> glossary, sources), interactive tools (tokenator, dice roller, ability
> calculator, initiative tracker, character sheet), news/articles publishing,
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
│   │   ├── consts/                 # Global constants (levels, layout-width, theme, fetch-status)
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
│   ├── consts/                     # Cookie/theme keys, durations, source platform (`SITE_5E24`)
│   ├── types/                      # auth (JWT payload), vttg (desktop release DTO)
│   └── utils/                      # consola, env, faker, slug, plural, status message, sort, error response
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

| Domain        | Purpose                                            | Notable extras                                                       |
| ------------- | -------------------------------------------------- | -------------------------------------------------------------------- |
| `species`     | Races/species with nested lineages (sub-races)     | `lineages`, `lineages-drawer`                                        |
| `classes`     | Classes, subclasses & multiclass builder           | `multiclass-drawer`, `subclasses-drawer` (body = Class + Multiclass) |
| `spells`      | Spells; class-grouped infinite-scroll list         | `groups`, `composable` (class pagination), `legend`                  |
| `bestiary`    | Creatures grouped by challenge rating; stat blocks | `composable` (CR group order)                                        |
| `magic-items` | Magic items grouped by rarity                      | `composable` (rarity order), `legend` (attunement)                   |
| `backgrounds` | Character backgrounds                              | —                                                                    |
| `feats`       | Feats                                              | —                                                                    |
| `glossary`    | Rules terms / glossary                             | —                                                                    |
| `items`       | Mundane items & equipment                          | —                                                                    |
| `sources`     | Source books (publisher/translation, tags)         | model layer is named `types/` (not `model/`)                         |

### 🛠️ Interactive tools

| Domain            | Purpose                                                                                                                                                                             | Sub-features                                                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenator`       | Canvas VTT token generator (`/tokenator`): mask/frame/tint/text/3D lighting, export. Dexie (IndexedDB) + Pinia store                                                                | `canvas`, `controls`, `preview`, `model`, `composables`                                                                                  |
| `dice-roller`     | Dice-notation roller w/ crit detection + history; float/sidebar toggle, inline links, modal                                                                                         | `modal`, `float-button`, `sidebar-button`, `link`, `composables`, `model` (+ legacy `const.ts` / `types.ts` / `utils.ts` at domain root) |
| `calculator`      | Character-math tools container (`/calculators/abilities`)                                                                                                                           | `abilities` — ability-score calc (Point Buy / Standard Array / Random Roll)                                                              |
| `initiative`      | Initiative tracker (`/tools/initiative[/:id]`): participants, HP/AC editing, bestiary lookup; anonymous slot in localStorage + `X-Tracker-Key`                                      | `list`, `workspace`, `ui-kit`, `composables`, `model`                                                                                    |
| `character-sheet` | D&D 2024 character sheet (`/tools/character-sheet[/:id]`; the list page is public and shows a sign-in prompt to guests, creating/saving needs an account) — see the breakdown below | `body`, `list`, `controls`, `drawer`, `composables`, `model`                                                                             |

#### `character-sheet` in detail

The largest tool domain (`body/ui` alone holds 50+ `Sheet*.vue` panels and
modals), so its capabilities are listed here rather than squeezed into the table.

**Sheet lifecycle**

- Wizards for species / class / background; rolls go through `dice-roller`
  (universal `SheetRollModal`).
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
- Level-up wizard inside the experience modal (`composables/useLevelUpWizard.ts`):
  one step per gained level with its own hit-point mode (average / roll / max),
  the class and subclass features of that level with their choices, and the
  subclass picker at level 3 filtered by the profile sources on the client
  (`/classes/{url}/subclasses` ignores `source`). Applied atomically by
  `applyLevelUp`, which keeps spent hit dice and class resources.
- Every skill picker (`SheetChoiceSelect` in the class / species / background
  wizards, in level-up features and in the homebrew class / background modals)
  marks skills the character already has with a `SKILL_OWNED_HINTS` badge and
  shows `SKILL_DUPLICATE_WARNING` once such a skill is picked again: under the
  2024 rules a duplicate proficiency grants nothing and never turns into
  Expertise. It stays selectable on purpose — a DM may still run the 2014
  «take another proficiency instead» rule.
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
  maps abilities, skills, hit points, resources, coins and text blocks (traits
  and feats become sheet features, the rest become notes), and `catalog.ts`
  matches class, subclass, species, background and every equipment line against
  the site catalogs by name — anything not found stays a homebrew entry. Spells
  cannot be carried over (the file keeps only LSS-internal ids), so the import
  says so in a toast.
- PDF export from the same action menu. `model/pdf` draws its own vector layout
  close to the official D&D 2024 sheet with Russian labels: main page,
  equipment, spells, and a reference section with full descriptions.
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
  weapons roll attack & damage).
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
  compete. Sheets saved before the fields existed read them as `0`.
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

**Play**

- Spell slots derived from the reference `casterType` of the class/subclass
  (full / half / third caster, warlock pact magic) plus the character level;
  spent by clicking the circles in each spell-level divider.
- Prepared-spell count on the spells tab, next to the save DC / attack tile. The
  reference class table has it as a column («Подг. закл.», matched by letters
  because the wording is abbreviated differently per class and sometimes lives
  only on the subclass), so its progression is snapshotted into the sheet by the
  class wizard and refreshed by every level-up; the tile shows the value for the
  current level. Clicking it opens the settings: either a custom number (the
  class count is then ignored) or a bonus added to the class count. The tile
  reads «marked / allowed» (`4 / 17`) and turns red when the allowance drops
  below what is already marked.
- Prepared spells marked by clicking the spell icon in the row — the same
  gesture as equipping armour. Only the icon square lights up (the row itself
  keeps its usual look), the flag lives in `spell.prepared`, and marking more
  than the allowed number warns instead. Cantrips and innate spells are always
  available, so their icon toggles nothing; with no allowance known (the class
  gives none and no custom number is set) marking is unlimited.
- Spell list narrowed by a chip row above the groups: «Подготовленные» plus one
  chip per circle (cantrips as «З», the full name in the tooltip), several
  circles at a time, and a reset button once anything is picked. Nothing is
  stored — the chips are derived from what the list already shows
  (`getSpellListLevels`: spell circles + circles with slots), so a circle the
  character has not reached never appears and a pick that disappears stops
  narrowing by itself. The prepared chip is skipped when there is nothing to
  prepare (cantrips or innate spells only).
- Weapon attack & damage rolled straight from their tiles in the equipment list
  (damage dice come from the item `/raw` response). A versatile weapon also
  keeps the second roll of that response, and the row action menu switches its
  grip — taken in two hands it rolls the bigger die on the tile, in the roll and
  in the PDF attack table, and the row is marked with a «Двумя руками» badge.
  Weapons added before the second roll was stored do not offer the switch until
  they are added from the catalog again.
- Spell damage rolled from the same kind of tile on the spells tab. The formulas
  (`8к6@dmg.fire`) are not stored in the sheet: `composables/useSpellDamage.ts`
  pulls them from the spell `/raw` response on demand and caches them per app,
  so old sheets and innate spells get the tile too. A roll of a levelled spell
  also spends a slot of its circle — cantrips and circles the class does not
  grant spend nothing, and an exhausted circle warns instead.
- Short & long rest from the header: short rest spends Hit Point Dice one by
  one, adding the Constitution modifier to every roll; long rest refills hit
  points, spell slots, feature counters and half the Hit Point Dice. The shared
  `SheetHitDiceSelect` picks which dice.
- Sheet settings (`SheetSettingsModal`, opened from the sheet header and from the
  list card) split into two tabs: «Атака оружием» (base attack ability) and
  «Свои бонусы» — a custom proficiency bonus added on top of the one from the
  level (it flows into saving throws, skills, weapon attacks and spellcasting via
  `getCharacterProficiencyBonus`) and a custom initiative bonus added to the
  Dexterity modifier (`getInitiativeBonus`, used by the tile, its roll and the
  PDF). Sheets saved before the bonuses existed read them as `0`.

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

| Domain     | Purpose                                                                                                                                    | Sub-features                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles` | News/article publishing (`NEWS`/`ARTICLE`; draft·active·scheduled·link-access flags); markup content. Public `/articles`, `/news`          | `admin`, `body`, `card`, `drawer`, `editor`, `link`, `listing`, `preview`, `model`                                                                                                                                                                 |
| `home`     | Landing-page building blocks composed on `pages/index.vue`                                                                                 | `news`, `articles` (separate index block from `news`), `sections`, `banners` (VTTG campaign), `tools` (compact tools card, role-gated items), `community`, `counters`, `greetings`, `recent-changes`, `background`, `social-links`, `link-to-5e14` |
| `workshop` | Content-creation admin (`/workshop/*`, ADMIN or MODERATOR): reusable form engine + section entry cards + revision history                  | `composable` (`useWorkshopForm`), `section`, `revision`                                                                                                                                                                                            |
| `roadmap`  | Project roadmap (`/roadmap`): feature cards with community ratings + admin editor                                                          | `feature`, `detail`, `editor`, `preview`, `types`                                                                                                                                                                                                  |
| `comments` | Threaded discussions on wiki & article pages via external **comments-service**; public read, auth to post, soft-delete tombstones, reports | `section` (page block + feed), `admin` (moderation rows), `composables`, `model`                                                                                                                                                                   |

### 🛡️ Admin & moderation

| Domain       | Purpose                                                                                                                                                                                                                                 | Sub-features                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `admin`      | Admin panel (`/admin`, ADMIN-only): dashboard tiles, top nav, live presence, character-sheet counts, personas, subscriptions & promo codes, users. Pages also cover article CRUD (`articles/admin`) and tokenator frame upload/ordering | `character-sheets`, `dashboard`, `navigation`, `online`, `personas`, `subscriptions`, `users` |
| `moderation` | Moderator panel (`/moderation`, ADMIN or MODERATOR): dashboard routing to bug triage & comment moderation                                                                                                                               | `model` (routes + dashboard labels)                                                           |
| `bug-report` | Bug reporting (screenshot + annotate + text-selection → submit) + admin triage/rating                                                                                                                                                   | `modal`, `selection`, `sidebar-button`, `admin`, `composables`, `model`                       |

### 👤 User & account

| Domain    | Purpose                                                                                                                                                            | Sub-features                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| `profile` | User cabinet (`/user/profile`, USER role; bare `/user` redirects there): tabbed account wired to subscription/rewards, display name instead of login in `settings` | `sidebar`, `general`, `activation`, `security`, `settings`, `statistics`, `connections` |
| `user`    | Auth entry points in the app shell                                                                                                                                 | `auth-modal` (login/register), `helmet` (profile-helmet menu)                           |

> **Display name.** The name is owned by **core-api**, not by the JWT: the server
> reads it via `server/utils/displayName.ts` and pushes it to comments through
> the internal `X-Service-Token` API (`server/utils/commentsRename.ts`,
> `POST /api/user/comments/sync-name`, scoped by `SOURCE_PLATFORM`).

### 🌐 Landing & infrastructure

| Domain           | Purpose                                                                      | Sub-features                                                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vttg`           | Marketing landing for the VTTG virtual tabletop (`/vttg`) + desktop download | `model`, `ui` (hero / features / FAQ / support / video sections, `VttgDownloadPlatforms`), `composables` (`useVttgDesktopRelease` — latest build from the update channel) |
| `infrastructure` | Cross-cutting app shell & chrome                                             | `sidebar`, `search`, `filter`, `list-presentation`, `footer`, `cookie-consent`, `pwa`                                                                                     |

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

## 🎨 Shared UI Kit (`app/shared/ui/` — 28 components)

**UI Components Priority:** Nuxt UI → `shared/ui` → `features/*/ui`

| Component         | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `action`          | Inline titled action block (markup)                                                    |
| `animated-number` | Count-up animated number                                                               |
| `card`            | Workshop entity card                                                                   |
| `collapse`        | Collapsible / accordion primitive                                                      |
| `copy-button`     | Copy-to-clipboard button                                                               |
| `date-picker`     | Date/time picker input                                                                 |
| `detail-pane`     | Wide-mode entity detail panel                                                          |
| `drawer`          | Overlay drawer (+ header/body/title/actions, DrawerCollection)                         |
| `editor`          | Workshop form controls (array/form controls, ability mastery)                          |
| `gallery`         | LightGallery image viewer                                                              |
| `grouped-list`    | Grouped/sorted entity grid list                                                        |
| `icon`            | SVG icon / logo / loader / hamburger                                                   |
| `image-crop`      | Square-crop editor modal for an uploaded image (move / resize the frame)               |
| `input`           | URL input field                                                                        |
| `kbd-shortcut`    | Keyboard shortcut hint display                                                         |
| `link`            | Card & small entity links                                                              |
| `markup`          | Custom `{@...}` markup parser/renderer                                                 |
| `markup-editor`   | Tiptap markup WYSIWYG editor (+ insert panel/toolbar)                                  |
| `page`            | Page grid / actions / result / legend scaffolding                                      |
| `placeholder`     | Dashed empty-state placeholder                                                         |
| `rating`          | Star rating widget                                                                     |
| `result`          | Status/result screen (404 / 403 / error / info)                                        |
| `section`         | Section content + sidebar layout parts                                                 |
| `select`          | Domain `USelectMenu` wrappers (39 `Select*.vue`, e.g. class, spell level, damage type) |
| `skeleton`        | Link skeleton loaders                                                                  |
| `source-tag`      | Sourcebook source/group tag badge                                                      |
| `tooltip`         | Info tooltip                                                                           |
| `upload`          | Image & gallery upload widgets                                                         |

---

## 🖥️ Cross-cutting client layer

- **Composables** (`app/composables/`) — layout & navigation glue: the Wide/split
  mode triad (`useLayoutWidth` → `useSectionDetail` / `useSectionDetailRedirect`
  / `useSectionLink`) switches entities between an overlay drawer and a
  `?detail=` query pane, joined by `useOpenEntityPath` and `useSectionListScroll`;
  plus `useUser` / `useUserRoles`, `useTheme`, `useDrawer`, `useAnchorScroll`,
  `useBreakpoints`, `useCanvasExport`, `useCommentsNameSync` (fire-and-forget
  display-name sync after renaming or posting), `useCopyAndShare`, `useDayjs`,
  `useImageUpload` (validate → `/s3/upload` → delete/copy, used by
  `shared/ui/upload` and the character-sheet avatar), `useImageCrop` (square
  crop geometry + canvas export for `shared/ui/image-crop`),
  `useResizableHeight`, `useSidebarPopover` (20 in total).
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

| Area                                     | Responsibility                                                                                                                                                                                                                                 |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/[...].ts`                           | Catch-all proxy (`getProxyPath`) → `subscriber-service` for `/api/subscriptions` & `/api/rewards`, `comments-service` for `/api/v1/comments`, otherwise `core-api`                                                                             |
| `api/auth/*`                             | Sign-in/up, logout, me, email confirm, password reset/change, roles, admin users — proxied to **auth-service**                                                                                                                                 |
| `api/admin/*`                            | Admin bug list/status, subscription grant/revoke/codes, comment hide/restore by author — ADMIN-gated proxies to bug-report, subscriber & comments services (the last via `X-Service-Token` internal API, not the user JWT)                     |
| `api/bug-report*`                        | Create report (streams multipart), public stats, my count-by-status → external **bug-report** service                                                                                                                                          |
| `api/user/comments/sync-name`            | Best-effort display-name sync: reads the name from core-api, then renames the author's comments through the comments internal API, scoped by `SOURCE_PLATFORM`                                                                                 |
| `api/online`, `routes/online/heartbeat`  | Presence heartbeat + stats via **online-app**                                                                                                                                                                                                  |
| `api/vttg/desktop/latest`, `domain/vttg` | Latest VTTG desktop build: reads `latest.yml` from the electron-updater channel (`runtimeConfig.vttg.desktopUpdateUrl`), returns version / size / installer link, cached by Nitro                                                              |
| `domain/s3`, `routes/s3/*`               | S3 upload (image compression via sharp) / get / delete / copy (new key for a duplicated entity)                                                                                                                                                |
| `routes/manifest.json`                   | Theme-aware PWA manifest from `runtimeConfig.pwa`                                                                                                                                                                                              |
| `middleware/`                            | `001` verify access JWT + silent single-flight refresh, `002` inject `Bearer` from cookie                                                                                                                                                      |
| `utils/`                                 | Service clients (auth / auth-admin / subscriber-admin / comments-admin / bug-report), `displayName` + `commentsRename`, `getUser` / `getTokenFromRequest`, `secrets` (env accessor), JWT (jose), proxy, error normalization, image compression |

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
