import type {
  Character,
  CharacterNote,
  CharacterSheetDetail,
  CharacterSheetListItem,
  CharacterSheetListPage,
  FeatureDescriptionNode,
  SavedCharacterSheet,
  SavedCharacterSheetListPage,
} from './types';

import { z } from '~/utils/zod';
import { CasterType } from '~classes/model';

import {
  DRAFT_CHARACTER_ID,
  LEGACY_NOTE_ID,
  SHEET_NOTE_LABELS,
} from './constants';
import { DEFAULT_CHARACTER } from './mock';

/**
 * Схема сохранённого персонажа. Каждое поле снабжено `catch`-дефолтом из
 * `DEFAULT_CHARACTER`: документ из БД мог быть записан старой версией листа
 * или повреждён — частичные расхождения не должны ронять загрузку, а падение
 * допустимо только при полном несоответствии формы (не-объект).
 */

const abilityKeySchema = z.enum([
  'strength',
  'dexterity',
  'constitution',
  'intelligence',
  'wisdom',
  'charisma',
]);

const skillProficiencySchema = z.enum([
  'none',
  'half',
  'proficient',
  'expertise',
]);

const speedUnitSchema = z.enum(['feet', 'meters', 'miles', 'kilometers']);

/**
 * Узел описания особенности: строка либо узел разметки. Внутренняя структура
 * узлов не валидируется — рендер разметки устойчив к незнакомым узлам.
 */
const descriptionNodeSchema = z.custom<FeatureDescriptionNode>(
  (value) =>
    typeof value === 'string' || (typeof value === 'object' && value !== null),
);

/**
 * Описание целиком: строки-абзацы и блочные узлы вперемешку. Разделы отдают
 * описания в той же форме, что хранит документ листа, поэтому схема одна на
 * оба случая (`schemas.ts` разбирает ей ответы API). Битое значение даёт пустое
 * описание, а не исключение.
 */
export const descriptionNodesSchema = z.array(descriptionNodeSchema).catch([]);

const characterClassSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    subclassUrl: z.string().nullable().catch(null),
    subclassName: z.string().nullable().catch(null),
    // Листы, сохранённые до появления поля, приходят без типа заклинательства:
    // для них он определяется по названию класса (см. `getClassCasterType`).
    casterType: z.nativeEnum(CasterType).nullable().catch(null),
    hitDie: z.coerce.number().catch(8),
  })
  .nullable()
  .catch(null);

const characterBackgroundSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    featUrl: z.string().nullable().catch(null),
    abilityBonuses: z
      .partialRecord(abilityKeySchema, z.coerce.number())
      .catch({}),
  })
  .nullable()
  .catch(null);

const featureSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  description: descriptionNodesSchema,
  origin: z.enum(['species', 'lineage', 'class', 'feat', 'none']).catch('none'),
  originName: z.string().catch(''),
  // Листы до учёта уровня умений его не хранят: снятие уровня такие записи не
  // трогает, пока уровень не будет взят заново.
  level: z.coerce.number().nullable().catch(null),
  choice: z.string().nullable().catch(null),
});

// Поля своих заклинаний (`custom:<uuid>`) отсутствуют у записей из каталога,
// поэтому необязательны; битое значение отбрасывается вместе с полем, а не
// роняет всю книгу заклинаний.
const spellSchema = z.object({
  url: z.string(),
  name: z.string().catch(''),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().optional(),
  ritual: z.boolean().optional(),
  castingTime: z.string().optional().catch(undefined),
  range: z.string().optional().catch(undefined),
  components: z.string().optional().catch(undefined),
  duration: z.string().optional().catch(undefined),
  description: z.array(descriptionNodeSchema).optional().catch(undefined),
});

const speciesSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    lineageUrl: z.string().nullable().catch(null),
    lineageName: z.string().nullable().catch(null),
    innateSpells: z
      .array(
        z.object({
          spell: spellSchema,
          requiredLevel: z.coerce.number().min(1).max(20).catch(1),
        }),
      )
      .catch([]),
  })
  .nullable()
  .catch(null);

// Потраченные ячейки круга. Максимум считается по классу и уровню, поэтому в
// документе его нет: круг с битым номером просто отбрасывается схемой массива.
const spellSlotSchema = z.object({
  level: z.coerce.number(),
  used: z.coerce.number().catch(0),
});

// По умолчанию — авто (легаси-листы без поля заклинательства): характеристика
// определяется по классу.
const spellcastingSchema = z
  .object({
    ability: abilityKeySchema.nullable().catch(null),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.spellcasting }));

// По умолчанию — правила D&D (легаси-листы без блока настроек): базовая
// характеристика атаки оружием определяется свойствами оружия.
const settingsSchema = z
  .object({
    weaponAttackAbility: abilityKeySchema.nullable().catch(null),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.settings }));

const experienceSchema = z
  .object({
    current: z.coerce.number().catch(0),
    nextLevel: z.coerce.number().catch(DEFAULT_CHARACTER.experience.nextLevel),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.experience }));

const armorClassSchema = z
  .object({
    base: z.coerce.number().catch(DEFAULT_CHARACTER.armorClass.base),
    ability: abilityKeySchema
      .nullable()
      .catch(DEFAULT_CHARACTER.armorClass.ability),
    natural: z.boolean().catch(false),
    // По умолчанию — автоподсчёт по надетой броне (легаси-листы без поля).
    custom: z.boolean().catch(false),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.armorClass }));

const speedSchema = z
  .object({
    values: z
      .object({
        walk: z.coerce.number().catch(DEFAULT_CHARACTER.speed.values.walk),
        burrow: z.coerce.number().catch(0),
        climb: z.coerce.number().catch(0),
        fly: z.coerce.number().catch(0),
        swim: z.coerce.number().catch(0),
      })
      .catch(() => ({ ...DEFAULT_CHARACTER.speed.values })),
    hover: z.boolean().catch(false),
    unit: speedUnitSchema.catch('feet'),
  })
  .catch(() => structuredClone(DEFAULT_CHARACTER.speed));

const visionSchema = z
  .object({
    normal: z.coerce.number().catch(0),
    darkvision: z.coerce.number().catch(0),
    blindsight: z.coerce.number().catch(0),
    tremorsense: z.coerce.number().catch(0),
    truesight: z.coerce.number().catch(0),
    unit: speedUnitSchema.catch('feet'),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.vision }));

const abilitiesSchema = z
  .object({
    strength: z.coerce.number().catch(10),
    dexterity: z.coerce.number().catch(10),
    constitution: z.coerce.number().catch(10),
    intelligence: z.coerce.number().catch(10),
    wisdom: z.coerce.number().catch(10),
    charisma: z.coerce.number().catch(10),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.abilities }));

const skillSchema = z.object({
  name: z.string(),
  ability: abilityKeySchema,
  proficiency: skillProficiencySchema.catch('none'),
});

const levelHitPointsSchema = z.object({
  level: z.coerce.number(),
  amount: z.coerce.number().catch(0),
});

const healthSchema = z
  .object({
    current: z.coerce.number().catch(0),
    max: z.coerce.number().catch(0),
    temporary: z.coerce.number().catch(0),
    // Листы до появления учёта прироста записей не имеют: снижение уровня у них
    // максимум не тронет, пока уровни не будут взяты заново.
    levelGains: z.array(levelHitPointsSchema).catch([]),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.health }));

const hitDieSchema = z.object({
  die: z.coerce.number().catch(6),
  current: z.coerce.number().catch(0),
  max: z.coerce.number().catch(0),
});

const extraHitDieSchema = hitDieSchema.extend({
  id: z.string(),
});

const classResourceSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  shortLabel: z.string().catch(''),
  recovery: z.enum(['short-rest', 'long-rest']).catch('long-rest'),
  current: z.coerce.number().catch(0),
  max: z.coerce.number().catch(0),
});

const proficienciesSchema = z
  .object({
    armor: z.array(z.string()).catch([]),
    weapons: z.array(z.string()).catch([]),
    weaponMasteries: z.array(z.string()).catch([]),
    tools: z.array(z.string()).catch([]),
    languages: z.array(z.string()).catch([]),
  })
  .catch(() => structuredClone(DEFAULT_CHARACTER.proficiencies));

const currencySchema = z
  .object({
    copper: z.coerce.number().catch(0),
    silver: z.coerce.number().catch(0),
    electrum: z.coerce.number().catch(0),
    gold: z.coerce.number().catch(0),
    platinum: z.coerce.number().catch(0),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.currency }));

const customCurrencySchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  label: z.string().catch(''),
  amount: z.coerce.number().catch(0),
});

const inventoryArmorSchema = z
  .object({
    baseArmorClass: z.coerce.number().catch(0),
    dexterityMod: z.enum(['full', 'capped', 'none']).catch('full'),
    shield: z.boolean().catch(false),
  })
  .nullable()
  .catch(null);

const inventoryWeaponDamageSchema = z
  .object({
    diceCount: z.coerce.number().catch(0),
    diceFaces: z.coerce.number().catch(0),
    bonus: z.coerce.number().catch(0),
    type: z.string().catch(''),
  })
  .nullable()
  .catch(null);

const inventoryWeaponSchema = z
  .object({
    category: z.enum(['simple', 'martial']).catch('simple'),
    ranged: z.boolean().catch(false),
    finesse: z.boolean().catch(false),
    // Оружие из листов, сохранённых до появления урона, приходит без блока —
    // схема даёт null, и плитка урона просто не показывается.
    damage: inventoryWeaponDamageSchema,
  })
  .nullable()
  .catch(null);

const noteSchema = z.object({
  id: z.string(),
  title: z.string().catch(''),
  content: z.string().catch(''),
});

/**
 * Заметки листа, собранного до их разделения на записи, — одна строка разметки.
 * Переносим её в единственную заметку, иначе записи игрока просто пропали бы.
 *
 * @param notes заметки старого листа в хранимой форме редактора.
 * @returns список заметок; пустой текст записи не даёт.
 */
function toLegacyNotes(notes: string): CharacterNote[] {
  const content = notes.trim();

  if (!content) {
    return [];
  }

  return [
    {
      id: LEGACY_NOTE_ID,
      title: SHEET_NOTE_LABELS.legacyTitle,
      content,
    },
  ];
}

const notesSchema = z
  .union([z.array(noteSchema), z.string()])
  .catch([])
  .transform((notes) =>
    typeof notes === 'string' ? toLegacyNotes(notes) : notes,
  );

const inventoryItemSchema = z.object({
  id: z.string(),
  url: z.string().catch(''),
  name: z.string().catch(''),
  category: z.enum(['WEAPON', 'ARMOR', 'ITEM', 'MAGIC_ITEM']).catch('ITEM'),
  typesLabel: z.string().catch(''),
  cost: z.string().catch(''),
  weight: z.coerce.number().catch(0),
  quantity: z.coerce.number().catch(1),
  armor: inventoryArmorSchema,
  weapon: inventoryWeaponSchema,
  equipped: z.boolean().catch(false),
  // Описание есть только у своих предметов (`custom:<uuid>`): у каталожных оно
  // живёт в разделе-источнике, а не в листе.
  description: z.array(descriptionNodeSchema).optional().catch(undefined),
});

/** Схема персонажа целиком (jsonb-документ листа). */
const characterSchema = z.object({
  id: z.string().catch(DEFAULT_CHARACTER.id),
  name: z.string().catch(DEFAULT_CHARACTER.name),
  avatarUrl: z.string().nullable().catch(null),
  species: speciesSchema,
  size: z.string().nullable().catch(null),
  features: z.array(featureSchema).catch([]),
  spells: z.array(spellSchema).catch([]),
  spellcasting: spellcastingSchema,
  spellSlots: z.array(spellSlotSchema).catch([]),
  characterClass: characterClassSchema,
  characterBackground: characterBackgroundSchema,
  level: z.coerce.number().catch(DEFAULT_CHARACTER.level),
  experience: experienceSchema,
  inspiration: z.boolean().catch(false),
  armorClass: armorClassSchema,
  speed: speedSchema,
  vision: visionSchema,
  abilities: abilitiesSchema,
  savingThrowProficiencies: z.array(abilityKeySchema).catch([]),
  skills: z
    .array(skillSchema)
    .catch(() => structuredClone(DEFAULT_CHARACTER.skills)),
  health: healthSchema,
  hitDice: z.array(hitDieSchema).catch([]),
  extraHitDice: z.array(extraHitDieSchema).catch([]),
  classResources: z.array(classResourceSchema).catch([]),
  proficiencies: proficienciesSchema,
  currency: currencySchema,
  customCurrencies: z.array(customCurrencySchema).catch([]),
  inventory: z.array(inventoryItemSchema).catch([]),
  notes: notesSchema,
  settings: settingsSchema,
});

/**
 * Валидация и нормализация документа персонажа. Идентификатором персонажа
 * становится id строки с сервера — значение внутри JSON (в том числе мок
 * `new-character` при создании) перезаписывается.
 *
 * @param input сырой документ листа.
 * @param sheetId идентификатор листа с сервера.
 * @returns персонаж листа.
 * @throws ZodError при полном несоответствии формы (документ — не объект).
 */
export function parseCharacter(input: unknown, sheetId: string): Character {
  return { ...characterSchema.parse(input), id: sheetId };
}

/**
 * Минимальная форма документа, по которой лист узнаётся среди посторонних
 * JSON-файлов: имя и все шесть характеристик. Основная схема почти всё чинит
 * `catch`-дефолтами, поэтому без этой проверки импорт превратил бы любой файл
 * в пустого персонажа.
 */
const importedCharacterGuardSchema = z.object({
  name: z.string(),
  abilities: z.object({
    strength: z.coerce.number(),
    dexterity: z.coerce.number(),
    constitution: z.coerce.number(),
    intelligence: z.coerce.number(),
    wisdom: z.coerce.number(),
    charisma: z.coerce.number(),
  }),
});

/**
 * Валидация и нормализация персонажа из импортируемого файла. Форма проверяется
 * строже, чем у документа из БД: файл выбирает пользователь, и промахнуться
 * файлом он может так же легко, как и попасть. Идентификатор сбрасывается к
 * черновику — свой UUID листу выдаст сервер при создании.
 *
 * @param input разобранное содержимое JSON-файла.
 * @returns персонаж импортируемого листа.
 * @throws ZodError, если в файле не лист персонажа.
 */
export function parseImportedCharacter(input: unknown): Character {
  importedCharacterGuardSchema.parse(input);

  return parseCharacter(input, DRAFT_CHARACTER_ID);
}

/** Схема элемента списка листов. */
const sheetListItemSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  deleted: z.boolean().catch(false),
  data: z.unknown(),
  // Токен нужен карточке: по нему её меню знает, включён ли доступ по ссылке,
  // не открывая лист. Как и у полного листа, с `catch` — бэк без фичи
  // «поделиться» поля не пришлёт.
  shareToken: z.string().nullable().catch(null),
  createdAt: z.string().nullable().catch(null),
  updatedAt: z.string().nullable().catch(null),
});

/**
 * Схема списка листов. `limit` без `catch`: серверный лимит обязателен —
 * его отсутствие означает несовместимый ответ, а не «лимит 0». Глубина истории,
 * наоборот, с `catch`: бэк без этого поля просто не покажет её в подписи.
 */
const sheetListPageSchema = z.object({
  limit: z.number(),
  historyLimit: z.coerce.number().catch(0),
  count: z.coerce.number().catch(0),
  sheets: z.array(sheetListItemSchema).catch([]),
});

/**
 * Схема полного листа (ответ создания и `GET /{id}`). `shareToken` с `catch`:
 * бэк без фичи «поделиться» поле не пришлёт, и это не повод ронять лист.
 */
const sheetDetailSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  data: z.unknown(),
  shareToken: z.string().nullable().catch(null),
});

/**
 * Документ листа для карточки списка. Битый документ активного листа не роняет
 * весь список — карточка строится на пустом персонаже с именем из колонки
 * (открытие такого листа отдельно сообщит об ошибке).
 *
 * @param sheet разобранный элемент списка.
 * @returns персонаж карточки; null — у удалённых листов.
 */
function toListItemCharacter(
  sheet: z.infer<typeof sheetListItemSchema>,
): Character | null {
  if (sheet.deleted || sheet.data === null || sheet.data === undefined) {
    return null;
  }

  const result = characterSchema.safeParse(sheet.data);

  if (!result.success) {
    return {
      ...structuredClone(DEFAULT_CHARACTER),
      id: sheet.id,
      name: sheet.name,
    };
  }

  return { ...result.data, id: sheet.id };
}

/**
 * Валидация списка листов из ответа `GET /`.
 *
 * @param input сырой ответ сервера.
 * @returns список листов с серверным лимитом.
 */
export function parseCharacterSheetListPage(
  input: unknown,
): CharacterSheetListPage {
  const page = sheetListPageSchema.parse(input);

  const sheets: CharacterSheetListItem[] = page.sheets.map((sheet) => ({
    id: sheet.id,
    name: sheet.name,
    deleted: sheet.deleted,
    data: toListItemCharacter(sheet),
    shareToken: sheet.shareToken,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  }));

  return {
    limit: page.limit,
    historyLimit: page.historyLimit,
    count: page.count,
    sheets,
  };
}

/**
 * Схема сохранённого чужого листа. `data` приходит только у доступных записей —
 * у остальных сервер отдаёт null вместе с `available: false`.
 */
const savedSheetSchema = z.object({
  id: z.string(),
  sheetId: z.string(),
  shareToken: z.string(),
  name: z.string().catch(''),
  data: z.unknown(),
  available: z.boolean().catch(false),
});

/**
 * Схема списка сохранённых листов. `limit`, как и у своих листов, без `catch`:
 * серверный лимит обязателен.
 */
const savedSheetListPageSchema = z.object({
  limit: z.number(),
  count: z.coerce.number().catch(0),
  sheets: z.array(savedSheetSchema).catch([]),
});

/**
 * Документ сохранённого листа для карточки. Как и у своих листов, битый документ
 * не роняет весь раздел: карточка строится на пустом персонаже с именем из
 * ответа.
 *
 * @param sheet разобранная сохранённая запись.
 * @returns персонаж карточки; null — доступ к листу закрыт.
 */
function toSavedSheetCharacter(
  sheet: z.infer<typeof savedSheetSchema>,
): Character | null {
  if (!sheet.available || sheet.data === null || sheet.data === undefined) {
    return null;
  }

  const result = characterSchema.safeParse(sheet.data);

  if (!result.success) {
    return {
      ...structuredClone(DEFAULT_CHARACTER),
      id: sheet.sheetId,
      name: sheet.name,
    };
  }

  return { ...result.data, id: sheet.sheetId };
}

/**
 * Приводит разобранную запись к модели сохранённого листа.
 *
 * @param sheet разобранная сохранённая запись.
 * @returns сохранённый лист с документом персонажа.
 */
function toSavedSheet(
  sheet: z.infer<typeof savedSheetSchema>,
): SavedCharacterSheet {
  return {
    id: sheet.id,
    sheetId: sheet.sheetId,
    shareToken: sheet.shareToken,
    name: sheet.name,
    data: toSavedSheetCharacter(sheet),
    available: sheet.available,
  };
}

/**
 * Валидация списка сохранённых чужих листов из ответа `GET /saved`.
 *
 * @param input сырой ответ сервера.
 * @returns список сохранённых листов с серверным лимитом.
 */
export function parseSavedCharacterSheetListPage(
  input: unknown,
): SavedCharacterSheetListPage {
  const page = savedSheetListPageSchema.parse(input);

  return {
    limit: page.limit,
    count: page.count,
    sheets: page.sheets.map(toSavedSheet),
  };
}

/**
 * Валидация ответа `POST /saved` — только что сохранённой записи.
 *
 * @param input сырой ответ сервера.
 * @returns сохранённый лист с документом персонажа.
 */
export function parseSavedCharacterSheet(input: unknown): SavedCharacterSheet {
  return toSavedSheet(savedSheetSchema.parse(input));
}

/**
 * Схема ответа на включение доступа по ссылке. Токен без `catch`: ответ без
 * него означает, что ссылку собрать не из чего — это ошибка, а не «нет доступа».
 */
const sheetShareSchema = z.object({
  shareToken: z.string(),
});

/**
 * Валидация ответа `POST /{id}/share`.
 *
 * @param input сырой ответ сервера.
 * @returns токен ссылки «поделиться».
 */
export function parseCharacterSheetShare(input: unknown): string {
  return sheetShareSchema.parse(input).shareToken;
}

/**
 * Валидация полного листа из ответа создания или `GET /{id}`.
 *
 * @param input сырой ответ сервера.
 * @returns лист с разобранным персонажем.
 */
export function parseCharacterSheetDetail(
  input: unknown,
): CharacterSheetDetail {
  const detail = sheetDetailSchema.parse(input);

  return {
    id: detail.id,
    name: detail.name,
    data: parseCharacter(detail.data, detail.id),
    shareToken: detail.shareToken,
  };
}
