# 🗺️ TTG Club Core App — Project Map

> **Purpose:** Online D&D 5e reference. Species, classes, spells, bestiary,
> magic items, utilities (tokenator, calculator, dice roller).
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
│   ├── app.config.ts               # Nuxt UI configuration (icons, variants)
│   ├── assets/
│   │   ├── css/                    # Styles: tailwind.css, global.scss, variables, colors
│   │   └── icons/                  # Custom SVG icons (`ttg` collection)
│   ├── composables/                # ⚡ Global composables (auto-import)
│   ├── features/                   # 🏗️ DDD domains (core business logic)
│   ├── layouts/                    # Layouts: default, detail, section
│   ├── middleware/                 # Route middleware: auth, close-overlay
│   ├── pages/                      # 📄 Routes (file-based routing)
│   ├── plugins/                    # Plugins: dayjs, scroll, heartbeat
│   ├── shared/                     # 🔧 Global shared layer
│   │   ├── api/                    # API utilities
│   │   ├── constants/              # Global constants
│   │   ├── enums/                  # Enums
│   │   ├── stores/                 # Global Pinia stores
│   │   ├── types/                  # Global types (base, wiki, user, etc.)
│   │   ├── ui/                     # 🎨 UI Kit (23 components)
│   │   └── utils/                  # Global utilities
│   └── utils/                      # ⚡ Global utilities (auto-import)
├── server/                         # 🔒 Server-side (Nitro)
│   ├── api/                        # API endpoints (catch-all proxy + greetings)
│   ├── domain/                     # Server domains (const, dto, model, repository, service)
│   ├── middleware/                 # Server middleware (auth token, headers)
│   ├── routes/                     # Server routes (manifest.json, S3 proxy)
│   └── utils/                      # Utilities (JWT, proxy, compression)
├── shared/                         # 📦 Isomorphic shared (client + server)
│   ├── constants/                  # Shared constants
│   └── utils/                      # Shared utilities
├── modules/                        # 🧩 Nuxt modules
│   └── auto-aliases.ts             # Auto-generation of ~domain aliases
├── public/                         # Static files
└── .github/workflows/              # CI/CD pipelines
    ├── code-check.yml              # PR checks: stylelint → eslint → type-check
    └── deploy.yml                  # Push main/dev: Docker build → SSH deploy
```

---

## 🎨 Shared UI Kit (`app/shared/ui/`)

**UI Components Priority:** Nuxt UI → `shared/ui` → `features/*/ui`

---

## 🌍 Domains (DDD Architecture in `app/features/`)

| Domain           | Purpose                                       | Features                                      |
| ---------------- | --------------------------------------------- | --------------------------------------------- |
| `admin`          | Admin dashboard                               | —                                             |
| `backgrounds`    | Character backgrounds                         | —                                             |
| `bestiary`       | Creature bestiary                             | body, editor, drawer, preview, link           |
| `calculator`     | Calculators                                   | —                                             |
| `classes`        | Character classes                             | body, editor, drawer, preview, link           |
| `dice-roller`    | Dice rolling                                  | float-button, modal, sidebar-button, link     |
| `feats`          | Character feats                               | —                                             |
| `glossary`       | Terms glossary                                | —                                             |
| `home`           | Landing/Home page                             | —                                             |
| `infrastructure` | Infrastructure (filter, search, sidebar, pwa) | filter, search, sidebar, pwa                  |
| `items`          | Equipment & Items                             | —                                             |
| `magic-items`    | Magic items                                   | —                                             |
| `roadmap`        | Project roadmap                               | —                                             |
| `species`        | Character species/races                       | —                                             |
| `spells`         | Spells                                        | body, editor, drawer, legend, preview, link   |
| `tokenator`      | Token generator                               | canvas, controls, preview, model, composables |
| `user`           | User profile                                  | —                                             |
| `workshop`       | Content creation workshop                     | —                                             |

### Anatomy of a Feature (Example: `tokenator`)

```
app/features/tokenator/
├── canvas/                     # "Canvas" Feature
│   ├── ui/                     # Feature UI components
│   └── index.ts                # Public API
├── controls/                   # "Controls" Feature
│   ├── TokenatorControls.vue   # Root component: [Domain][Feature].vue
│   ├── composables/            # Composables NEXT TO model, not inside
│   ├── ui/                     # Internal UI components
│   └── index.ts                # Public API
├── model/                      # Shared domain model
│   ├── constants.ts            # Constants
│   ├── types.ts                # Types
│   ├── db.ts                   # IndexedDB (Dexie)
│   ├── utils/                  # Model utilities
│   └── index.ts                # Public API
├── preview/                    # "Preview" Feature
│   ├── ui/
│   └── index.ts
└── composables/                # Domain-level composables
```

---

## ⚙️ Configuration & Infrastructure Control

| File / Folder         | Purpose                                      |
| --------------------- | -------------------------------------------- |
| `AGENTS.md`           | **Primary source of coding rules and style** |
| `.agents/skills/`     | **Directory containing AI agents skills**    |
| `nuxt.config.ts`      | Nuxt configuration                           |
| `app/app.config.ts`   | Nuxt UI configuration (icons, variants)      |
| `eslint.config.js`    | ESLint (via @svifty7/eslint-config)          |
| `stylelint.config.js` | Stylelint (clean-order)                      |
| `.editorconfig`       | LF, 2 spaces, final newline                  |
