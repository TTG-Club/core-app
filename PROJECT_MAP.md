# 🗺️ TTG Club Core App — Карта проекта и правила для ИИ-агентов

> **Назначение:** Онлайн-справочник по D&D 5e. Расы, классы, заклинания,
> бестиарий, магические предметы, инструменты (токенатор, калькулятор, бросок
> костей).

```
✅ Делай                                   ❌ Не делай
────────────────────────────────────────────────────────────
Composition API + <script setup>            Options API
Pinia / Composables                         provide/inject (если можно избежать)
VueUse → es-toolkit → Custom                lodash / custom first
consts.ts                                   constants.ts / hardcode
bg-surface, text-primary                    dark:bg-gray-900
@click.left.exact.prevent                   @click (без модификаторов)
(value) => fn(value)                        (v) => fn(v)
computed для логики                         Ternary в :class
JSDoc на русском                            JSDoc на английском / без
~domain/feature (алиас)                     Полные relative пути кросс-фича
Barrel imports (index.ts)                   Deep imports
pnpm lint:write + type-check                Skip checks
Zod для валидации внешних данных            Прямое использование без проверки
```

---

## Быстрая навигация для агентов

| Задача                           | Где искать                                       |
| -------------------------------- | ------------------------------------------------ |
| Добавить новую страницу          | `app/pages/`                                     |
| Создать новый домен              | `app/features/<domain>/`                         |
| Добавить общий UI-компонент      | `app/shared/ui/`                                 |
| Добавить API-эндпоинт            | `server/api/` или `server/routes/`               |
| Добавить серверную бизнес-логику | `server/domain/`                                 |
| Добавить глобальный composable   | `app/composables/`                               |
| Добавить глобальную утилиту      | `app/utils/`                                     |
| Добавить серверную утилиту       | `server/utils/`                                  |
| Изменить тему/цвета              | `app/assets/css/colors/`                         |
| Добавить иконку                  | `app/assets/icons/`                              |
| Изменить конфиг Nuxt UI          | `app/app.config.ts`                              |
| Добавить middleware маршрута     | `app/middleware/`                                |
| Добавить серверный middleware    | `server/middleware/`                             |
| Найти доступные auto-imports     | `.nuxt/imports.d.ts`                             |
| Найти типы для сущности          | `app/shared/types/`                              |
| Найти Pinia-стор                 | `app/shared/stores/` или `app/features/*/model/` |

---

## Технологический стек

| Слой             | Технология                | Версия                                             |
| ---------------- | ------------------------- | -------------------------------------------------- |
| Фреймворк        | Nuxt                      | 4                                                  |
| UI-фреймворк     | Vue                       | 3.5+ (Composition API, `<script setup lang="ts">`) |
| UI-библиотека    | Nuxt UI                   | 4                                                  |
| Стили            | Tailwind CSS              | 4                                                  |
| Типизация        | TypeScript (strict)       | 5.9+                                               |
| State Management | Pinia                     | 3                                                  |
| Утилиты          | VueUse, es-toolkit, dayjs | —                                                  |
| Валидация        | Zod                       | —                                                  |
| Менеджер пакетов | pnpm                      | 10                                                 |
| Runtime          | Node.js                   | 24                                                 |
| БД (клиент)      | IndexedDB (Dexie)         | —                                                  |
| Деплой           | Docker → GHCR → SSH       | —                                                  |

---

# I. Архитектура

## Структура проекта

```
core-app/
├── app/                            # 🖥️ Клиентская часть (Nuxt app directory)
│   ├── app.vue                     # Корневой компонент
│   ├── app.config.ts               # Конфигурация Nuxt UI (иконки, варианты)
│   ├── assets/
│   │   ├── css/                    # Стили: tailwind.css, global.scss, переменные, цвета
│   │   └── icons/                  # Кастомные SVG-иконки (коллекция `ttg`)
│   ├── composables/                # ⚡ Глобальные composables (auto-import)
│   ├── features/                   # 🏗️ DDD-домены (основная бизнес-логика)
│   ├── layouts/                    # Лейауты: default, detail, section
│   ├── middleware/                  # Route middleware: auth, admin, close-overlay
│   ├── pages/                      # 📄 Маршруты (file-based routing)
│   ├── plugins/                    # Плагины: dayjs, scroll, heartbeat
│   ├── shared/                     # 🔧 Общий слой приложения
│   │   ├── api/                    # API-утилиты
│   │   ├── consts/                 # Глобальные константы
│   │   ├── enums/                  # Перечисления
│   │   ├── stores/                 # Глобальные Pinia-сторы
│   │   ├── types/                  # Общие типы (base, wiki, user и др.)
│   │   ├── ui/                     # 🎨 UI Kit (23 компонента)
│   │   └── utils/                  # Общие утилиты
│   └── utils/                      # ⚡ Глобальные утилиты (auto-import)
├── server/                         # 🔒 Серверная часть (Nitro)
│   ├── api/                        # API-эндпоинты (catch-all proxy + greetings)
│   ├── domain/                     # Серверные домены (const, dto, model, repository, service)
│   ├── middleware/                  # Серверные middleware (auth token, headers)
│   ├── routes/                     # Server routes (manifest.json, S3 proxy)
│   └── utils/                      # Утилиты (JWT, proxy, сжатие)
├── shared/                         # 📦 Изоморфный shared (client + server)
│   ├── consts/                     # Общие константы
│   └── utils/                      # Общие утилиты
├── modules/                        # 🧩 Nuxt-модули
│   └── auto-aliases.ts             # Автогенерация ~domain алиасов
├── public/                         # Статические файлы
└── .github/workflows/              # CI/CD
    ├── code-check.yml              # PR: stylelint → eslint → type-check
    └── deploy.yml                  # Push main/dev: Docker build → SSH deploy
```

---

## DDD-архитектура: `app/features/`

### Домены

| Домен            | Назначение                                    | Фичи                                          |
| ---------------- | --------------------------------------------- | --------------------------------------------- |
| `admin`          | Панель администратора                         | —                                             |
| `backgrounds`    | Предыстории персонажей                        | —                                             |
| `bestiary`       | Бестиарий (существа)                          | body, editor, drawer, preview, link           |
| `calculator`     | Калькуляторы                                  | —                                             |
| `classes`        | Классы персонажей                             | body, editor, drawer, preview, link           |
| `dice-roller`    | Бросок костей                                 | float-button, modal, sidebar-button, link     |
| `feats`          | Черты                                         | —                                             |
| `glossary`       | Словарь терминов                              | —                                             |
| `home`           | Главная страница                              | —                                             |
| `infrastructure` | Инфраструктура (filter, search, sidebar, pwa) | —                                             |
| `items`          | Снаряжение                                    | —                                             |
| `magic-items`    | Магические предметы                           | —                                             |
| `roadmap`        | Дорожная карта                                | —                                             |
| `species`        | Расы/виды                                     | —                                             |
| `spells`         | Заклинания                                    | body, editor, drawer, legend, preview, link   |
| `tokenator`      | Генератор токенов                             | canvas, controls, preview, model, composables |
| `user`           | Пользовательский профиль                      | —                                             |
| `workshop`       | Мастерская (создание контента)                | —                                             |

### Анатомия фичи (на примере `tokenator`)

```
app/features/tokenator/
├── canvas/                     # Фича «Холст»
│   ├── ui/                     # UI-компоненты фичи
│   └── index.ts                # Публичный API
├── controls/                   # Фича «Элементы управления»
│   ├── TokenatorControls.vue   # Корневой компонент: [Domain][Feature].vue
│   ├── composables/            # Composables РЯДОМ с model, не внутри
│   ├── ui/                     # Внутренние UI-компоненты
│   └── index.ts                # Публичный API
├── model/                      # Общая модель домена
│   ├── consts.ts               # Константы (НЕ constants.ts)
│   ├── types.ts                # Типы
│   ├── db.ts                   # IndexedDB (Dexie)
│   ├── utils/                  # Утилиты модели
│   └── index.ts                # Публичный API
├── preview/                    # Фича «Предпросмотр»
│   ├── ui/
│   └── index.ts
└── composables/                # Composables уровня домена
```

### Архитектурные правила

| Правило                                                                                                 | Статус         |
| ------------------------------------------------------------------------------------------------------- | -------------- |
| `composables/` — сиблинг `model/` и `ui/`, **НЕ** вложен в `model/`                                     | 🚫 Строго      |
| `index.ts` в корне домена (`app/features/<домен>/index.ts`) — **запрещён**                              | 🚫 Строго      |
| `index.ts` в подпапках (`model/`, `ui/`, `body/`) — **обязателен**                                      | ✅ Обязательно |
| `app/components/` **не существует** — не создавать                                                      | 🚫 Строго      |
| Страничные компоненты (`TokenatorPage.vue`) — **запрещены**. Логика пишется в `app/pages/.../index.vue` | 🚫 Строго      |
| Утилиты, composables, типы, сторы конкретной фичи — **внутри папки фичи**                               | ✅ Обязательно |

### Barrel-файлы (`index.ts`)

| Место                                        | Разрешён?     |
| -------------------------------------------- | ------------- |
| `app/features/<домен>/index.ts`              | ❌ Запрещён   |
| `app/features/<домен>/<фича>/index.ts`       | ✅ Обязателен |
| `app/features/<домен>/<фича>/model/index.ts` | ✅ Обязателен |
| `app/features/<домен>/<фича>/ui/index.ts`    | ✅ Обязателен |

---

## Система алиасов и импорты

Модуль `modules/auto-aliases.ts` автоматически генерирует алиасы для каждого
домена в `app/features/`:

| Алиас             | Путь                                           |
| ----------------- | ---------------------------------------------- |
| `~bestiary`       | `app/features/bestiary`                        |
| `~tokenator`      | `app/features/tokenator`                       |
| `~dice-roller`    | `app/features/dice-roller`                     |
| `~infrastructure` | `app/features/infrastructure`                  |
| `~ui`             | `app/shared/ui` (определён в `nuxt.config.ts`) |
| ...               | ...(для всех 21 домена)                        |

### Правила импортов

```typescript
import { SpellBody } from '~spells/body';
// ✅ Кросс-фича / кросс-домен → АЛИАСЫ
import { TokenatorCanvas } from '~tokenator/canvas';
// ✅ Из barrel-файла
import { someConst } from '~tokenator/model';
// ❌ Глубокий импорт через алиас
import { someConst } from '~tokenator/model/consts';
// ❌ Максимальная глубина > 2
import { x } from '~tokenator/model/utils/helpers';
// ✅ Shared UI Kit → алиас ~ui
import { TtgCard } from '~ui/card';

// ✅ Между подмодулями одной фичи → ОТНОСИТЕЛЬНЫЕ пути
import { useStore } from '../../model';
import { SOME_CONST } from '../model';

// ✅ Внутри одной директории → ОТНОСИТЕЛЬНЫЕ пути
import { helper } from './utils'; // ЗАПРЕЩЕНО в index.ts фичи

// ❌ Экспорт ui/ из index.ts фичи
export * from './ui'; // ЗАПРЕЩЕНО
```

---

## Shared UI Kit

23 компонента в `app/shared/ui/`: action, animated-number, card, collapse,
copy-button, drawer, editor, gallery, grouped-list, icon, input, kbd-shortcut,
link, markup, page, placeholder, rating, result, select, skeleton, source-tag,
tooltip, upload.

**Приоритет UI-компонентов:** Nuxt UI → `shared/ui` → `features/*/ui`

---

# II. Стиль кода

## TypeScript (строгий режим)

| Правило               | Описание                                    |
| --------------------- | ------------------------------------------- |
| `any`                 | 🚫 **Строго запрещён**                      |
| `as Type`             | 🚫 Запрещены type assertions                |
| `as unknown as Type`  | 🚫 Строго запрещено двойное приведение      |
| Magic numbers         | 🚫 Запрещены — выносить в `consts.ts`       |
| Explicit return types | ✅ Обязательны для утилит и сложных функций |
| Strict mode           | ✅ Включён глобально                        |

### Валидация внешних данных

Данные из внешних источников (ответы API, пользовательский ввод) не гарантируют
свой тип. Перед использованием необходимо валидировать их через **Zod** или
ручные проверки, чтобы убедиться в соответствии ожидаемой структуре:

```typescript
// ✅ Валидация ответа API через Zod
import { z } from 'zod';

const CreatureSchema = z.object({
  name: z.string(),
  challengeRating: z.number(),
});

const response = await $fetch('/api/creatures/1');
const creature = CreatureSchema.parse(response);

// ❌ Прямое использование без валидации
const creature = await $fetch('/api/creatures/1'); // тип не гарантирован

creature.name; // может быть undefined
```

---

## Именование

### Переменные и функции

| Правило                                      | Хорошо                        | Плохо                        |
| -------------------------------------------- | ----------------------------- | ---------------------------- |
| Полные английские имена                      | `userProfile`, `requestCount` | `usr`, `reqCnt`              |
| Нет абстрактных имён                         | `creatureList`, `spellData`   | `data`, `item`, `list`       |
| **Однобуквенные переменные запрещены**       | `(value) => update(value)`    | `(v) => update(v)`           |
| Исключение: `i` в `for` циклах               | `for (let i = 0; ...)`        | —                            |
| Нет подчёркиваний и префиксов                | `getUser`                     | `_getUser`, `superGetUser`   |
| `is*` / `check*` → boolean, без side effects | `isVisible()`                 | `isVisible()` + DOM mutation |
| Одна функция = одна задача                   | `fetchCreature()`             | `fetchAndRenderCreature()`   |
| Разные корни для разных значений             | `createdDate`, `userData`     | `date`, `data` (конфликт)    |

### Компоненты

| Правило                                          | Пример                        |
| ------------------------------------------------ | ----------------------------- |
| Все имена — **минимум 2 слова**                  | `UserCard.vue`, НЕ `Card.vue` |
| Исключение — файлы в `app/pages/`                | `index.vue`, `[id].vue` — ОК  |
| Корневой компонент фичи: `[Domain][Feature].vue` | `TokenatorControls.vue`       |
| UI-компоненты фичи — описательные имена          | `LayerSettings.vue`           |

### Файлы, константы и данные

| Тип                                         | Формат                                    | Пример                        |
| ------------------------------------------- | ----------------------------------------- | ----------------------------- |
| Файл констант                               | `consts.ts`                               | НЕ `constants.ts`             |
| Значения констант                           | `UPPER_CASE` / `PascalCase`               | `DEFAULT_COLOR`, `MaxRetries` |
| SQL                                         | **lowercase**                             | `select * from users`         |
| IndexedDB ключи                             | `domain:key-name` (kebab-case)            | `tokenator:background-color`  |
| Хардкод ссылок, текстов, чисел              | 🚫 Запрещён в компонентах → В `consts.ts` |
| Функции, возвращающие статическую константу | 🚫 Запрещены                              |

---

## Стили и дизайн-система

| Правило                         | Описание                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| Цвета                           | **Только** семантические: `bg-surface`, `text-primary`. Маппинг через CSS-переменные |
| `dark:` / `light:` модификаторы | 🚫 **Запрещены**                                                                     |
| `bg-[var(--ui-bg-elevated)]`    | 🚫 Запрещены произвольные переменные                                                 |
| Иконки                          | Только `ttg` и `fluent` коллекции                                                    |
| Tailwind CSS                    | По версии, указанной в проекте (v4)                                                  |
| Stylelint                       | `stylelint-config-clean-order` — порядок CSS-свойств                                 |
| SCSS переменные                 | `app/assets/css/variables/`                                                          |
| Tailwind entry                  | `app/assets/css/tailwind.css`                                                        |

---

## Vue-шаблоны

### Модификаторы событий

По умолчанию **обязательно** указывать модификаторы событий, чтобы было
очевидно, какое действие обрабатывается и какие side-effects ожидать:

```vue
<!-- ✅ Явные модификаторы — понятно, что реагируем только на левый клик,
     без зажатых клавиш, с preventDefault -->
<UButton @click.left.exact.prevent="handleClick" />

<!-- ✅ Правый клик — модификаторы указывают на контекстное действие -->
<div @click.right.prevent="openContextMenu" />

<!-- ❌ Голый @click — неясно поведение, возможны нежелательные side-effects -->
<UButton @click="handleClick" />
```

**Стратегия по умолчанию:** `@click.left.exact.prevent` для интерактивных
элементов, если нет причин для другого поведения.

### Обработчики событий

```vue
<!-- ✅ Одна строка — допускается inline -->
<UButton @click.left.exact.prevent="handleClick" />

<!-- ❌ Многострочный inline-обработчик -->
<UButton
  @update="
    (v) => {
      form = { ...form, val: v };
    }
  "
/>

<!-- ✅ Именованная функция -->
<UButton @update="handleUpdate" />
```

| Правило                          | Описание                                         |
| -------------------------------- | ------------------------------------------------ |
| Multi-line inline-обработчик     | 🚫 → Вынести в named function в `<script setup>` |
| `{ ...spread }` в обработчике    | 🚫 → Вынести в функцию                           |
| Сложная логика (ternaries, math) | 🚫 → Вынести в функцию                           |

### Computed и шаблонная гигиена

| Правило                            | Описание                     |
| ---------------------------------- | ---------------------------- |
| Inline ternary в `:class`          | 🚫 → Выносить в `computed`   |
| Сложная логика в `v-if`            | 🚫 → Выносить в `computed`   |
| Динамические цвета / классы        | ✅ → Определять в `computed` |
| Шаблоны должны быть декларативными | ✅ Никаких сложных выражений |

### Рендеринг и State Management

| Правило                                    | Описание                                                   |
| ------------------------------------------ | ---------------------------------------------------------- |
| Чисто клиентские фичи (dice-roller и т.п.) | ✅ Обернуть в `<ClientOnly>`                               |
| `provide/inject`                           | ⚠️ Стараться избегать → предпочитать Composables или Pinia |

---

## Composables, утилиты и источники правды

### Приоритет выбора

```
1. VueUse (ОБЯЗАТЕЛЬНО для reactive/browser APIs)
   └── useDraggable, useWindowScroll, useStorage, useDateFormat...

2. es-toolkit (для Data manipulation — замена lodash)
   └── groupBy, debounce, throttle...

3. Проектные composables
   └── useDayjs (для работы со временем)

4. Кастомная реализация (ТОЛЬКО если 1-3 не подходят)
```

### Протокол Anti-Duplication (обязательный)

**Перед созданием** любого нового composable, утилиты или хелпера:

1. **Прочитать** `.nuxt/imports.d.ts` (содержит ВСЕ auto-imports: Nuxt
   built-ins, VueUse, проектные утилиты)
2. **Найти** ключевые слова задачи (Date, Format, Scroll, Drag и т.д.)
3. **Найден** → **Использовать** существующий. Не создавать обёртку
4. **Не найден** → Проверить `VueUse` и `es-toolkit`, затем при отсутствии —
   создавать новый файл

### Источники правды (MCP)

| Источник                       | Контекст                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `https://nuxt.com/llms.txt`    | Nuxt-архитектура и реализация                                                   |
| `https://ui.nuxt.com/llms.txt` | Nuxt UI компоненты и API                                                        |
| MCP-серверы (Nuxt, Nuxt UI)    | **Обязательно** запрашивать API-определения. Галлюцинации пропсов **запрещены** |

---

## Документация (JSDoc)

| Правило                             | Описание                                                      |
| ----------------------------------- | ------------------------------------------------------------- |
| Все утилиты (особенно в `utils.ts`) | ✅ **Обязателен** JSDoc **на русском языке**                  |
| HTML-теги в JSDoc                   | 🚫 Запрещены (`<ul>`, `<li>`, `<br>`) → Использовать Markdown |
| Код-идентификаторы в JSDoc          | На английском (переменные, функции)                           |

```typescript
/**
 * Форматирует строку, обрезая до указанной длины
 *
 * @param source - исходная строка для обработки
 * @param maxLength - максимальная длина результата
 * @returns обрезанная строка с многоточием
 */
function getSlicedString(source: string, maxLength: number): string {
  // ...
}
```

---

# III. Процессы

## Команды и проверки

| Команда                | Назначение                                                |
| ---------------------- | --------------------------------------------------------- |
| `pnpm dev`             | Запуск dev-сервера                                        |
| `pnpm build`           | Сборка проекта                                            |
| `pnpm type-check`      | Проверка типов (vue-tsc)                                  |
| `pnpm lint:write`      | ESLint с автофиксом                                       |
| `pnpm lint:check`      | ESLint без автофикса                                      |
| `pnpm stylelint:write` | Stylelint с автофиксом                                    |
| `pnpm postinstall`     | `nuxt cleanup && nuxt prepare` (генерация алиасов, типов) |

**Финальная проверка (обязательная)** — после каждой задачи:

```bash
pnpm run lint:write
pnpm run type-check
```

---

## CI/CD и коммиты

- **PR:** Stylelint → ESLint → Type Check (`code-check.yml`)
- **Push main/dev:** Docker build → Push GHCR → SSH deploy (`deploy.yml`)
- **Pre-commit:** lint-staged (eslint + vue-tsc + stylelint)

| Правило         | Описание                                                            |
| --------------- | ------------------------------------------------------------------- |
| Формат коммитов | [Conventional Commits](https://www.conventionalcommits.org/)        |
| Формат          | `<тип>[область]: <описание>`                                        |
| Типы            | `feat`, `fix`, `docs`, `refactor`, `chore`, `style`, `perf`, `test` |
| Описание PR     | Только при очень большом коммите: причина изменений + цель          |
| Перед отправкой | Код протестирован, линтеры пройдены                                 |

### Чеклист для ревью

При ревью или рефакторинге — предоставить **список изменений**:

- **Где:** файл / функция / блок
- **Почему:** ссылка на правило или баг
- **Для чего:** результат / исправление

---

## Управление правилами ИИ и конфигурации

| Файл                   | Назначение                              |
| ---------------------- | --------------------------------------- |
| `AGENTS.md`, `.agents` | **Источник правил для ИИ**              |
| `nuxt.config.ts`       | Конфигурация Nuxt                       |
| `app/app.config.ts`    | Конфигурация Nuxt UI (иконки, варианты) |
| `eslint.config.js`     | ESLint (через @svifty7/eslint-config)   |
| `stylelint.config.js`  | Stylelint (clean-order)                 |
| `.editorconfig`        | LF, 2 spaces, final newline             |

После изменений `AGENTS.md` → `pnpm run sync-ai-rules`
