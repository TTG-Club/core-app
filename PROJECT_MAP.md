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
  a source that is either a flat number or an ability, whose modifier is then
  taken automatically and follows the ability afterwards
  (`getCustomBonusesValue`). Sheets saved with the earlier single number migrate
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

| Domain     | Purpose                                                                                                                                    | Sub-features                                                                                                                                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles` | News/article publishing (`NEWS`/`ARTICLE`; draft·active·scheduled·link-access flags); markup content. Public `/articles`, `/news`          | `admin`, `body`, `card`, `drawer`, `editor`, `link`, `listing`, `preview`, `model`                                                                                                                                                                                         |
| `home`     | Landing-page building blocks composed on `pages/index.vue`                                                                                 | `news`, `articles` (separate index block from `news`), `sections`, `banners` (VTTG promo card above the tools block), `tools` (compact tools card, role-gated items), `community`, `counters`, `greetings`, `recent-changes`, `background`, `social-links`, `link-to-5e14` |
| `workshop` | Content-creation admin (`/workshop/*`, ADMIN or MODERATOR): reusable form engine + section entry cards + revision history                  | `composable` (`useWorkshopForm`), `section`, `revision`                                                                                                                                                                                                                    |
| `roadmap`  | Project roadmap (`/roadmap`): feature cards with community ratings + admin editor                                                          | `feature`, `detail`, `editor`, `preview`, `types`                                                                                                                                                                                                                          |
| `comments` | Threaded discussions on wiki & article pages via external **comments-service**; public read, auth to post, soft-delete tombstones, reports | `section` (page block + feed), `admin` (moderation rows), `composables`, `model`                                                                                                                                                                                           |

### 🛡️ Admin & moderation

| Domain       | Purpose                                                                                                                                                                                                                                                                       | Sub-features                                                                                             |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `admin`      | Admin panel (`/admin`, ADMIN-only): dashboard tiles, top nav, live presence, character-sheet counts, personas, subscriptions & promo codes, bulk code mailing (`/admin/mailing`), users. Pages also cover article CRUD (`articles/admin`) and tokenator frame upload/ordering | `character-sheets`, `dashboard`, `mailing`, `navigation`, `online`, `personas`, `subscriptions`, `users` |
| `moderation` | Moderator panel (`/moderation`, ADMIN or MODERATOR): dashboard routing to bug triage & comment moderation                                                                                                                                                                     | `model` (routes + dashboard labels)                                                                      |
| `bug-report` | Bug reporting (screenshot + annotate + text-selection → submit) + admin triage/rating                                                                                                                                                                                         | `modal`, `selection`, `sidebar-button`, `admin`, `composables`, `model`                                  |

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

## 🎨 Shared UI Kit (`app/shared/ui/` — 29 components)

**UI Components Priority:** Nuxt UI → `shared/ui` → `features/*/ui`

| Component         | Purpose                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| `action`          | Inline titled action block (markup)                                                    |
| `affiliation`     | Comma-separated links to related entities (spell classes, feat backgrounds)            |
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

| Area                                    | Responsibility                                                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/[...].ts`                          | Catch-all proxy (`getProxyPath`) → `subscriber-service` for `/api/subscriptions` & `/api/rewards`, `comments-service` for `/api/v1/comments`, otherwise `core-api`                                                                                                                                                                                                                |
| `api/auth/*`                            | Sign-in/up, logout, me, email confirm, password reset/change, roles, admin users — proxied to **auth-service**                                                                                                                                                                                                                                                                    |
| `api/admin/*`                           | Admin bug list/status, subscription grant/revoke/codes, comment hide/restore by author — ADMIN-gated proxies to bug-report, subscriber & comments services (the last via `X-Service-Token` internal API, not the user JWT)                                                                                                                                                        |
| `api/admin/mailing/*`                   | Bulk promo-code mailing (ADMIN-only): issues one code per address through the subscriber admin API and sends a personal letter over SMTP (`utils/mailer`, `utils/mailingTemplate`, SMTP env shared with auth-service: `SPRING_MAIL_*` + `APP_MAIL_FROM`); `test` sends a sample letter without issuing a code                                                                     |
| `api/bug-report*`                       | Create report (streams multipart), public stats, my count-by-status → external **bug-report** service                                                                                                                                                                                                                                                                             |
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
