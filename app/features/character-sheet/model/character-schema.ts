import type {
  Character,
  CharacterSheetDetail,
  CharacterSheetListItem,
  CharacterSheetListPage,
  FeatureDescriptionNode,
} from './types';

import { z } from '~/utils/zod';

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

const speciesSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    lineageUrl: z.string().nullable().catch(null),
    lineageName: z.string().nullable().catch(null),
  })
  .nullable()
  .catch(null);

const characterClassSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    subclassUrl: z.string().nullable().catch(null),
    subclassName: z.string().nullable().catch(null),
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
  description: z.array(descriptionNodeSchema).catch([]),
  origin: z.enum(['species', 'lineage', 'class', 'feat', 'none']).catch('none'),
  originName: z.string().catch(''),
  choice: z.string().nullable().catch(null),
});

const spellSchema = z.object({
  url: z.string(),
  name: z.string().catch(''),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().optional(),
  ritual: z.boolean().optional(),
});

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

const healthSchema = z
  .object({
    current: z.coerce.number().catch(0),
    max: z.coerce.number().catch(0),
    temporary: z.coerce.number().catch(0),
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

const inventoryItemSchema = z.object({
  id: z.string(),
  url: z.string().catch(''),
  name: z.string().catch(''),
  category: z.enum(['WEAPON', 'ARMOR', 'ITEM', 'MAGIC_ITEM']).catch('ITEM'),
  typesLabel: z.string().catch(''),
  cost: z.string().catch(''),
  weight: z.coerce.number().catch(0),
  quantity: z.coerce.number().catch(1),
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
  inventory: z.array(inventoryItemSchema).catch([]),
  notes: z.string().catch(''),
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

/** Схема элемента списка листов. */
const sheetListItemSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  deleted: z.boolean().catch(false),
  data: z.unknown(),
  createdAt: z.string().nullable().catch(null),
  updatedAt: z.string().nullable().catch(null),
});

/**
 * Схема списка листов. `limit` без `catch`: серверный лимит обязателен —
 * его отсутствие означает несовместимый ответ, а не «лимит 0».
 */
const sheetListPageSchema = z.object({
  limit: z.number(),
  count: z.coerce.number().catch(0),
  sheets: z.array(sheetListItemSchema).catch([]),
});

/** Схема полного листа (ответ создания и `GET /{id}`). */
const sheetDetailSchema = z.object({
  id: z.string(),
  name: z.string().catch(''),
  data: z.unknown(),
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
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  }));

  return { limit: page.limit, count: page.count, sheets };
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
  };
}
