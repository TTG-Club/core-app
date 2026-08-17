import type { RenderNode } from '~ui/markup';

import type {
  ArmorDexterityMod,
  BackgroundOption,
  BackgroundSummary,
  CatalogSpellDetail,
  CharacterInnateSpell,
  CharacterToolProficiency,
  ClassChoice,
  ClassFeatureSummary,
  ClassOption,
  ClassSummary,
  ClassTableColumn,
  FeatCatalogItem,
  FeatSelectOption,
  FeatSummary,
  FeatureDescriptionNode,
  GrantedProficiencies,
  InventoryArmor,
  InventoryWeapon,
  InventoryWeaponDamage,
  ItemCatalogItem,
  ItemSummary,
  MagicItemCatalogItem,
  MagicItemRawDetail,
  SpeciesFeatureSummary,
  SpeciesOption,
  SpeciesSummary,
  SpellCatalogItem,
  StartingEquipmentItem,
  StartingEquipmentOption,
} from './types';

import { clamp, uniq } from 'es-toolkit';

import { z } from '~/utils/zod';
import { CasterType } from '~classes/model';
import {
  EMPTY_MAGIC_ITEM_BONUSES,
  MAGIC_ITEM_BONUS_NONE,
} from '~magic-items/model';

import {
  descriptionNodesSchema,
  featModifiersSchema,
} from './character-schema';
import {
  ARMOR_GROUP_BY_API_CATEGORY,
  ARMOR_PROFICIENCY_GROUPS,
  CURRENCY_KEYS_BY_LABEL,
  INVENTORY_QUANTITY_MAX,
  SKILL_NAME_BY_API_KEY,
  SPELL_COMPONENT_LABELS,
  STARTING_EQUIPMENT_DEFAULT_COIN_KEY,
  STARTING_EQUIPMENT_LABELS,
  WEAPON_GROUP_BY_API_CATEGORY,
  WEAPON_PROFICIENCY_GROUPS,
} from './constants';
import {
  getClassToolChoice,
  isAbilityImprovementFeature,
  parseAbilityKeys,
  parseApiAbilityKey,
  parseFeatMarker,
  parseItemWeight,
  parseToolMarker,
  toDescriptionNodes,
} from './utils';

/**
 * Схема ссылки на вид из поиска. Валидируем только используемые поля;
 * пропущенные подписи не роняют разбор.
 */
const speciesLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
  hasLineages: z.boolean().catch(false),
});

/** Ответ поиска видов: плоский массив или конверт `{ value }`. */
const speciesSearchResponseSchema = z
  .union([
    z.array(speciesLinkSchema),
    z.object({ value: z.array(speciesLinkSchema) }),
  ])
  .catch([]);

/** Схема особенности вида в детальном ответе. */
const speciesFeatureSchema = z.object({
  url: z.string().catch(''),
  name: z.object({ rus: z.string().catch('') }),
  description: descriptionNodesSchema,
});

const speciesInnateSpellSchema = z.object({
  spell: z.object({
    url: z.string(),
    name: z.object({ rus: z.string().catch('') }),
    level: z.coerce.number().catch(0),
    school: z.string().catch(''),
    concentration: z.boolean().catch(false),
    ritual: z.boolean().catch(false),
  }),
  requiredLevel: z.coerce.number().min(1).max(20).catch(1),
});

/** Схема детального ответа вида или подвида (нужные листу поля). */
const speciesDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  hasLineages: z.boolean().catch(false),
  properties: z
    .object({
      size: z.string().catch(''),
      speed: z.string().catch(''),
    })
    .catch({ size: '', speed: '' }),
  features: z.array(speciesFeatureSchema).catch([]),
  innateSpells: z.array(speciesInnateSpellSchema).catch([]),
});

/** Ответ списка подвидов: массив детальных ответов. */
const speciesLineagesResponseSchema = z.array(speciesDetailSchema).catch([]);

/**
 * Приведение детального ответа вида к полям, нужным листу персонажа.
 *
 * @param detail разобранный детальный ответ.
 * @returns деталь вида для листа.
 */
function toSpeciesSummary(
  detail: z.infer<typeof speciesDetailSchema>,
): SpeciesSummary {
  const features: SpeciesFeatureSummary[] = detail.features.map((feature) => ({
    url: feature.url,
    name: feature.name.rus,
    description: feature.description,
  }));

  const innateSpells: CharacterInnateSpell[] = detail.innateSpells.map(
    (innateSpell) => ({
      spell: {
        url: innateSpell.spell.url,
        name: innateSpell.spell.name.rus,
        level: innateSpell.spell.level,
        school: innateSpell.spell.school,
        concentration: innateSpell.spell.concentration,
        ritual: innateSpell.spell.ritual,
      },
      requiredLevel: innateSpell.requiredLevel,
    }),
  );

  return {
    url: detail.url,
    name: detail.name.rus,
    hasLineages: detail.hasLineages,
    sizeText: detail.properties.size,
    speedText: detail.properties.speed,
    features,
    innateSpells,
  };
}

/**
 * Схема ссылки на заклинание из поиска. Валидируем только используемые поля.
 */
const spellLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
  }),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().catch(false),
  ritual: z.boolean().catch(false),
});

/** Ответ поиска заклинаний: плоский массив или страница `{ value, Count }`. */
const spellSearchResponseSchema = z
  .union([
    z.array(spellLinkSchema),
    z.object({ value: z.array(spellLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация страницы ответа `GET /api/v2/spells/search` и приведение к списку
 * каталога. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска заклинаний.
 * @returns заклинания каталога для модалки добавления.
 */
export function parseSpellCatalog(input: unknown): SpellCatalogItem[] {
  const parsed = spellSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((spell) => ({
    url: spell.url,
    name: spell.name.rus,
    level: spell.level,
    school: spell.school,
    concentration: spell.concentration,
    ritual: spell.ritual,
  }));
}

/**
 * Схема ссылки на черту из поиска. Валидируем только используемые поля.
 */
const featLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  category: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска черт: плоский массив или конверт `{ value }`. */
const featSearchResponseSchema = z
  .union([
    z.array(featLinkSchema),
    z.object({ value: z.array(featLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/feats/search` и приведение к списку каталога.
 * Битый ответ даёт пустой список, а не исключение. Повторяемость (`repeatability`)
 * приходит из отдельного эндпоинта `/select` и передаётся набором url.
 *
 * @param input сырой ответ поиска черт.
 * @param repeatableUrls url черт, которые можно брать несколько раз.
 * @returns черты каталога для модалки добавления.
 */
export function parseFeatCatalog(
  input: unknown,
  repeatableUrls: Set<string> = new Set(),
): FeatCatalogItem[] {
  const parsed = featSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((feat) => ({
    url: feat.url,
    name: feat.name.rus,
    nameEng: feat.name.eng,
    category: feat.category,
    sourceLabel: feat.source.name.label,
    repeatability: repeatableUrls.has(feat.url),
  }));
}

/** Схема пункта `GET /api/v2/feats/select` (нужен только флаг повторяемости). */
const featSelectItemSchema = z.object({
  url: z.string(),
  repeatability: z.boolean().catch(false),
});

/** Ответ `/select`: плоский массив или конверт `{ value }`. */
const featSelectResponseSchema = z
  .union([
    z.array(featSelectItemSchema),
    z.object({ value: z.array(featSelectItemSchema) }),
  ])
  .catch([]);

/**
 * Схема пункта `/select` с полями выбора черты за улучшение характеристик:
 * помимо повторяемости нужны категория, источник и прибавки к характеристикам.
 */
const featSelectOptionSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }).catch({ rus: '' }),
  category: z.string().catch(''),
  repeatability: z.boolean().catch(false),
  // Характеристики приходят в верхнем регистре (`STRENGTH`); нераспознанные
  // значения отбрасываются разбором ниже.
  abilities: z.array(z.string()).nullable().catch(null),
  abilityScoreIncreaseOptions: z.number().nullable().catch(null),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ `/select` для выбора черты: плоский массив или конверт `{ value }`. */
const featSelectOptionsResponseSchema = z
  .union([
    z.array(featSelectOptionSchema),
    z.object({ value: z.array(featSelectOptionSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/feats/select` и приведение к опциям выбора
 * черты за классовое улучшение характеристик. Битый ответ даёт пустой список,
 * а не исключение.
 *
 * @param input сырой ответ `/select`.
 * @returns опции черт для селектора мастера повышения уровня.
 */
export function parseFeatSelectOptions(input: unknown): FeatSelectOption[] {
  const parsed = featSelectOptionsResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((feat) => ({
    url: feat.url,
    name: feat.name.rus,
    category: feat.category,
    sourceLabel: feat.source.name.label,
    repeatability: feat.repeatability,
    abilities: (feat.abilities ?? []).flatMap((ability) => {
      const key = parseApiAbilityKey(ability);

      return key ? [key] : [];
    }),
    abilityIncreaseCount: Math.max(0, feat.abilityScoreIncreaseOptions ?? 0),
  }));
}

/**
 * Валидация ответа `GET /api/v2/feats/select` и выборка url повторяемых черт.
 * Битый ответ даёт пустой набор — тогда повторяемых черт просто нет.
 *
 * @param input сырой ответ `/select`.
 * @returns набор url черт, которые можно брать несколько раз.
 */
export function parseRepeatableFeatUrls(input: unknown): Set<string> {
  const parsed = featSelectResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return new Set(
    list.filter((feat) => feat.repeatability).map((feat) => feat.url),
  );
}

/**
 * Схема детального ответа черты (нужные листу поля). Постоянные модификаторы
 * лежат внутри механики: у черт без механики её нет вовсе, у черт с механикой
 * без постоянных эффектов — нет блока `modifiers`, и оба случая означают одно и
 * то же — лист черта не двигает.
 */
const featDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  category: z.string().catch(''),
  description: descriptionNodesSchema,
  mechanics: z
    .object({
      modifiers: featModifiersSchema,
      // Владения приходят категориями справочника — лист хранит их записями
      // «вся группа», поэтому разбор ниже их переводит.
      proficiencies: z
        .object({
          weaponCategories: z.array(z.string()).nullable().catch(null),
          armorCategories: z.array(z.string()).nullable().catch(null),
          skills: z.array(z.string()).nullable().catch(null),
          tools: z
            .array(
              z.object({
                url: z.string().catch(''),
                name: z.string().catch(''),
              }),
            )
            .nullable()
            .catch(null),
        })
        .nullable()
        .catch(null),
    })
    .nullable()
    .catch(null),
});

/** Ответ справочника с владениями черты, как его разбирает схема детали. */
type FeatProficienciesResponse = NonNullable<
  NonNullable<z.infer<typeof featDetailSchema>['mechanics']>['proficiencies']
>;

/**
 * Перевод владений черты из справочника в записи листа: категории оружия и
 * доспехов становятся записями «вся группа» (одна на группу — обе половины
 * воинского оружия дают одну запись), инструменты — владениями со ссылкой на
 * предмет. Нераспознанные категории (огнестрельное — своей группы на листе нет)
 * отбрасываются.
 *
 * @param proficiencies владения из механики черты.
 * @returns владения в форме листа; null — черта ничего не выдаёт.
 */
function toGrantedProficiencies(
  proficiencies: FeatProficienciesResponse,
): GrantedProficiencies | null {
  const weapons = uniq(
    (proficiencies.weaponCategories ?? []).flatMap((category) => {
      const key = WEAPON_GROUP_BY_API_CATEGORY[category];

      const group = WEAPON_PROFICIENCY_GROUPS.find(
        (candidate) => candidate.key === key,
      );

      return group ? [group.all] : [];
    }),
  );

  const armor = uniq(
    (proficiencies.armorCategories ?? []).flatMap((category) => {
      const key = ARMOR_GROUP_BY_API_CATEGORY[category];

      const group = ARMOR_PROFICIENCY_GROUPS.find(
        (candidate) => candidate.key === key,
      );

      return group ? [group.all] : [];
    }),
  );

  // Инструмент без названия показать нечем, а без ссылки — можно: у своих
  // инструментов её и не бывает.
  const tools = (proficiencies.tools ?? []).flatMap((tool) =>
    tool.name ? [{ name: tool.name, url: tool.url || null }] : [],
  );

  // Незнакомый навык отбрасывается: списки справочника и листа сошлись, значит
  // чужое значение — это опечатка в данных, а не навык, которого лист не знает.
  const skills = uniq(
    (proficiencies.skills ?? []).flatMap((skill) => {
      const name = SKILL_NAME_BY_API_KEY[skill];

      return name ? [name] : [];
    }),
  );

  if (!weapons.length && !armor.length && !tools.length && !skills.length) {
    return null;
  }

  return { armor, weapons, tools, languages: [], skills };
}

/**
 * Валидация детального ответа `GET /api/v2/feats/{url}`.
 *
 * @param input сырой детальный ответ черты.
 * @returns деталь черты или null при неожиданном ответе.
 */
export function parseFeatDetail(input: unknown): FeatSummary | null {
  const result = featDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  const proficiencies = result.data.mechanics?.proficiencies;

  return {
    url: result.data.url,
    name: result.data.name.rus,
    category: result.data.category,
    description: result.data.description,
    modifiers: result.data.mechanics?.modifiers ?? null,
    proficiencies: proficiencies ? toGrantedProficiencies(proficiencies) : null,
  };
}

/**
 * Схема ссылки на предмет из поиска. Валидируем только используемые поля.
 */
const itemLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  cost: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска предметов: плоский массив или конверт `{ value }`. */
const itemSearchResponseSchema = z
  .union([
    z.array(itemLinkSchema),
    z.object({ value: z.array(itemLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/item/search` и приведение к списку каталога.
 * Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска предметов.
 * @returns предметы каталога для модалки добавления.
 */
export function parseItemCatalog(input: unknown): ItemCatalogItem[] {
  const parsed = itemSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((catalogItem) => ({
    url: catalogItem.url,
    name: catalogItem.name.rus,
    nameEng: catalogItem.name.eng,
    cost: catalogItem.cost,
    sourceLabel: catalogItem.source.name.label,
  }));
}

/**
 * Схема ссылки на магический предмет из поиска. Валидируем только используемые
 * поля.
 */
const magicItemLinkSchema = z.object({
  url: z.string(),
  name: z.object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  }),
  category: z.string().catch(''),
  rarity: z.string().catch(''),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска магических предметов: плоский массив или конверт `{ value }`. */
const magicItemSearchResponseSchema = z
  .union([
    z.array(magicItemLinkSchema),
    z.object({ value: z.array(magicItemLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/magic-items/search` и приведение к списку
 * каталога. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска магических предметов.
 * @returns магические предметы каталога для модалки добавления.
 */
export function parseMagicItemCatalog(input: unknown): MagicItemCatalogItem[] {
  const parsed = magicItemSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((catalogItem) => ({
    url: catalogItem.url,
    name: catalogItem.name.rus,
    nameEng: catalogItem.name.eng,
    category: catalogItem.category,
    rarity: catalogItem.rarity,
    sourceLabel: catalogItem.source.name.label,
  }));
}

/**
 * Схема «сырого» ответа магического предмета: редкость приходит значением
 * справочника, связанные немагические предметы — списком слагов. Форма — как у
 * формы редактора магических предметов (`MagicItemCreate`).
 */
const magicItemRawSchema = z
  .object({
    rarity: z
      .object({
        type: z
          .enum([
            'COMMON',
            'UNCOMMON',
            'RARE',
            'VERY_RARE',
            'LEGENDARY',
            'ARTIFACT',
            'VARIES',
            'UNKNOWN',
          ])
          .catch('UNKNOWN'),
      })
      .nullable()
      .catch(null),
    items: z.array(z.string()).catch([]),
    // Записи, сохранённые до появления полей бонусов, приходят без блока.
    bonuses: z
      .object({
        attack: z.coerce.number().catch(MAGIC_ITEM_BONUS_NONE),
        damage: z.coerce.number().catch(MAGIC_ITEM_BONUS_NONE),
        armorClass: z.coerce.number().catch(MAGIC_ITEM_BONUS_NONE),
      })
      .nullable()
      .catch(null),
    attunement: z
      .object({ requires: z.boolean().catch(false) })
      .nullable()
      .catch(null),
    // Старое плоское поле зарядов раздела: у большинства записей заполнено
    // только оно, поэтому оно и остаётся запасным источником максимума.
    charges: z.coerce.number().nullable().catch(null),
    // Механика влияния на лист; записи до её появления приходят без блока.
    mechanics: z
      .object({
        resource: z
          .object({ maxCharges: z.coerce.number().nullable().catch(null) })
          .nullable()
          .catch(null),
      })
      .nullable()
      .catch(null),
  })
  .catch({
    rarity: null,
    items: [],
    bonuses: null,
    attunement: null,
    charges: null,
    mechanics: null,
  });

/**
 * Валидация «сырого» ответа `GET /api/v2/magic-items/{url}/raw`.
 *
 * @param input сырой ответ магического предмета.
 * @returns редкость, связанные немагические предметы и состояние для листа.
 */
export function parseMagicItemRaw(input: unknown): MagicItemRawDetail {
  const parsed = magicItemRawSchema.parse(input);

  // Максимум зарядов мастерская задаёт в механике, но заполнена она пока не
  // везде — у остальных записей заряды лежат в старом плоском поле раздела.
  const maxCharges =
    parsed.mechanics?.resource?.maxCharges ?? parsed.charges ?? 0;

  return {
    rarity: parsed.rarity?.type ?? 'UNKNOWN',
    baseItemUrls: parsed.items,
    bonuses: parsed.bonuses ?? EMPTY_MAGIC_ITEM_BONUSES,
    requiresAttunement: parsed.attunement?.requires ?? false,
    maxCharges: Math.max(0, Math.trunc(maxCharges)),
  };
}

/** Схема детального ответа предмета (нужные листу поля). */
const itemDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  category: z.enum(['WEAPON', 'ARMOR', 'ITEM']).catch('ITEM'),
  types: z.string().catch(''),
  cost: z.string().catch(''),
  weight: z.string().catch(''),
});

/**
 * Валидация детального ответа `GET /api/v2/item/{url}`.
 *
 * @param input сырой детальный ответ предмета.
 * @returns деталь предмета или null при неожиданном ответе.
 */
export function parseItemDetail(input: unknown): ItemSummary | null {
  const result = itemDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return {
    url: result.data.url,
    name: result.data.name.rus,
    category: result.data.category,
    typesLabel: result.data.types,
    cost: result.data.cost,
    weight: parseItemWeight(result.data.weight),
    // Публичная деталь структуру доспеха/оружия не отдаёт — её докладывает /raw.
    armor: null,
    weapon: null,
  };
}

/** Правила Ловкости из «сырого» ответа доспеха к внутреннему представлению. */
const ARMOR_DEXTERITY_MOD_MAP: Record<
  'PLUS' | 'PLUS_MAX_2' | 'NONE',
  ArmorDexterityMod
> = {
  PLUS: 'full',
  PLUS_MAX_2: 'capped',
  NONE: 'none',
};

/**
 * Схема «сырого» ответа предмета `GET /api/v2/item/{url}/raw` в части доспеха.
 * Форма — как у формы редактора предметов (`ArmorCreate`): объект `armor` с
 * числовым КД и правилом Ловкости; у не-доспехов приходит null.
 */
const itemRawArmorSchema = z
  .object({
    armor: z
      .object({
        category: z.string().catch(''),
        armorClass: z.coerce.number().catch(0),
        mod: z.enum(['PLUS', 'PLUS_MAX_2', 'NONE']).catch('PLUS'),
      })
      .nullable()
      .catch(null),
  })
  .catch({ armor: null });

/**
 * Признак щита: доспех, который складывается с бронёй, а не заменяет её.
 * Определяется по категории доспеха или по названию/типам предмета — устойчиво
 * к формату enum категории на бэке.
 *
 * @param category категория доспеха из «сырого» ответа.
 * @param item деталь предмета (имя и подпись типов).
 * @returns это щит.
 */
function isShieldArmor(category: string, item: ItemSummary): boolean {
  return /щит|shield/i.test(`${category} ${item.name} ${item.typesLabel}`);
}

/**
 * Разбор параметров доспеха из «сырого» ответа предмета для подсчёта КД.
 *
 * @param input сырой ответ `GET /api/v2/item/{url}/raw`.
 * @param item уже разобранная деталь предмета (имя, типы — для признака щита).
 * @returns параметры доспеха или null (не доспех либо нет данных).
 */
export function parseItemArmor(
  input: unknown,
  item: ItemSummary,
): InventoryArmor | null {
  const { armor } = itemRawArmorSchema.parse(input);

  if (!armor) {
    return null;
  }

  return {
    baseArmorClass: armor.armorClass,
    dexterityMod: ARMOR_DEXTERITY_MOD_MAP[armor.mod],
    shield: isShieldArmor(armor.category, item),
  };
}

/**
 * Схема урона оружия в «сыром» ответе (форма `Damage` редактора): бросок костей
 * и тип урона. Незаполненные поля редактор отдаёт как null.
 */
const itemRawWeaponDamageSchema = z
  .object({
    roll: z
      .object({
        diceCount: z.coerce.number().nullable().catch(null),
        dice: z.string().nullable().catch(null),
        bonus: z.coerce.number().nullable().catch(null),
      })
      .nullable()
      .catch(null),
    type: z.string().nullable().catch(null),
  })
  .nullable()
  .catch(null);

/**
 * Схема броска урона свойства «Универсальное» в «сыром» ответе: тот же бросок
 * костей, но без типа урона — он у оружия один на оба хвата.
 */
const itemRawWeaponVersatileSchema = z
  .object({
    diceCount: z.coerce.number().nullable().catch(null),
    dice: z.string().nullable().catch(null),
    bonus: z.coerce.number().nullable().catch(null),
  })
  .nullable()
  .catch(null);

/**
 * Схема «сырого» ответа предмета в части оружия (форма `WeaponCreate` редактора):
 * категория (простое/воинское, рукопашное/дальнобойное), свойства, боеприпас и
 * урон — обычный и по свойству «Универсальное».
 */
const itemRawWeaponSchema = z
  .object({
    weapon: z
      .object({
        category: z.string().catch(''),
        properties: z.array(z.string()).catch([]),
        ammo: z.string().nullable().catch(null),
        damage: itemRawWeaponDamageSchema,
        versatile: itemRawWeaponVersatileSchema,
      })
      .nullable()
      .catch(null),
  })
  .catch({ weapon: null });

/**
 * Число граней кости из значения справочника (`d8` → 8).
 *
 * @param dice значение кости из «сырого» ответа.
 * @returns количество граней; 0 — значение не распознано.
 */
function parseDiceFaces(dice: string | null): number {
  const match = /\d+/.exec(dice ?? '');

  return match ? Number(match[0]) : 0;
}

/**
 * Разбор урона оружия из «сырого» ответа предмета: кости, собственный бонус и
 * тип урона. Оружие без костей урона (например, боеприпас) даёт null.
 *
 * @param damage блок урона из «сырого» ответа оружия.
 * @returns урон оружия или null (костей нет).
 */
function parseWeaponDamage(
  damage: z.infer<typeof itemRawWeaponDamageSchema>,
): InventoryWeaponDamage | null {
  const diceFaces = parseDiceFaces(damage?.roll?.dice ?? null);
  const diceCount = damage?.roll?.diceCount ?? 0;

  if (diceFaces <= 0 || diceCount <= 0) {
    return null;
  }

  return {
    diceCount,
    diceFaces,
    bonus: damage?.roll?.bonus ?? 0,
    type: damage?.type ?? '',
  };
}

/**
 * Разбор урона свойства «Универсальное»: справочник отдаёт только бросок, а тип
 * урона у оружия один на оба хвата — берём его из обычного урона.
 *
 * @param versatile блок броска двумя руками из «сырого» ответа оружия.
 * @param damage уже разобранный обычный урон оружия.
 * @returns урон двумя руками или null (свойства нет либо костей не отдали).
 */
function parseWeaponVersatileDamage(
  versatile: z.infer<typeof itemRawWeaponVersatileSchema>,
  damage: InventoryWeaponDamage | null,
): InventoryWeaponDamage | null {
  const diceFaces = parseDiceFaces(versatile?.dice ?? null);
  const diceCount = versatile?.diceCount ?? 0;

  if (diceFaces <= 0 || diceCount <= 0) {
    return null;
  }

  return {
    diceCount,
    diceFaces,
    bonus: versatile?.bonus ?? 0,
    type: damage?.type ?? '',
  };
}

/**
 * Разбор параметров оружия из «сырого» ответа предмета для подсчёта бонуса атаки.
 * Категория владения и признаки «дальнобойное»/«фехтовальное» распознаются по
 * категории/свойствам (RU- и EN-корни) — устойчиво к формату справочника на бэке.
 *
 * @param input сырой ответ `GET /api/v2/item/{url}/raw`.
 * @returns параметры оружия или null (не оружие либо нет данных).
 */
export function parseItemWeapon(input: unknown): InventoryWeapon | null {
  const { weapon } = itemRawWeaponSchema.parse(input);

  if (!weapon) {
    return null;
  }

  const damage = parseWeaponDamage(weapon.damage);

  return {
    category: /martial|воинск/i.test(weapon.category) ? 'martial' : 'simple',
    ranged:
      /ranged|дальноб|дистанц|стрелк/i.test(weapon.category)
      || Boolean(weapon.ammo),
    finesse: weapon.properties.some((property) =>
      /фехтов|finesse/i.test(property),
    ),
    // «Тяжёлое» ищем в свойствах, а не в названии: тяжёлым оружие делает
    // свойство, а не слово «тяжёлый» в имени.
    heavy: weapon.properties.some((property) =>
      /тяж[её]л|heavy/i.test(property),
    ),
    // Немагическое оружие своего бонуса к атаке не имеет: его даёт только магия.
    attackBonus: MAGIC_ITEM_BONUS_NONE,
    damage,
    // Свойство «Универсальное» распознаём по самому броску, а не по строке в
    // `properties`: без второй кости переключать хват всё равно нечем.
    versatileDamage: parseWeaponVersatileDamage(weapon.versatile, damage),
    // Дополнительный урон своего типа справочник предметов не отдаёт: его даёт
    // магия, и на листе он появляется только у своего предмета.
    extraDamage: null,
  };
}

/**
 * Валидация ответа `GET /api/v2/species/search` и приведение к опциям
 * автокомплита. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска видов.
 * @returns опции автокомплита выбора вида.
 */
export function parseSpeciesOptions(input: unknown): SpeciesOption[] {
  const parsed = speciesSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((species) => ({
    url: species.url,
    name: species.name.rus,
    sourceLabel: species.source.name.label,
    hasLineages: species.hasLineages,
  }));
}

/**
 * Валидация детального ответа `GET /api/v2/species/{url}`.
 *
 * @param input сырой детальный ответ вида.
 * @returns деталь вида или null при неожиданном ответе.
 */
export function parseSpeciesDetail(input: unknown): SpeciesSummary | null {
  const result = speciesDetailSchema.safeParse(input);

  return result.success ? toSpeciesSummary(result.data) : null;
}

/**
 * Валидация ответа `GET /api/v2/species/{url}/lineages`.
 *
 * @param input сырой ответ списка подвидов.
 * @returns детали подвидов; битый ответ даёт пустой список.
 */
export function parseSpeciesLineages(input: unknown): SpeciesSummary[] {
  return speciesLineagesResponseSchema.parse(input).map(toSpeciesSummary);
}

/** Схема ссылки на класс/подкласс из поиска. Валидируем нужные листу поля. */
const classLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
  hasSubclasses: z.boolean().catch(false),
});

/** Ответ поиска классов/подклассов: плоский массив или конверт `{ value }`. */
const classSearchResponseSchema = z
  .union([
    z.array(classLinkSchema),
    z.object({ value: z.array(classLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/classes/search` (и `/{url}/subclasses`) и
 * приведение к опциям списка. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска классов или подклассов.
 * @param forceNoSubclasses принудительно снять флаг подклассов (для подклассов).
 * @returns опции классов для визарда.
 */
export function parseClassOptions(
  input: unknown,
  forceNoSubclasses = false,
): ClassOption[] {
  const parsed = classSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((classLink) => ({
    url: classLink.url,
    name: classLink.name.rus,
    sourceLabel: classLink.source.name.label,
    hasSubclasses: forceNoSubclasses ? false : classLink.hasSubclasses,
  }));
}

/** Схема колонки таблицы прогрессии класса. */
const classTableColumnSchema = z.object({
  name: z.string().catch(''),
  resourceRecovery: z.enum(['NONE', 'SHORT_REST', 'LONG_REST']).catch('NONE'),
  scaling: z
    .array(
      z.object({
        level: z.coerce.number().catch(1),
        value: z.string().catch(''),
      }),
    )
    .catch([]),
});

/** Узел разметки описания класса; отсутствие приводится к пустой строке. */
const renderNodeSchema = z
  .custom<RenderNode>((value) => value !== undefined)
  .catch('');

/** Схема особенности класса в детальном ответе. */
const classFeatureSchema = z.object({
  key: z.string().catch(''),
  level: z.coerce.number().catch(1),
  name: z.string().catch(''),
  description: renderNodeSchema,
  isSubclass: z.boolean().catch(false),
  fightingStyleChoice: z.boolean().catch(false),
  abilityImprovement: z.boolean().catch(false),
  // Структурный выбор владения навыками у самого умения. Заполнен не везде:
  // где его нет, выбор по-прежнему распознаётся по прозе описания.
  skillChoice: z
    .object({
      count: z.coerce.number().catch(1),
      skills: z.array(z.string()).catch([]),
    })
    .nullable()
    .catch(null),
  scaling: z
    .array(z.object({ level: z.coerce.number().catch(0) }))
    .nullable()
    .catch(null),
});

/**
 * Схема позиции варианта стартового снаряжения. Каталожная позиция приходит со
 * слагом и названием, а внекаталожная («музыкальный инструмент») — только
 * описанием, поэтому пусто может быть любое поле.
 */
const startingEquipmentItemSchema = z.object({
  url: z.string().nullable().catch(null),
  name: z.string().nullable().catch(null),
  quantity: z.coerce.number().nullable().catch(null),
  description: z.string().nullable().catch(null),
});

/** Схема варианта стартового снаряжения («А», «Б», …). */
const startingEquipmentOptionSchema = z.object({
  label: z.string().catch(''),
  items: z.array(startingEquipmentItemSchema).catch([]),
  coins: z.coerce.number().nullable().catch(null),

  /** Сокращение денежной единицы монет варианта («зм»). */
  coin: z.string().nullable().catch(null),
});

/** Схема поля `startingEquipment` — одинакового у класса и предыстории. */
const startingEquipmentSchema = z
  .array(startingEquipmentOptionSchema)
  .catch([]);

/**
 * Приведение позиции варианта стартового снаряжения к записи листа. Название
 * берётся из каталожного поля, а у позиции без ссылки — из описания; описание
 * при заполненном названии становится уточнением («Книга (по истории)»).
 *
 * @param item разобранная позиция варианта.
 * @returns позиция для листа; null — названия нет ни в одном поле.
 */
function toStartingEquipmentItem(
  item: z.infer<typeof startingEquipmentItemSchema>,
): StartingEquipmentItem | null {
  const catalogName = item.name?.trim() ?? '';
  const description = item.description?.trim() ?? '';
  const name = catalogName || description;

  if (!name) {
    return null;
  }

  return {
    url: item.url?.trim() ?? '',
    name,
    hint: catalogName ? description : '',
    // Количество приходит и пустым, и нулём — это всё одна штука.
    quantity: clamp(Math.trunc(item.quantity || 1), 1, INVENTORY_QUANTITY_MAX),
  };
}

/**
 * Уникальная метка варианта: метка служит и значением переключателя, поэтому
 * пустая заменяется номером по порядку, а повтор — номером в скобках. Иначе
 * второй вариант с той же меткой выбрать было бы нечем — переключатель нашёл
 * бы первый.
 *
 * @param label метка варианта из ответа (может быть пустой).
 * @param index номер варианта среди непустых.
 * @param usedLabels уже занятые метки; пополняется выбранной.
 * @returns метка, которой ещё нет среди вариантов.
 */
function getUniqueStartingEquipmentLabel(
  label: string,
  index: number,
  usedLabels: Set<string>,
): string {
  const baseLabel =
    label || `${STARTING_EQUIPMENT_LABELS.optionFallbackLabel} ${index + 1}`;

  let uniqueLabel = baseLabel;
  let suffix = index + 1;

  while (usedLabels.has(uniqueLabel)) {
    uniqueLabel = `${baseLabel} (${suffix})`;
    suffix += 1;
  }

  usedLabels.add(uniqueLabel);

  return uniqueLabel;
}

/**
 * Приведение поля `startingEquipment` к вариантам выбора. Варианты без
 * предметов и без монет отбрасываются: выбирать в них нечего.
 *
 * @param input сырое значение поля из детального ответа.
 * @returns варианты стартового снаряжения в порядке ответа.
 */
function toStartingEquipmentOptions(input: unknown): StartingEquipmentOption[] {
  const options = startingEquipmentSchema.parse(input);
  const usedLabels = new Set<string>();

  return (
    options
      .map((option) => {
        const coinLabel = option.coin?.trim().toLowerCase() ?? '';

        return {
          label: option.label.trim(),
          items: option.items
            .map(toStartingEquipmentItem)
            .filter((item): item is StartingEquipmentItem => item !== null),
          coins: Math.max(Math.trunc(option.coins ?? 0), 0),
          coinKey:
            CURRENCY_KEYS_BY_LABEL[coinLabel]
            ?? STARTING_EQUIPMENT_DEFAULT_COIN_KEY,
        };
      })
      .filter((option) => option.items.length > 0 || option.coins > 0)
      // Нумерация идёт по непустым вариантам, поэтому метки назначаются после
      // отсева: иначе в списке из двух строк мог бы оказаться «Вариант 3».
      .map((option, index) => ({
        ...option,
        label: getUniqueStartingEquipmentLabel(option.label, index, usedLabels),
      }))
  );
}

/** Схема детального ответа класса или подкласса (нужные листу поля). */
const classDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  hasSubclasses: z.boolean().catch(false),
  hitDice: z
    .object({
      label: z.string().catch(''),
      maxValue: z.coerce.number().catch(0),
    })
    .catch({ label: '', maxValue: 0 }),
  savingThrows: z.string().catch(''),
  // Ключевые характеристики прозой («Харизма и Сила») — из них выводится
  // требование мультиклассирования «13 в характеристике».
  primaryCharacteristics: z.string().catch(''),
  proficiency: z
    .object({
      armor: z.string().catch(''),
      weapon: z.string().catch(''),
      tool: z.string().catch(''),
      skill: z.string().catch(''),
    })
    .catch({ armor: '', weapon: '', tool: '', skill: '' }),
  // Тип заклинательства класса; незнакомое значение приводится к null — ячеек
  // такому классу лист не даст.
  casterType: z.nativeEnum(CasterType).nullable().catch(null),
  table: z.array(classTableColumnSchema).catch([]),
  features: z.array(classFeatureSchema).catch([]),
  // Разбирается отдельной функцией: то же поле есть и у предыстории.
  startingEquipment: z.unknown(),
});

/**
 * Приведение детального ответа класса к полям, нужным листу персонажа.
 *
 * @param detail разобранный детальный ответ.
 * @returns деталь класса для листа.
 */
function toClassSummary(
  detail: z.infer<typeof classDetailSchema>,
): ClassSummary {
  const features: ClassFeatureSummary[] = detail.features.map((feature) => ({
    key: feature.key,
    level: feature.level,
    name: feature.name,
    description: toDescriptionNodes(feature.description),
    isSubclass: feature.isSubclass,
    fightingStyleChoice: feature.fightingStyleChoice,
    // Флага в ответе класса пока нет — тогда умение распознаётся по описанию,
    // где «Улучшение характеристик» ссылается на одноимённую черту.
    // Флаг приходит с бэка; распознавание по названию и описанию остаётся
    // страховкой для записей, где он не проставлен.
    abilityImprovement:
      feature.abilityImprovement
      || isAbilityImprovementFeature(feature.name, feature.description),
    skillChoice: feature.skillChoice,
    scalingLevels: (feature.scaling ?? [])
      .map((entry) => entry.level)
      .filter((entry) => entry > 0),
  }));

  const table: ClassTableColumn[] = detail.table.map((column) => ({
    name: column.name,
    resourceRecovery: column.resourceRecovery,
    scaling: column.scaling,
  }));

  return {
    url: detail.url,
    name: detail.name.rus,
    hasSubclasses: detail.hasSubclasses,
    casterType: detail.casterType,
    hitDie: detail.hitDice.maxValue,
    hitDieLabel: detail.hitDice.label,
    savingThrowsText: detail.savingThrows,
    savingThrows: parseAbilityKeys(detail.savingThrows),
    primaryCharacteristics: detail.primaryCharacteristics,
    proficiencyText: detail.proficiency,
    table,
    features,
    startingEquipment: toStartingEquipmentOptions(detail.startingEquipment),
  };
}

/**
 * Валидация детального ответа `GET /api/v2/classes/{url}`.
 *
 * @param input сырой детальный ответ класса или подкласса.
 * @returns деталь класса или null при неожиданном ответе.
 */
export function parseClassDetail(input: unknown): ClassSummary | null {
  const result = classDetailSchema.safeParse(input);

  return result.success ? toClassSummary(result.data) : null;
}

/** Схема ссылки на предысторию из поиска. Валидируем нужные листу поля. */
const backgroundLinkSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  source: z
    .object({
      name: z.object({ label: z.string().catch('') }).catch({ label: '' }),
    })
    .catch({ name: { label: '' } }),
});

/** Ответ поиска предысторий: плоский массив или конверт `{ value }`. */
const backgroundSearchResponseSchema = z
  .union([
    z.array(backgroundLinkSchema),
    z.object({ value: z.array(backgroundLinkSchema) }),
  ])
  .catch([]);

/**
 * Валидация ответа `GET /api/v2/backgrounds/search` и приведение к опциям
 * списка. Битый ответ даёт пустой список, а не исключение.
 *
 * @param input сырой ответ поиска предысторий.
 * @returns опции предысторий для визарда.
 */
export function parseBackgroundOptions(input: unknown): BackgroundOption[] {
  const parsed = backgroundSearchResponseSchema.parse(input);
  const list = Array.isArray(parsed) ? parsed : parsed.value;

  return list.map((background) => ({
    url: background.url,
    name: background.name.rus,
    sourceLabel: background.source.name.label,
  }));
}

/** Схема детального ответа предыстории (нужные листу поля). */
const backgroundDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  abilityScores: z.string().catch(''),
  skillProficiencies: z.string().catch(''),
  feat: z.string().catch(''),
  toolProficiency: z.array(z.string()).catch([]),
  // Справка приходит как описание раздела — строки-абзацы вперемешку с узлами
  // разметки (список вариантов «А)/Б)»), поэтому массивом строк не разбирается.
  equipment: descriptionNodesSchema,
  // Разбирается отдельной функцией: то же поле есть и у класса.
  startingEquipment: z.unknown(),
});

/**
 * Валидация детального ответа `GET /api/v2/backgrounds/{url}`.
 *
 * @param input сырой детальный ответ предыстории.
 * @param skillNames имена всех навыков персонажа (для распознавания навыков).
 * @returns деталь предыстории или null при неожиданном ответе.
 */
export function parseBackgroundDetail(
  input: unknown,
  skillNames: string[],
): BackgroundSummary | null {
  const result = backgroundDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  const detail = result.data;

  const toolFixed: CharacterToolProficiency[] = [];

  let toolChoice: ClassChoice | null = null;

  for (const toolText of detail.toolProficiency) {
    // Владения приходят с разметкой каталога («{@item Воровские
    // инструменты|url:thieves-tools-phb}»): подпись идёт в лист, ссылка —
    // в кнопку описания инструмента.
    const tool = parseToolMarker(toolText);

    const choice = getClassToolChoice(tool.name, 'background-tool');

    if (choice) {
      toolChoice = toolChoice ?? choice;
    } else if (tool.name) {
      toolFixed.push(tool);
    }
  }

  const feat = parseFeatMarker(detail.feat);

  return {
    url: detail.url,
    name: detail.name.rus,
    abilities: parseAbilityKeys(detail.abilityScores),
    abilitiesText: detail.abilityScores,
    skills: skillNames.filter((name) =>
      detail.skillProficiencies.includes(name),
    ),
    skillsText: detail.skillProficiencies,
    toolFixed,
    toolChoice,
    featUrl: feat.url,
    featName: feat.name,
    featSubchoice: feat.subchoice,
    equipment: detail.equipment,
    startingEquipment: toStartingEquipmentOptions(detail.startingEquipment),
  };
}

/**
 * Схема описания записи каталога. У деталей заклинаний, предметов и магических
 * предметов описание лежит одинаково — массивом строк и узлов разметки сайта.
 */
const catalogDescriptionSchema = z.object({
  description: descriptionNodesSchema,
});

/**
 * Валидация описания из детального ответа каталога
 * (`GET /api/v2/{spells,item,magic-items}/{url}`).
 *
 * @param input сырой детальный ответ записи каталога.
 * @returns узлы описания; пустой массив при неожиданном ответе.
 */
export function parseCatalogDescription(
  input: unknown,
): FeatureDescriptionNode[] {
  const result = catalogDescriptionSchema.safeParse(input);

  return result.success ? result.data.description : [];
}

/** Компоненты заклинания в детальном ответе: флаги и материальный компонент. */
interface SpellComponentsResponse {
  /** Вербальный компонент. */
  v?: boolean;

  /** Соматический компонент. */
  s?: boolean;

  /** Описание материального компонента; пусто — компонента нет. */
  m?: string;
}

/** Схема компонентов заклинания из детального ответа. */
const spellComponentsSchema = z
  .object({
    v: z.boolean().catch(false),
    s: z.boolean().catch(false),
    m: z.string().catch(''),
  })
  .partial()
  .catch({});

/** Схема детального ответа заклинания (нужные справочнику поля). */
const catalogSpellDetailSchema = catalogDescriptionSchema.extend({
  castingTime: z.string().catch(''),
  range: z.string().catch(''),
  duration: z.string().catch(''),
  components: spellComponentsSchema,
});

/**
 * Компоненты заклинания строкой. Деталь каталога отдаёт их флагами, а лист
 * хранит строкой — приводим к форме листа, чтобы карточка справочника рисовалась
 * тем же кодом, что и у своих заклинаний.
 *
 * @param components компоненты из детального ответа.
 * @returns компоненты через запятую; пустая строка — компонентов нет.
 */
function getSpellComponentsText(components: SpellComponentsResponse): string {
  const parts: string[] = [];

  if (components.v) {
    parts.push(SPELL_COMPONENT_LABELS.verbal);
  }

  if (components.s) {
    parts.push(SPELL_COMPONENT_LABELS.somatic);
  }

  if (components.m) {
    parts.push(`${SPELL_COMPONENT_LABELS.material} (${components.m})`);
  }

  return parts.join(', ');
}

/**
 * Схема «сырого» ответа заклинания в части урона: формулы вида `8к6@dmg.fire`
 * лежат в блоке воздействия, который публичная деталь не отдаёт.
 */
const spellRawDamageSchema = z
  .object({
    effect: z
      .object({
        damageFormulas: z.array(z.string()).catch([]),
      })
      .nullable()
      .catch(null),
  })
  .catch({ effect: null });

/**
 * Валидация «сырого» ответа `GET /api/v2/spells/{url}/raw` в части урона.
 * Неожиданный ответ даёт пустой список, а не исключение: заклинание просто
 * останется без плитки урона.
 *
 * @param input сырой ответ заклинания.
 * @returns формулы урона из справочника.
 */
export function parseSpellDamageFormulas(input: unknown): string[] {
  return spellRawDamageSchema.parse(input).effect?.damageFormulas ?? [];
}

/**
 * Валидация детального ответа `GET /api/v2/spells/{url}` для справочника PDF:
 * описание и характеристики в той же форме, в какой их хранит своё заклинание.
 *
 * @param input сырой детальный ответ заклинания.
 * @returns характеристики и описание заклинания; null при неожиданном ответе.
 */
export function parseCatalogSpellDetail(
  input: unknown,
): CatalogSpellDetail | null {
  const result = catalogSpellDetailSchema.safeParse(input);

  if (!result.success) {
    return null;
  }

  return {
    castingTime: result.data.castingTime,
    range: result.data.range,
    components: getSpellComponentsText(result.data.components),
    duration: result.data.duration,
    description: result.data.description,
  };
}
