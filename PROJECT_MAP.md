# 🗺️ TTG Club Core App — Project Map

> **Purpose:** Online D&D 5e reference **and toolset** — reference content
> (species, classes, spells, bestiary, magic items, items, feats, backgrounds,
> glossary, sources), interactive tools (tokenator, dice roller, ability
> calculator, initiative tracker), news/articles publishing, page discussions,
> user accounts & subscriptions, admin & moderation, and a VTTG
> virtual-tabletop landing.
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
│   ├── features/                   # 🏗️ DDD domains (26) — core business logic
│   ├── layouts/                    # Layouts: default, detail, section, vttg
│   ├── middleware/                 # Route middleware: auth.global, close-overlay.global
│   ├── pages/                      # 📄 Routes (file-based routing)
│   ├── plugins/                    # anchorScroll, dayjs, online-heartbeat, scrollBehavior, scrollbarWidth
│   ├── shared/                     # 🔧 Global shared layer (FSD-style)
│   │   ├── api/                    # Typed API fetchers (dictionaries/select-options)
│   │   ├── consts/                 # Global constants (levels, layout-width, theme)
│   │   ├── enums/                  # Enums (comparison, …)
│   │   ├── types/                  # base, wiki, user, subscription, upload, composable, abilities, dictionaries
│   │   ├── ui/                     # 🎨 UI Kit (27 components)
│   │   └── utils/                  # Dictionary validation only (`validation/dictionaries.ts`)
│   └── utils/                      # ⚡ Global utilities (auto-import)
├── server/                         # 🔒 Server-side (Nitro)
│   ├── api/                        # HTTP handlers: catch-all proxy + auth/*, admin/*, bug-report, online
│   ├── domain/                     # Server domains: s3 (model / service / utils), online (service only)
│   ├── middleware/                 # 001 validate/refresh token, 002 append auth header
│   ├── routes/                     # manifest.json, online/heartbeat, s3 (upload/get/delete)
│   └── utils/                      # Service clients (auth/admin/subscriber/comments), secrets, JWT, proxy, image compression
├── shared/                         # 📦 Isomorphic shared (client + server)
│   ├── consts/                     # Cookie/theme keys, durations
│   ├── types/                      # auth (JWT payload)
│   └── utils/                      # consola, env, faker, slug, plural, status message, sort, error response
├── modules/                        # 🧩 Nuxt modules
│   └── auto-aliases.ts             # Auto-generation of ~domain aliases from app/features
├── public/                         # Static files
└── .github/workflows/              # CI/CD pipelines
    ├── code-check.yml              # PR checks: stylelint → eslint → type-check
    ├── codeql.yml                  # PR: CodeQL security analysis (TypeScript)
    └── deploy.yml                  # Push main/dev: Docker build → Dokploy deploy
```

---

## 🌍 Domains (DDD Architecture in `app/features/`)

26 feature domains, grouped below by area.

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

| Domain        | Purpose                                                                                                                                            | Sub-features                                                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `tokenator`   | Canvas VTT token generator: mask/frame/tint/text/3D lighting, export. Dexie (IndexedDB) + Pinia store                                              | `canvas`, `controls`, `preview`, `model`, `composables`                                                                                  |
| `dice-roller` | Dice-notation roller w/ crit detection + history; float/sidebar toggle, inline links, modal                                                        | `modal`, `float-button`, `sidebar-button`, `link`, `composables`, `model` (+ legacy `const.ts` / `types.ts` / `utils.ts` at domain root) |
| `calculator`  | Character-math tools container                                                                                                                     | `abilities` — ability-score calc (Point Buy / Standard Array / Random Roll)                                                              |
| `initiative`  | **NEW** — Initiative tracker (`/tools/initiative`): participants, HP/AC editing, bestiary lookup; anonymous slot in localStorage + `X-Tracker-Key` | `list`, `workspace`, `ui-kit`, `composables`, `model`                                                                                    |

### 📰 Content & publishing

| Domain     | Purpose                                                                                                                                              | Sub-features                                                                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `articles` | **NEW** — News/article publishing (`NEWS`/`ARTICLE`; draft·active·scheduled·link-access flags); markup content                                       | `admin`, `body`, `card`, `drawer`, `editor`, `link`, `listing`, `preview`, `model`                                                                                                             |
| `home`     | Landing-page building blocks composed on `pages/index.vue`                                                                                           | `news` (NEW), `articles` (NEW — separate index block from `news`), `sections`, `banners`, `community`, `counters`, `greetings`, `recent-changes`, `background`, `social-links`, `link-to-5e14` |
| `workshop` | Content-creation admin: reusable form engine + section entry cards + revision history                                                                | `composable` (`useWorkshopForm`), `section`, `revision`                                                                                                                                        |
| `roadmap`  | Project roadmap: feature cards with community ratings + admin editor                                                                                 | `feature`, `detail`, `editor`, `preview`, `types`                                                                                                                                              |
| `comments` | **NEW** — Threaded discussions on wiki & article pages via external **comments-service**; public read, auth to post, soft-delete tombstones, reports | `section` (page block + feed), `admin` (moderation rows), `composables`, `model`                                                                                                               |

### 🛡️ Admin & moderation

| Domain       | Purpose                                                                                                                   | Sub-features                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `admin`      | Admin panel (`/admin`, ADMIN-only): dashboard tiles, top nav, live presence, personas, subscriptions & promo codes, users | `dashboard`, `navigation`, `online`, `personas`, `subscriptions`, `users` |
| `moderation` | **NEW** — Moderator panel (`/moderation`, ADMIN or MODERATOR): dashboard routing to bug triage & comment moderation       | `model` (routes + dashboard labels)                                       |
| `bug-report` | **NEW** — Bug reporting (screenshot + annotate + text-selection → submit) + admin triage/rating                           | `modal`, `selection`, `sidebar-button`, `admin`, `composables`, `model`   |

### 👤 User & account

| Domain    | Purpose                                                                           | Sub-features                                                                            |
| --------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `profile` | **NEW** — User cabinet (`/profile`): tabbed account wired to subscription/rewards | `sidebar`, `general`, `activation`, `security`, `settings`, `statistics`, `connections` |
| `user`    | Auth entry points in the app shell                                                | `auth-modal` (login/register), `helmet` (profile-helmet menu)                           |

### 🌐 Landing & infrastructure

| Domain           | Purpose                                                   | Sub-features                                                                                            |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `vttg`           | **NEW** — Marketing landing for the VTTG virtual tabletop | `model`, `ui` (hero / features / FAQ / support / video sections)                                        |
| `infrastructure` | Cross-cutting app shell & chrome                          | `sidebar`, `search`, `filter`, `list-presentation` (NEW), `footer` (NEW), `cookie-consent` (NEW), `pwa` |

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

## 🎨 Shared UI Kit (`app/shared/ui/` — 27 components)

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
  `useBreakpoints`, `useCanvasExport`, `useCopyAndShare`, `useDayjs`,
  `useResizableHeight`, `useSidebarPopover` (17 in total).
- **Plugins** (`app/plugins/`) — `anchorScroll.client`, `dayjs`,
  `online-heartbeat.client` (30 s presence ping), `scrollBehavior`, `scrollbarWidth`.
- **Middleware** (`app/middleware/`) — `auth.global` (role guard vs
  `route.meta.auth.roles`), `close-overlay.global`.
- **Utils** (`app/utils/`) — `createLruCache`, `getOrigin`, `getSeoImageUrl`,
  `getSlicedString`, `icons` (build-time SVG glob), `modifier` (ability-score math),
  `preventRouting`, `zod` (Russian-localized).

---

## 🔒 Server layer (`server/`)

Thin Nitro layer that proxies to external microservices and handles auth,
uploads and presence.

| Area                                    | Responsibility                                                                                                                                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api/[...].ts`                          | Catch-all proxy (`getProxyPath`) → `subscriber-service` for `/api/subscriptions` & `/api/rewards`, `comments-service` for `/api/v1/comments`, otherwise `core-api`                                                         |
| `api/auth/*`                            | Sign-in/up, logout, me, email confirm, password reset/change, roles, admin users — proxied to **auth-service**                                                                                                             |
| `api/admin/*`                           | Admin bug list/status, subscription grant/revoke/codes, comment hide/restore by author — ADMIN-gated proxies to bug-report, subscriber & comments services (the last via `X-Service-Token` internal API, not the user JWT) |
| `api/bug-report*`                       | Create report (streams multipart), public stats, my count-by-status → external **bug-report** service                                                                                                                      |
| `api/online`, `routes/online/heartbeat` | Presence heartbeat + stats via **online-app**                                                                                                                                                                              |
| `domain/s3`, `routes/s3/*`              | S3 upload (image compression via sharp) / get / delete                                                                                                                                                                     |
| `routes/manifest.json`                  | Theme-aware PWA manifest from `runtimeConfig.pwa`                                                                                                                                                                          |
| `middleware/`                           | `001` verify access JWT + silent refresh, `002` inject `Bearer` from cookie                                                                                                                                                |
| `utils/`                                | Service clients (auth / auth-admin / subscriber-admin / comments-admin / bug-report), `secrets` (env accessor), JWT (jose), proxy, error normalization, image compression                                                  |

**Backend topology:** `core-api` (default), `auth-service` (auth), `subscriber-service`
(subscriptions/rewards), `comments-service` (discussions, `NITRO_COMMENTS_API_URL`),
`online-app` (presence), external `bug-report` service.
Access token in cookie `ttg-user-token`, refresh in httpOnly `ttg-user-refresh-token`.

---

## ⚙️ Configuration & Infrastructure Control

| File / Folder             | Purpose                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------ |
| `AGENTS.md`               | **Primary source of coding rules and style**                                         |
| `CLAUDE.md`               | Entry point for AI agents — points to `AGENTS.md`, this map and the skills           |
| `.agents/skills/`         | **Directory containing AI agents skills**                                            |
| `docs/`                   | Author-facing guides (e.g. `markup-formatting-guide.md` for `{@...}` markup)         |
| `nuxt.config.ts`          | Nuxt configuration (modules, security/CSP, Nitro proxy, rate limiter, runtimeConfig) |
| `app/app.config.ts`       | Nuxt UI configuration (icons, variants)                                              |
| `modules/auto-aliases.ts` | Generates `~<domain>` aliases from `app/features/`                                   |
| `eslint.config.ts`        | ESLint (via @svifty7/eslint-config)                                                  |
| `stylelint.config.js`     | Stylelint (clean-order)                                                              |
| `.editorconfig`           | LF, 2 spaces, final newline                                                          |
