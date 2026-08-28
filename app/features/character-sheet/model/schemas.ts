import type { RenderNode } from '~ui/markup';

import type {
  ArmorDexterityMod,
  BackgroundOption,
  BackgroundSummary,
  CatalogSpellDetail,
  CharacterInnateSpell,
  CharacterSpell,
  CharacterToolProficiency,
  ClassChoice,
  ClassFeatureSummary,
  ClassOption,
  ClassSummary,
  ClassTableColumn,
  CounterRecovery,
  FeatAbilityBonusOption,
  FeatCatalogItem,
  FeatCounter,
  FeatSelectOption,
  FeatSummary,
  FeatureDescriptionNode,
  GrantedProficiencies,
  InventoryArmor,
  InventoryBonusActivation,
  InventoryChargesEvent,
  InventoryChargesRecovery,
  InventoryExtraDamage,
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
import { normalizeLoadedActiveEffects } from '~active-effects/model';
import { CasterType } from '~classes/model';
import {
  EMPTY_MAGIC_ITEM_BONUSES,
  MAGIC_ITEM_BONUS_NONE,
} from '~magic-items/model';
import {
  DAMAGE_TYPE_LABELS,
  parseDamageFormulaDice,
  parseLoadedDamageFormulaParts,
} from '~ui/damage-formula';

import {
  descriptionNodesSchema,
  featModifiersSchema,
} from './character-schema';
import {
  ABILITY_CHOICE_ID_SEGMENT,
  ABILITY_IMPROVEMENT_SCORE_MAX,
  ABILITY_LABELS,
  ABILITY_ORDER,
  ABILITY_VARIANT_CHOICE_ID_SEGMENT,
  API_SHORT_REST_ONE_RECOVERY,
  API_SHORT_REST_RECOVERY,
  ARMOR_GROUP_BY_API_CATEGORY,
  ARMOR_PROFICIENCY_GROUPS,
  BACKGROUND_TOOL_CHOICE_ID,
  BACKGROUND_TOOL_CHOICE_LABEL,
  CANTRIP_SPELL_LEVEL,
  CURRENCY_KEYS_BY_LABEL,
  DAMAGE_TYPE_NAMES,
  FEAT_SPELL_CLASS_CHOICE_KEY,
  INVENTORY_QUANTITY_MAX,
  LANGUAGE_NAME_BY_API_KEY,
  SHEET_FEAT_CHOICE_LABELS,
  SHEET_FEAT_MODAL_LABELS,
  SKILL_NAME_BY_API_KEY,
  SPELL_COMPONENT_LABELS,
  STARTING_EQUIPMENT_DEFAULT_COIN_KEY,
  STARTING_EQUIPMENT_LABELS,
  WEAPON_GROUP_BY_API_CATEGORY,
  WEAPON_PROFICIENCY_GROUPS,
} from './constants';
import {
  getAbilityBonusLabel,
  getCharacterFeatureId,
  getClassFeatureId,
  getClassToolChoice,
  getLegacyClassFeatChoices,
  isAbilityImprovementFeatChoice,
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

/**
 * Владения, выдаваемые механикой записи справочника, — черты, вида, умения
 * класса. Схема одна на всех: блок в core-api общий, и вторая копия тех же
 * полей разошлась бы с первой.
 *
 * Категории приходят справочными ключами, а лист хранит владения записями «вся
 * группа»: перевод делает {@link toGrantedProficiencies}.
 */
const mechanicsProficienciesSchema = z
  .object({
    weaponCategories: z.array(z.string()).nullable().catch(null),
    armorCategories: z.array(z.string()).nullable().catch(null),
    skills: z.array(z.string()).nullable().catch(null),
    languages: z.array(z.string()).nullable().catch(null),
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
  .catch(null);

/**
 * Выборы, которые запись справочника предлагает игроку. Разбираются поля тех
 * видов, которые лист умеет применить, — см. {@link toMechanicChoices}.
 */
const mechanicsChoicesSchema = z
  .array(
    z.object({
      key: z.string().catch(''),
      type: z.string().nullable().catch(null),
      label: z.string().nullable().catch(null),
      count: z.coerce.number().nullable().catch(null),
      grants: z.string().nullable().catch(null),
      // Уровень, с которого выбор открывается: умение спрашивает одно и то же
      // не один раз — компетентность плута приходит на первом уровне и на
      // шестом, и это две строки одной механики, а не два умения.
      requiredLevel: z.coerce.number().min(1).max(20).nullable().catch(null),
      // Ступени количества по уровням: сколько ВСЕГО выбрано к каждому уровню.
      // У записей до их появления поля нет — количество не растёт.
      scaling: z
        .array(z.object({ level: z.number(), count: z.number() }))
        .nullable()
        .catch(null),
      // Выбирать можно только то, чем персонаж ещё не владеет, и обратный
      // случай: владение превращает выбор в компетентность.
      onlyIfNotProficient: z.boolean().nullable().catch(null),
      // Обратный случай: выбирать можно только то, чем персонаж уже владеет
      // («Мастер оружия» — приём знакомого ему оружия).
      onlyIfProficient: z.boolean().nullable().catch(null),
      expertiseIfProficient: z.boolean().nullable().catch(null),
      // Допустимые значения выбора: коды словаря со снимком названия.
      options: z
        .array(
          z.object({
            value: z.string().catch(''),
            name: z.string().nullable().catch(null),
          }),
        )
        .nullable()
        .catch(null),
      // Категории черт у выбора черты; пусто — по правилу листа.
      featCategories: z.array(z.string()).nullable().catch(null),
      // Пул заклинаний собирается поиском по каталогу, поэтому листу нужны сами
      // ограничения, а не готовый список.
      spellFilter: z
        .object({
          level: z.coerce.number().nullable().catch(null),
          maxLevel: z.coerce.number().nullable().catch(null),
          classes: z
            .array(
              z.object({
                url: z.string().catch(''),
                name: z.string().catch(''),
              }),
            )
            .nullable()
            .catch(null),
          classesFromChoiceKey: z.string().nullable().catch(null),
        })
        .nullable()
        .catch(null),
    }),
  )
  .nullable()
  .catch(null);

/**
 * Ресурсы со счётчиком: максимум приходит формулой, потому что у большинства он
 * привязан к бонусу мастерства и растёт вместе с ним.
 */
const mechanicsCountersSchema = z
  .array(
    z.object({
      key: z.string().catch(''),
      name: z.string().catch(''),
      shortName: z.string().nullable().catch(null),
      max: z.string().nullable().catch(null),
      scaling: z
        .array(z.object({ level: z.number(), max: z.number() }))
        .nullable()
        .catch(null),
      // Нижняя граница максимума; у записей до неё поля нет
      min: z.number().nullable().catch(null),
      recovery: z.string().nullable().catch(null),
    }),
  )
  .nullable()
  .catch(null);

/**
 * Настройки выдачи заклинаний. Сами заклинания лист берёт из `grantedSpells`:
 * там они дополнены кругом и школой, а в механике лежат одними ссылками. Здесь
 * нужны подготовка — держит ли запись заклинание готовым — и характеристика, от
 * которой считаются все её заклинания.
 */
const mechanicsSpellGrantSchema = z
  .object({
    alwaysPrepared: z.boolean().catch(false),
    spellcastingAbility: z.string().nullable().catch(null),
  })
  .nullable()
  .catch(null);

/**
 * Механика записи справочника в той части, которую лист читает у вида: та же,
 * что у черты, — владения, выборы, постоянные модификаторы и счётчики ресурсов.
 */
const speciesMechanicsSchema = z
  .object({
    proficiencies: mechanicsProficienciesSchema,
    choices: mechanicsChoicesSchema,
    modifiers: featModifiersSchema,
    counters: mechanicsCountersSchema,
  })
  .nullable()
  .catch(null);

/** Схема особенности вида в детальном ответе. */
const speciesFeatureSchema = z.object({
  url: z.string().catch(''),
  name: z.object({ rus: z.string().catch('') }),
  description: descriptionNodesSchema,
  level: z.coerce.number().min(1).max(20).nullish().catch(null),
  mechanics: speciesMechanicsSchema,
  activeEffects: z.unknown().nullish(),
});

/**
 * Заклинание справочника там, где оно приходит вложенным в другой ответ:
 * врождённым заклинанием вида, выдаваемым заклинанием черты. Круг и школу лист
 * берёт только отсюда — без круга заклинание некуда положить.
 */
const catalogSpellSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  level: z.coerce.number().catch(0),
  school: z.string().catch(''),
  concentration: z.boolean().catch(false),
  ritual: z.boolean().catch(false),
});

/**
 * Заклинание справочника к записи листа.
 *
 * @param spell разобранное заклинание справочника.
 * @returns заклинание в форме листа.
 */
function toCharacterSpell(
  spell: z.infer<typeof catalogSpellSchema>,
): CharacterSpell {
  return {
    url: spell.url,
    name: spell.name.rus,
    level: spell.level,
    school: spell.school,
    concentration: spell.concentration,
    ritual: spell.ritual,
  };
}

const speciesInnateSpellSchema = z.object({
  spell: catalogSpellSchema,
  requiredLevel: z.coerce.number().min(1).max(20).catch(1),
});

/**
 * Выдаваемое чертой заклинание: запись справочника и уровень, с которого оно
 * доступно. Форма та же, что у врождённых заклинаний вида, но уровень здесь
 * необязателен — пустой читается как «с момента взятия черты», и так же
 * читаются черты, сохранённые до появления поля.
 */
const featGrantedSpellSchema = z.union([
  z.object({
    spell: catalogSpellSchema,
    requiredLevel: z.coerce.number().min(1).max(20).nullish().catch(null),
  }),
  // Ответ до появления уровней: заклинание лежало в списке без обёртки. Разбор
  // держит обе формы, потому что фронт и бэк выкатываются порознь: без этого
  // сайт со свежим разбором и ещё не обновлённым бэком молча перестал бы
  // выдавать заклинания черт — весь список отбросил бы `.catch(null)` ниже.
  catalogSpellSchema.transform((spell) => ({ spell, requiredLevel: null })),
]);

/**
 * Список заклинаний, который черта добавляет персонажу, — строка таблицы
 * «Заклинания метки». Списков несколько, и каждый открывается на своём уровне:
 * у метки дракона первая пачка приходит сразу, следующая — на втором уровне.
 */
const featSpellListGroupSchema = z.object({
  requiredLevel: z.coerce.number().min(1).max(20).nullish().catch(null),

  // Формула количества: заполнена — из списка берут не всё, и лист обязан
  // спросить игрока. Такого выбора он пока не умеет, поэтому такие списки
  // пропускает (см. `toFeatSpellListSpells`).
  count: z.string().nullish().catch(null),

  spells: z.array(catalogSpellSchema).catch([]),
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
      darkVision: z.coerce.number().nullish().catch(null),
      vision: z.coerce.number().nullish().catch(null),
    })
    .catch({ size: '', speed: '', darkVision: null, vision: null }),
  features: z.array(speciesFeatureSchema).catch([]),
  innateSpells: z.array(speciesInnateSpellSchema).catch([]),
  mechanics: speciesMechanicsSchema,
  activeEffects: z.unknown().nullish(),
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
    level: feature.level ?? null,
    proficiencies: feature.mechanics?.proficiencies
      ? toGrantedProficiencies(feature.mechanics.proficiencies)
      : null,
    choices: toMechanicChoices(
      feature.mechanics?.choices ?? [],
      `${getCharacterFeatureId('species', detail.url)}:${feature.url}`,
    ),
    // Модификаторы и счётчики — той же моделью, что у черты: лист применяет их
    // одинаково, откуда бы они ни пришли
    modifiers: feature.mechanics?.modifiers ?? null,
    counters: toMechanicCounters(feature.mechanics?.counters ?? []),
    // Эффекты разбирает общая схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет всё умение
    activeEffects: normalizeLoadedActiveEffects(feature.activeEffects),
  }));

  const innateSpells: CharacterInnateSpell[] = detail.innateSpells.map(
    (innateSpell) => ({
      spell: toCharacterSpell(innateSpell.spell),
      requiredLevel: innateSpell.requiredLevel,
    }),
  );

  return {
    url: detail.url,
    name: detail.name.rus,
    hasLineages: detail.hasLineages,
    sizeText: detail.properties.size,
    speedText: detail.properties.speed,
    darkVision: detail.properties.darkVision ?? null,
    vision: detail.properties.vision ?? null,
    features,
    innateSpells,
    proficiencies: detail.mechanics?.proficiencies
      ? toGrantedProficiencies(detail.mechanics.proficiencies)
      : null,
    choices: toMechanicChoices(
      detail.mechanics?.choices ?? [],
      getCharacterFeatureId('species', detail.url),
    ),
    modifiers: detail.mechanics?.modifiers ?? null,
    counters: toMechanicCounters(detail.mechanics?.counters ?? []),
    activeEffects: normalizeLoadedActiveEffects(detail.activeEffects),
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
  // Своя характеристика заклинания: справочник задаёт её только там, где она не
  // зависит от заклинателя. Нет — лист считает заклинание от класса.
  spellcastingAbility: z.string().nullable().catch(null),
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
    // Характеристика справочника — начальное значение записи: дальше игрок
    // правит её у себя на листе, и каталог ему больше не указ.
    spellcastingAbility:
      parseApiAbilityKey(spell.spellcastingAbility ?? '') ?? undefined,
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
  // Эффекты разбирает своя схема раздела — здесь они `unknown`. Ключ
  // необязателен: без эффектов справочник его не отдаёт вовсе, а `unknown`
  // в объекте Zod 4 обязателен — запись без эффектов не проходила бы разбор
  activeEffects: z.unknown().optional(),
  mechanics: z
    .object({
      modifiers: featModifiersSchema,
      // Варианты повышения характеристик: несколько записей — это выбор «или».
      abilityBonuses: z
        .array(
          z.object({
            abilities: z.array(z.string()).nullable().catch(null),
            bonus: z.coerce.number().nullable().catch(null),
            upto: z.coerce.number().nullable().catch(null),
            count: z.coerce.number().nullable().catch(null),
          }),
        )
        .nullable()
        .catch(null),
      // Владения приходят категориями справочника — лист хранит их записями
      // «вся группа», поэтому разбор ниже их переводит.
      proficiencies: mechanicsProficienciesSchema,
      spells: mechanicsSpellGrantSchema,
      counters: mechanicsCountersSchema,
      choices: mechanicsChoicesSchema,
    })
    .nullable()
    .catch(null),
  grantedSpells: z.array(featGrantedSpellSchema).nullable().catch(null),
  // Таблица «Заклинания метки» с данными справочника: в механике списки лежат
  // одними ссылками, а листу нужен круг — без него заклинание некуда положить.
  spellListGroups: z.array(featSpellListGroupSchema).nullable().catch(null),
});

/** Ответ справочника с владениями записи, как его разбирает общая схема. */
type FeatProficienciesResponse = NonNullable<
  z.infer<typeof mechanicsProficienciesSchema>
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

  // Незнакомый язык отбрасывается по той же причине, что и навык: списки
  // справочника и листа сошлись, значит чужое значение — опечатка в данных.
  const languages = uniq(
    (proficiencies.languages ?? []).flatMap((language) => {
      const name = LANGUAGE_NAME_BY_API_KEY[language];

      return name ? [name] : [];
    }),
  );

  if (
    !weapons.length
    && !armor.length
    && !tools.length
    && !skills.length
    && !languages.length
  ) {
    return null;
  }

  return {
    armor,
    weapons,
    tools,
    languages,
    skills,
    // Компетентность без выбора черты не выдают: она приходит выбором игрока.
    expertiseSkills: [],
    weaponMasteries: [],
    savingThrows: [],
  };
}

/** Варианты повышения характеристик, как их разбирает схема детали. */
type FeatAbilityBonusesResponse = NonNullable<
  NonNullable<z.infer<typeof featDetailSchema>['mechanics']>['abilityBonuses']
>;

/**
 * Варианты повышения характеристик черты. Вариант без характеристик или без
 * размера прибавки отбрасывается: поднимать по нему нечего.
 *
 * @param bonuses варианты из механики черты.
 * @returns варианты в форме листа.
 */
function toFeatAbilityBonuses(
  bonuses: FeatAbilityBonusesResponse,
): FeatAbilityBonusOption[] {
  return bonuses.flatMap((bonus) => {
    const abilities = (bonus.abilities ?? []).flatMap((ability) => {
      const key = parseApiAbilityKey(ability);

      return key ? [key] : [];
    });

    const amount = bonus.bonus ?? 0;

    if (!abilities.length || amount <= 0) {
      return [];
    }

    return [
      {
        abilities,
        bonus: amount,
        // Потолок по умолчанию — предел прибавок по правилам 2024: у записей
        // справочника он проставлен, но мог остаться пустым у заведённых вручную.
        upto: bonus.upto ?? ABILITY_IMPROVEMENT_SCORE_MAX,
        // Пул из одной характеристики выбора не требует, поэтому и количество
        // по умолчанию равно одному.
        count: Math.max(1, bonus.count ?? 1),
      },
    ];
  });
}

/**
 * Выборы повышения характеристик: вариант спрашивает игрока, только если
 * поднять можно не весь пул («+1 к Силе или Ловкости»). Пул ровно по размеру
 * выбора применяется сам и вопросом не становится.
 *
 * Несколько вариантов — это «или», поэтому впереди встаёт ещё один выбор: каким
 * из них воспользоваться. Он же прячет чужие пикеры (см. `getVisibleFeatChoices`).
 *
 * @param bonuses варианты повышения характеристик.
 * @param featUrl url черты (идёт в устойчивый id выбора).
 * @returns выборы для пикеров листа.
 */
function toFeatAbilityChoices(
  bonuses: FeatAbilityBonusOption[],
  featUrl: string,
): ClassChoice[] {
  const featureId = getCharacterFeatureId('feat', featUrl);

  const asked = bonuses.flatMap<ClassChoice>((bonus, variantIndex) =>
    bonus.abilities.length > bonus.count
      ? [
          {
            id: `${featureId}:${ABILITY_CHOICE_ID_SEGMENT}-${variantIndex}`,
            kind: 'ability-score',
            label: getAbilityBonusLabel(bonus),
            count: bonus.count,
            listed: bonus.abilities.map((key) => ABILITY_LABELS[key]),
            abilityBonus: {
              variantIndex,
              bonus: bonus.bonus,
              upto: bonus.upto,
            },
          },
        ]
      : [],
  );

  if (bonuses.length < 2) {
    return asked;
  }

  return [
    {
      id: `${featureId}:${ABILITY_VARIANT_CHOICE_ID_SEGMENT}`,
      kind: 'ability-variant',
      label: SHEET_FEAT_MODAL_LABELS.abilityVariantLabel,
      count: 1,
      listed: bonuses.map((bonus) => getAbilityBonusLabel(bonus)),
    },
    ...asked,
  ];
}

/** Выборы черты, как их разбирает схема детали. */
type FeatChoicesResponse = NonNullable<
  NonNullable<z.infer<typeof featDetailSchema>['mechanics']>['choices']
>;

/**
 * Выборы записи справочника, которые лист умеет применить, — в виде своих
 * выборов листа.
 *
 * Это компетентность в навыке (пул резолвится по уже имеющимся владениям),
 * заклинательная характеристика (пул перечислен в самой механике), заклинание
 * либо заговор (пул собирается поиском по каталогу), тип урона, к которому
 * запись даёт защиту, владение спасброском и оружейный приём. Остальные виды
 * выбора лист не применяет, поэтому и не спрашивает — иначе игрок отвечал бы в
 * пустоту.
 *
 * Один разбор на всех, кто спрашивает: черту, предысторию, вид и умение класса.
 * Модель выбора у них общая (`MechanicChoice` в core-api), и вторая копия этого
 * разбора разошлась бы с первой при первой же правке словаря.
 *
 * @param choices выборы из механики записи.
 * @param ownerId идентификатор владельца даров — им начинается устойчивый id
 *   выбора, поэтому одноимённые ключи разных записей не схлопываются.
 * @returns выборы для пикеров листа.
 */
function toMechanicChoices(
  choices: FeatChoicesResponse,
  ownerId: string,
): ClassChoice[] {
  // Уровень открытия проставляется здесь, а не в каждой ветке разбора: он
  // одинаков для любого вида выбора, и повтор в двенадцати местах разошёлся бы
  // с собой при первой же правке
  return choices.flatMap<ClassChoice>((choice) =>
    toChoiceSteps(choice).flatMap((step) =>
      buildMechanicChoices(
        { ...choice, count: step.count, requiredLevel: step.level },
        ownerId,
      ).map((entry) => ({ ...entry, requiredLevel: step.level })),
    ),
  );
}

/**
 * Выбор по ступеням роста: на каждый уровень — свой вопрос и своя ПРИБАВКА.
 *
 * Ступень называет, сколько всего выбрано к её уровню, а спрашивать нужно
 * разницу с предыдущей: оружейных приёмов у воина три с первого уровня и четыре
 * с четвёртого, то есть на четвёртом игрок выбирает один новый, а не четыре
 * заново. Уровень уходит в идентификатор выбора, поэтому ответы разных уровней
 * не склеиваются.
 *
 * Без ступеней шаг один — сам выбор, как он и был до их появления.
 *
 * @param choice выбор из механики записи.
 * @returns шаги выбора: уровень и сколько на нём выбирают.
 */
function toChoiceSteps(
  choice: FeatChoicesResponse[number],
): Array<{ level: number | null; count: number | null }> {
  const steps = (choice.scaling ?? [])
    .filter((step) => step.level > 0 && step.count > 0)
    .sort((left, right) => left.level - right.level);

  if (!steps.length) {
    return [
      { level: choice.requiredLevel ?? null, count: choice.count ?? null },
    ];
  }

  const result: Array<{ level: number | null; count: number | null }> = [];

  let previous = 0;

  for (const step of steps) {
    const added = step.count - previous;

    previous = step.count;

    // Ступень, не добавившая ничего, вопросом не становится: у неё нечего
    // выбирать, а шаг мастера повышения уровня был бы пустым
    if (added > 0) {
      result.push({ level: step.level, count: added });
    }
  }

  return result;
}

/**
 * Разбор одного выбора механики в выбор листа.
 *
 * @param source выбор из механики записи.
 * @param ownerId идентификатор владельца даров.
 * @returns выборы листа; пусто — вид выбора лист не спрашивает.
 */
function buildMechanicChoices(
  source: FeatChoicesResponse[number],
  ownerId: string,
): ClassChoice[] {
  return [source].flatMap<ClassChoice>((choice) => {
    const requiredLevel = choice.requiredLevel ?? null;

    // Уровень идёт в идентификатор: у компетентности плута первого и шестого
    // уровня один ключ в механике, и общий id склеил бы два ответа в один
    const id = requiredLevel
      ? `${ownerId}:${choice.key}:${requiredLevel}`
      : `${ownerId}:${choice.key}`;

    const count = Math.max(1, choice.count ?? 1);
    const label = choice.label?.trim() ?? '';

    if (choice.type === 'SPELLCASTING_ABILITY') {
      // Пул — характеристики, перечисленные в механике («Интеллект, Мудрость
      // или Харизма» у «Посвящённого в магию»). Не перечислены — выбирать можно
      // любую: запрета в правилах нет, а пустой список сделал бы шаг непроходимым.
      const listed = (choice.options ?? []).flatMap((option) => {
        const key = parseApiAbilityKey(option.value);

        return key ? [ABILITY_LABELS[key]] : [];
      });

      return [
        {
          id,
          kind: 'spellcasting-ability',
          label:
            label || SHEET_FEAT_CHOICE_LABELS['spellcasting-ability'] || '',
          count,
          listed: listed.length
            ? listed
            : ABILITY_ORDER.map((key) => ABILITY_LABELS[key]),
        },
      ];
    }

    if (choice.type === 'SPELL' || choice.type === 'CANTRIP') {
      return [
        {
          id,
          kind: 'spell',
          label: label || SHEET_FEAT_CHOICE_LABELS.spell || '',
          count,
          // Пул приходит поиском по каталогу, а не списком из справочника.
          listed: [],
          spellFilter: {
            // Заговор — это заклинание нулевого круга. У выбора с устаревшим
            // типом CANTRIP круга в фильтре может не быть вовсе, и тогда его
            // задаёт сам тип.
            level:
              choice.spellFilter?.level
              ?? (choice.type === 'CANTRIP' ? CANTRIP_SPELL_LEVEL : null),
            maxLevel: choice.spellFilter?.maxLevel ?? null,
            classes: (choice.spellFilter?.classes ?? []).filter(
              (characterClass) => !!characterClass.url,
            ),
            classesFromChoiceKey:
              choice.spellFilter?.classesFromChoiceKey ?? '',
          },
        },
      ];
    }

    if (choice.type === 'SPELL_LIST') {
      // Пул — классы, перечисленные в самом выборе: по ответу сужается пул
      // заклинаний того выбора, который на него ссылается. Подпись берётся из
      // снимка названия, а без него остаётся ссылка — иначе выбор был бы пуст.
      const options = (choice.options ?? []).flatMap((option) =>
        option.value
          ? [{ value: option.value, name: option.name || option.value }]
          : [],
      );

      return [
        {
          id,
          kind: 'spell-list',
          label: label || SHEET_FEAT_CHOICE_LABELS['spell-list'] || '',
          // Список всегда один: ответ на него сужает пул заклинаний до одного
          // класса, а два ответа дали бы объединение списков, которого в
          // правилах нет — и `getChoiceSpellClassUrls` читает только первый.
          // Поэтому количество из механики здесь не в счёт
          count: 1,
          listed: options.map((option) => option.name),
          optionValues: Object.fromEntries(
            options.map((option) => [option.name, option.value]),
          ),
        },
      ];
    }

    if (choice.type === 'OPTION') {
      // Пул своего справочника не имеет: варианты перечисляет сама запись —
      // благословение великана у голиафа, божественный порядок у жреца. Подпись
      // берётся из снимка названия, а без него остаётся значение: пустой пул
      // сделал бы шаг непроходимым.
      const options = (choice.options ?? []).flatMap((option) =>
        option.value
          ? [{ value: option.value, name: option.name || option.value }]
          : [],
      );

      return [
        {
          id,
          kind: 'option',
          label: label || SHEET_FEAT_CHOICE_LABELS.option || '',
          count,
          listed: options.map((option) => option.name),
          optionValues: Object.fromEntries(
            options.map((option) => [option.name, option.value]),
          ),
        },
      ];
    }

    if (choice.type === 'DAMAGE_TYPE') {
      // Пул — типы урона, перечисленные в механике («дробящий или рубящий» у
      // «Закалённой кожи»). Не перечислены — выбирать можно любой: так у «Дара
      // устойчивости к энергиям», и пустой список сделал бы шаг непроходимым.
      const listed = (choice.options ?? []).flatMap((option) => {
        const name = DAMAGE_TYPE_LABELS[option.value];

        return name ? [name] : [];
      });

      return [
        {
          id,
          kind: 'damage-type',
          label: label || SHEET_FEAT_CHOICE_LABELS['damage-type'] || '',
          count,
          listed: listed.length ? listed : DAMAGE_TYPE_NAMES,
        },
      ];
    }

    if (choice.type === 'TOOL') {
      return [
        {
          id,
          kind: 'tool',
          label,
          count,
          // Пул инструментов приходит каталогом сайта: в механике перечислены
          // только те случаи, где выбор сужен до нескольких предметов.
          listed: (choice.options ?? []).flatMap((option) =>
            option.name ? [option.name] : [],
          ),
          excludeOwned: choice.onlyIfNotProficient ?? false,
        },
      ];
    }

    if (choice.type === 'LANGUAGE') {
      return [
        {
          id,
          kind: 'language',
          label,
          count,
          // Языки перечисляются кодами словаря; пусто — выбор из всех языков.
          listed: (choice.options ?? []).flatMap((option) => {
            const name = LANGUAGE_NAME_BY_API_KEY[option.value];

            return name ? [name] : [];
          }),
          excludeOwned: choice.onlyIfNotProficient ?? false,
        },
      ];
    }

    if (choice.type === 'SAVING_THROW') {
      // Пул — характеристики, перечисленные в механике; не перечислены —
      // выбирать можно любую. Обе черты («Устойчивый», «Здоровяк») просят ту,
      // спасброском которой персонаж не владеет, — этим пул и сужается.
      const listed = (choice.options ?? []).flatMap((option) => {
        const key = parseApiAbilityKey(option.value);

        return key ? [ABILITY_LABELS[key]] : [];
      });

      return [
        {
          id,
          kind: 'saving-throw',
          label: label || SHEET_FEAT_CHOICE_LABELS['saving-throw'] || '',
          count,
          listed: listed.length
            ? listed
            : ABILITY_ORDER.map((key) => ABILITY_LABELS[key]),
          excludeOwned: choice.onlyIfNotProficient ?? false,
        },
      ];
    }

    if (choice.type === 'WEAPON_MASTERY') {
      // Пул — виды оружия каталога: их собирает пикер листа по владениям
      // персонажа, потому что приём даётся только тому оружию, которым он
      // владеет. В механике перечислены лишь сужения до конкретных видов.
      return [
        {
          id,
          kind: 'weapon-mastery',
          label: label || SHEET_FEAT_CHOICE_LABELS['weapon-mastery'] || '',
          count,
          listed: (choice.options ?? []).flatMap((option) =>
            option.name ? [option.name] : [],
          ),
          onlyOwnedWeapons: choice.onlyIfProficient ?? false,
        },
      ];
    }

    if (choice.type === 'FEAT') {
      // Пул — каталог черт: категории и перечисленные url только сужают его,
      // а сами черты пикер берёт из `/feats/select`
      return [
        {
          id,
          kind: 'feat',
          label: label || SHEET_FEAT_CHOICE_LABELS.feat || '',
          count,
          listed: (choice.options ?? []).flatMap((option) =>
            option.value ? [option.value] : [],
          ),
          featCategories: choice.featCategories ?? [],
        },
      ];
    }

    if (choice.type !== 'SKILL') {
      return [];
    }

    if (choice.grants === 'EXPERTISE') {
      return [
        {
          id,
          kind: 'skill-expertise',
          label,
          count,
          // Пул компетентности резолвится владениями листа, а не списком из
          // справочника: выбирать можно только то, чем персонаж уже владеет.
          listed: [],
        },
      ];
    }

    return [
      {
        id,
        kind: 'skill-proficiency',
        label,
        count,
        // Пул навыков перечисляется кодами словаря; пусто — выбор из всех.
        listed: (choice.options ?? []).flatMap((option) => {
          const name = SKILL_NAME_BY_API_KEY[option.value];

          return name ? [name] : [];
        }),
        excludeOwned: choice.onlyIfNotProficient ?? false,
        // «Наблюдательный»: навык, которым персонаж уже владеет, даёт
        // компетентность вместо второго владения.
        expertiseIfProficient: choice.expertiseIfProficient ?? false,
      },
    ];
  });
}

/**
 * Выбор класса для черт, у которых его в записи нет.
 *
 * Выбор заклинания перечисляет несколько классов — «Посвящённый в магию» назвал
 * жреца, друида и волшебника, — но по правилам список ОДИН, а не объединение
 * трёх. Записи, сделанные до того, как форма стала заводить вопрос про класс
 * сама, такого выбора не содержат, и пул у них собирался из всех классов сразу.
 * Лист спрашивает класс и по ним.
 *
 * @param choices выборы записи.
 * @param ownerId идентификатор владельца даров (идёт в устойчивый id выбора).
 * @returns выборы вместе с вопросом про класс; без нескольких классов — как есть.
 */
function withSpellClassChoice(
  choices: ClassChoice[],
  ownerId: string,
): ClassChoice[] {
  // Вопрос уже есть — второй не нужен: на него и ссылаются выборы заклинаний.
  if (choices.some((choice) => choice.kind === 'spell-list')) {
    return choices;
  }

  const unlinked = choices.filter(
    (choice) =>
      choice.kind === 'spell'
      && !choice.spellFilter?.classesFromChoiceKey
      && (choice.spellFilter?.classes.length ?? 0) > 1,
  );

  const [first] = unlinked;

  if (!first?.spellFilter) {
    return choices;
  }

  const options = first.spellFilter.classes.map((characterClass) => ({
    // Снимка названия у ссылки может не быть — тогда подписью служит она сама;
    // название подставит `withSpellListClassNames` по каталогу классов.
    name: characterClass.name || characterClass.url,
    value: characterClass.url,
  }));

  const classChoice: ClassChoice = {
    id: `${ownerId}:${FEAT_SPELL_CLASS_CHOICE_KEY}`,
    kind: 'spell-list',
    label: SHEET_FEAT_CHOICE_LABELS['spell-list'] ?? '',
    count: 1,
    listed: options.map((option) => option.name),
    optionValues: Object.fromEntries(
      options.map((option) => [option.name, option.value]),
    ),
  };

  const linked = new Set(unlinked.map((choice) => choice.id));

  return [
    classChoice,
    ...choices.map((choice) =>
      linked.has(choice.id) && choice.spellFilter
        ? {
            ...choice,
            spellFilter: {
              ...choice.spellFilter,
              classesFromChoiceKey: FEAT_SPELL_CLASS_CHOICE_KEY,
            },
          }
        : choice,
    ),
  ];
}

/**
 * Заклинания списков черты записями листа.
 *
 * Это не выдача: заклинание списка персонаж знает наравне с классовыми, но
 * готовит его сам — поэтому запись приходит неподготовленной, каким бы ни был
 * `alwaysPrepared` у выданных заклинаний той же черты.
 *
 * Уровень доступа списка едет на каждой записи: отбор идёт при показе
 * (см. `getAvailableInnateSpells`), и книга пополняется сама, когда персонаж
 * дорастёт до следующего списка.
 *
 * @param groups списки заклинаний из детали черты.
 * @returns заклинания открытых списков; пусто — черта списков не даёт.
 */
function toFeatSpellListSpells(
  groups: Array<z.infer<typeof featSpellListGroupSchema>>,
): CharacterSpell[] {
  // Список с количеством игрок набирает сам («два заклинания из пяти»), а такого
  // выбора лист пока не спрашивает: выдать вместо него весь список значило бы
  // дать персонажу лишнее.
  const wholeLists = groups.filter((group) => !group.count);

  return wholeLists.flatMap((group) =>
    group.spells.map((spell) => ({
      ...toCharacterSpell(spell),
      prepared: false,
      requiredLevel: group.requiredLevel ?? undefined,
    })),
  );
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
  const granted = result.data.grantedSpells ?? [];

  // Черта либо держит заклинание подготовленным («вы всегда можете накладывать
  // его»), либо оставляет подготовку игроку: тогда квадрат подготовки гаснет, и
  // игрок ставит пометку сам, как у врождённого заклинания вида.
  const prepared = result.data.mechanics?.spells?.alwaysPrepared ?? false;

  // Характеристика заклинаний черты, заданная жёстко. Выбор из нескольких
  // приезжает отдельным выбором и проставляется уже по ответу игрока
  // (см. `getFeatSpellcastingAbility`).
  const spellcastingAbility = parseApiAbilityKey(
    result.data.mechanics?.spells?.spellcastingAbility ?? '',
  );

  const choices = result.data.mechanics?.choices;

  // Владелец даров: с него начинается id каждого выбора, чтобы одноимённые
  // ключи разных записей не схлопнулись в один вопрос
  const featOwnerId = getCharacterFeatureId('feat', result.data.url);

  const spellListSpells = toFeatSpellListSpells(
    result.data.spellListGroups ?? [],
  );

  const abilityBonuses = toFeatAbilityBonuses(
    result.data.mechanics?.abilityBonuses ?? [],
  );

  return {
    url: result.data.url,
    name: result.data.name.rus,
    category: result.data.category,
    description: result.data.description,
    modifiers: result.data.mechanics?.modifiers ?? null,
    activeEffects: normalizeLoadedActiveEffects(result.data.activeEffects),
    proficiencies: proficiencies ? toGrantedProficiencies(proficiencies) : null,
    // Уровень доступа едет вместе с записью: заклинание с ним попадёт на лист
    // только когда персонаж дорастёт (см. `getAvailableInnateSpells`)
    spells: granted.length
      ? granted.map((entry) => ({
          ...toCharacterSpell(entry.spell),
          prepared,
          requiredLevel: entry.requiredLevel ?? undefined,
        }))
      : null,
    spellListSpells: spellListSpells.length ? spellListSpells : null,
    spellcastingAbility,
    // Повышение характеристик спрашивается первым: остальные выборы черты идут
    // после того, как игрок решил, что она поднимает.
    choices: [
      ...toFeatAbilityChoices(abilityBonuses, result.data.url),
      ...withSpellClassChoice(
        choices ? toMechanicChoices(choices, featOwnerId) : [],
        featOwnerId,
      ),
    ],
    abilityBonuses,
    counters: toMechanicCounters(result.data.mechanics?.counters ?? []),
  };
}

/** Ресурсы записи справочника, как их отдаёт механика. */
type FeatCountersResponse = NonNullable<
  z.infer<typeof mechanicsCountersSchema>
>;

/**
 * Ресурсы из механики записи: запись без ключа или без названия пропускается —
 * по ключу лист хранит потраченное, а без названия ресурс нечем подписать.
 *
 * Вид отдыха приводится к виду листа; неизвестное значение читается как
 * продолжительный отдых — так восстанавливается большинство ресурсов.
 *
 * Один разбор на черту и на умение класса: блок в core-api у них общий.
 *
 * @param counters ресурсы из механики записи.
 * @returns ресурсы в виде листа.
 */
function toMechanicCounters(counters: FeatCountersResponse): FeatCounter[] {
  return counters.flatMap<FeatCounter>((counter) => {
    if (!counter.key || !counter.name) {
      return [];
    }

    return [
      {
        key: counter.key,
        name: counter.name,
        shortName: counter.shortName ?? '',
        max: counter.max ?? '',
        // Ступени приходят как есть: порядок задаёт справочник, а выбор нужной
        // делает лист по уровню персонажа
        scaling: counter.scaling ?? [],
        // Отрицательная граница ничего не описывает: ресурса меньше чем на ноль
        // зарядов не бывает
        min: Math.max(0, counter.min ?? 0),
        recovery: toCounterRecovery(counter.recovery),
      },
    ];
  });
}

/**
 * Вид отката ресурса из механики справочника в вид листа.
 *
 * Неизвестное значение читается как продолжительный отдых — так
 * восстанавливается большинство ресурсов.
 *
 * @param recovery откат из ответа справочника.
 * @returns вид отката ресурса на листе.
 */
function toCounterRecovery(recovery: string | null): CounterRecovery {
  if (recovery === API_SHORT_REST_RECOVERY) {
    return 'short-rest';
  }

  return recovery === API_SHORT_REST_ONE_RECOVERY
    ? 'short-rest-one'
    : 'long-rest';
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
    // Дополнительный урон магии; части урона разбирает общая схема редактора.
    damageParts: z.unknown().optional(),
    // Механика влияния на лист; записи до её появления приходят без блока.
    mechanics: z
      .object({
        activation: z.string().nullable().catch(null),
        passive: z.string().nullable().catch(null),
        resource: z
          .object({
            maxCharges: z.coerce.number().nullable().catch(null),
            recharge: z.string().nullable().catch(null),
            rechargeEvent: z
              .enum(['DAWN', 'SHORT_REST', 'LONG_REST'])
              .nullable()
              .catch(null),
            cost: z.coerce.number().nullable().catch(null),
          })
          .nullable()
          .catch(null),
        // Активные эффекты разбирает своя схема раздела — здесь они `unknown`;
        // без эффектов ключа в ответе нет
        activeEffects: z.unknown().optional(),
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
    damageParts: undefined,
    mechanics: null,
  });

/**
 * Условие применения раздела → случай листа. Носить при себе достаточно
 * («CARRIED»), включаемым предметам нужен переключатель, всему остальному —
 * надеть: так лист вёл себя и до появления условия.
 */
const MAGIC_ITEM_BONUS_ACTIVATION: Record<string, InventoryBonusActivation> = {
  CARRIED: 'carried',
  CONSUMED: 'manual',
  MANUAL: 'manual',
};

/**
 * Дополнительный урон магии из её частей. Берём первую часть с разбираемой
 * формулой: `InventoryExtraDamage` листа — один бросок своего типа, и вторая
 * такая же строка ему негде показать.
 *
 * @param raw части урона из «сырого» ответа.
 * @returns дополнительный урон; null — частей нет или формула сложнее костей.
 */
function toMagicItemExtraDamage(raw: unknown): InventoryExtraDamage | null {
  for (const part of parseLoadedDamageFormulaParts(raw)) {
    const dice = parseDamageFormulaDice(part.formula);

    if (dice && dice.diceCount > 0) {
      return {
        diceCount: dice.diceCount,
        diceFaces: dice.diceFaces,
        type: dice.type,
      };
    }
  }

  return null;
}

/**
 * Правило восстановления зарядов предмета.
 *
 * @param resource блок зарядов из «сырого» ответа.
 * @param maxCharges максимум зарядов; 0 — зарядов нет.
 * @returns правило восстановления; null — зарядов нет.
 */
function toMagicItemChargesRecovery(
  resource: {
    recharge: string | null;
    rechargeEvent: InventoryChargesEvent | null;
    cost: number | null;
  } | null,
  maxCharges: number,
): InventoryChargesRecovery | null {
  if (maxCharges <= 0) {
    return null;
  }

  return {
    event: resource?.rechargeEvent ?? null,
    formula: resource?.recharge?.trim() ?? '',
    cost: Math.max(0, Math.trunc(resource?.cost ?? 0)),
  };
}

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

  const normalizedCharges = Math.max(0, Math.trunc(maxCharges));

  return {
    rarity: parsed.rarity?.type ?? 'UNKNOWN',
    baseItemUrls: parsed.items,
    bonuses: parsed.bonuses ?? EMPTY_MAGIC_ITEM_BONUSES,
    requiresAttunement: parsed.attunement?.requires ?? false,
    maxCharges: normalizedCharges,
    activeEffects: normalizeLoadedActiveEffects(
      parsed.mechanics?.activeEffects,
    ),
    bonusActivation:
      MAGIC_ITEM_BONUS_ACTIVATION[parsed.mechanics?.activation ?? '']
      ?? 'equipped',
    passive: parsed.mechanics?.passive?.trim() ?? '',
    chargesRecovery: toMagicItemChargesRecovery(
      parsed.mechanics?.resource ?? null,
      normalizedCharges,
    ),
    extraDamage: toMagicItemExtraDamage(parsed.damageParts),
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
  // Эффекты разбирает своя схема раздела — здесь они `unknown`. Ключ
  // необязателен: без эффектов справочник его не отдаёт вовсе, а `unknown`
  // в объекте Zod 4 обязателен — запись без эффектов не проходила бы разбор
  activeEffects: z.unknown().optional(),
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
    activeEffects: normalizeLoadedActiveEffects(result.data.activeEffects),
  };
}

/** Правило Ловкости в «сыром» ответе доспеха. */
type ArmorRawDexterityMod = 'PLUS' | 'PLUS_MAX_2' | 'NONE';

/** Правила Ловкости из «сырого» ответа доспеха к внутреннему представлению. */
const ARMOR_DEXTERITY_MOD_MAP: Record<ArmorRawDexterityMod, ArmorDexterityMod> =
  {
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
 * Схема части урона оружия: формулы вокабуляра VTTG, которыми справочник
 * описывает урон после перехода на части.
 */
const itemRawDamagePartSchema = z.object({
  formula: z.string().catch(''),
  versatileFormula: z.string().nullable().catch(null),
});

/**
 * Схема «сырого» ответа предмета в части оружия (форма `WeaponCreate` редактора):
 * категория (простое/воинское, рукопашное/дальнобойное), свойства, боеприпас и
 * урон — частями-формулами и прежней связкой «кости + тип».
 */
const itemRawWeaponSchema = z
  .object({
    weapon: z
      .object({
        category: z.string().catch(''),
        properties: z.array(z.string()).catch([]),
        ammo: z.string().nullable().catch(null),
        damageParts: z.array(itemRawDamagePartSchema).nullable().catch(null),
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
 * Урон из части-формулы справочника. Формулу сложнее простых костей лист
 * посчитать не может (модификаторы и условия по цели считает виртуальный
 * стол) — такая часть даёт null, и разбор откатывается к прежней связке
 * «кости + тип».
 *
 * @param formula формула части урона.
 * @param fallbackType тип урона основной части — им подписывается урон
 *   двуручного хвата: тип у оружия один на оба хвата.
 * @returns урон оружия или null.
 */
function parseDamagePartFormula(
  formula: string | null | undefined,
  fallbackType = '',
): InventoryWeaponDamage | null {
  const dice = parseDamageFormulaDice(formula ?? undefined);

  if (!dice || dice.diceCount <= 0 || dice.diceFaces <= 0) {
    return null;
  }

  return {
    diceCount: dice.diceCount,
    diceFaces: dice.diceFaces,
    bonus: dice.bonus,
    type: dice.type || fallbackType,
  };
}

/**
 * Урон оружия из частей-формул: первая часть — основной урон и урон двуручного
 * хвата, вторая — дополнительный урон своего типа («2к6 огнём»).
 *
 * Части — источник истины справочника после перехода на формулы; прежняя связка
 * «кости + тип» остаётся у записей, сохранённых раньше, и у той, чью формулу в
 * кости не разложить.
 *
 * @param parts части урона из «сырого» ответа; null — их нет.
 * @returns урон, урон двуручного хвата и дополнительный урон; null — частей
 *   нет либо первая не раскладывается в кости.
 */
function parseWeaponDamageParts(
  parts: Array<z.infer<typeof itemRawDamagePartSchema>> | null,
): Pick<InventoryWeapon, 'damage' | 'versatileDamage' | 'extraDamage'> | null {
  const [firstPart, secondPart] = parts ?? [];
  const damage = parseDamagePartFormula(firstPart?.formula);

  if (!damage) {
    return null;
  }

  const extra = parseDamagePartFormula(secondPart?.formula);

  return {
    damage,
    versatileDamage: parseDamagePartFormula(
      firstPart?.versatileFormula,
      damage.type,
    ),
    // У дополнительного урона своего бонуса нет: плоскую надбавку предмет
    // даёт основным броском.
    extraDamage: extra
      ? {
          diceCount: extra.diceCount,
          diceFaces: extra.diceFaces,
          type: extra.type,
        }
      : null,
  };
}

/**
 * Разбор параметров оружия из «сырого» ответа предмета для подсчёта бонуса атаки.
 * Категория владения и признаки «дальнобойное»/«фехтовальное» распознаются по
 * категории/свойствам (RU- и EN-корни) — устойчиво к формату справочника на бэке.
 *
 * Урон берётся из частей-формул, а без них — из прежней связки «кости + тип»,
 * как у записей, сохранённых до перехода на формулы.
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

  const damageFromParts = parseWeaponDamageParts(weapon.damageParts);

  const legacyDamage = {
    damage,
    // Свойство «Универсальное» распознаём по самому броску, а не по строке в
    // `properties`: без второй кости переключать хват всё равно нечем.
    versatileDamage: parseWeaponVersatileDamage(weapon.versatile, damage),
    // Дополнительный урон прежняя связка выразить не могла: у неё один бросок.
    extraDamage: null,
  };

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
    ...(damageFromParts ?? legacyDamage),
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
  informationalOnly: z.boolean().catch(false),
  activeEffects: z.unknown().nullish(),
  mechanics: z
    .object({
      proficiencies: mechanicsProficienciesSchema,
      choices: mechanicsChoicesSchema,
      counters: mechanicsCountersSchema,
      spells: mechanicsSpellGrantSchema,
      // Черты без выбора — ссылками; деталь черты лист догружает сам
      feats: z
        .array(z.object({ url: z.string().catch('') }))
        .nullable()
        .catch(null),
    })
    .nullable()
    .catch(null),
  grantedSpells: z.array(featGrantedSpellSchema).nullable().catch(null),
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
  // Дары самой записи класса: листу из них нужны ресурсы — ярость и очки
  // чародейства заводят у класса целиком, а не у одного его умения.
  mechanics: z
    .object({
      counters: mechanicsCountersSchema,
    })
    .nullable()
    .catch(null),
  // Разбирается отдельной функцией: то же поле есть и у предыстории.
  startingEquipment: z.unknown().optional(),
  activeEffects: z.unknown().nullish(),
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
  const features: ClassFeatureSummary[] = detail.features.map((feature) => {
    const featureId = getClassFeatureId(detail.url, feature.key);

    const allChoices = withSpellClassChoice(
      toMechanicChoices(feature.mechanics?.choices ?? [], featureId),
      featureId,
    );

    // Выборы черты живут отдельно от остальных: их спрашивает пикер каталога
    // черт, а у умения с флагами прежних лет они собираются по флагам, когда
    // в механике выбора черты ещё нет
    const featChoices = getLegacyClassFeatChoices(
      featureId,
      allChoices.filter((choice) => choice.kind === 'feat'),
      {
        fightingStyleChoice: feature.fightingStyleChoice,
        // Флаг приходит с бэка; распознавание по названию и описанию остаётся
        // страховкой для записей, где он не проставлен
        abilityImprovement:
          feature.abilityImprovement
          || isAbilityImprovementFeature(feature.name, feature.description),
      },
    );

    return {
      key: feature.key,
      level: feature.level,
      name: feature.name,
      description: toDescriptionNodes(feature.description),
      isSubclass: feature.isSubclass,
      fightingStyleChoice: feature.fightingStyleChoice,
      // Умение даёт черту за повышение характеристик, если так сказано флагом,
      // описанием либо выбором общей черты в механике
      abilityImprovement: featChoices.some(isAbilityImprovementFeatChoice),
      skillChoice: feature.skillChoice,
      scalingLevels: (feature.scaling ?? [])
        .map((entry) => entry.level)
        .filter((entry) => entry > 0),
      informationalOnly: feature.informationalOnly,
      // Эффекты разбирает общая схема раздела: битый эффект отбрасывается
      // поштучно, а не роняет всё умение
      activeEffects: normalizeLoadedActiveEffects(feature.activeEffects),
      proficiencies: feature.mechanics?.proficiencies
        ? toGrantedProficiencies(feature.mechanics.proficiencies)
        : null,
      choices: allChoices.filter((choice) => choice.kind !== 'feat'),
      featChoices,
      grantedFeatUrls: (feature.mechanics?.feats ?? []).flatMap((feat) =>
        feat.url ? [feat.url] : [],
      ),
      counters: toMechanicCounters(feature.mechanics?.counters ?? []),
      // Умение либо держит заклинание подготовленным, либо оставляет подготовку
      // игроку — как черта
      spells: (feature.grantedSpells ?? []).length
        ? (feature.grantedSpells ?? []).map((entry) => ({
            ...toCharacterSpell(entry.spell),
            prepared: feature.mechanics?.spells?.alwaysPrepared ?? false,
            requiredLevel: entry.requiredLevel ?? undefined,
          }))
        : null,
      spellcastingAbility: parseApiAbilityKey(
        feature.mechanics?.spells?.spellcastingAbility ?? '',
      ),
    };
  });

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
    counters: toMechanicCounters(detail.mechanics?.counters ?? []),
    startingEquipment: toStartingEquipmentOptions(detail.startingEquipment),
    activeEffects: normalizeLoadedActiveEffects(detail.activeEffects),
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
  // Черта появилась в ответе поиска позже: у старых записей и у предысторий без
  // черты полей нет вовсе.
  featName: z.string().nullable().catch(null),
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
    featName: background.featName ?? '',
  }));
}

/** Ссылка на запись справочника в JSONB-полях предыстории. */
const backgroundRefSchema = z.object({
  url: z.string(),
  name: z.string().nullable().catch(null),
});

/** Схема детального ответа предыстории (нужные листу поля). */
const backgroundDetailSchema = z.object({
  url: z.string(),
  name: z.object({ rus: z.string().catch('') }),
  abilityScores: z.string().catch(''),
  skillProficiencies: z.string().catch(''),
  feat: z.string().catch(''),
  // Черты на выбор; у предысторий книги черта одна и лежит в `feat`.
  featChoices: z.array(backgroundRefSchema).catch([]),
  toolProficiency: z.array(z.string()).catch([]),
  // Владение инструментами ссылками — главнее текста: по ним лист находит
  // карточку каталога, не разбирая разметку.
  toolProficiencies: z.array(backgroundRefSchema).catch([]),
  toolChoice: z
    .object({
      count: z.number().nullable().catch(null),
      from: z.array(backgroundRefSchema).catch([]),
    })
    .nullable()
    .catch(null),
  // Справка приходит как описание раздела — строки-абзацы вперемешку с узлами
  // разметки (список вариантов «А)/Б)»), поэтому массивом строк не разбирается.
  equipment: descriptionNodesSchema,
  // Разбирается отдельной функцией: то же поле есть и у класса.
  startingEquipment: z.unknown().optional(),
});

/** Ссылки предыстории с непустой подписью — те, что лист может показать. */
interface BackgroundRef {
  url: string;
  name: string | null;
}

/**
 * Владения инструментами из ссылок мастерской.
 *
 * @param refs ссылки на карточки инструментов.
 * @returns владения с подписью и адресом карточки.
 */
function toToolProficiencies(
  refs: BackgroundRef[],
): CharacterToolProficiency[] {
  return refs
    .filter((reference) => reference.name)
    .map((reference) => ({ name: reference.name ?? '', url: reference.url }));
}

/**
 * Выбор инструмента, заданный структурой мастерской. Пустой пул означает выбор
 * из всего каталога — так предыстория и написана в книге («инструмент на ваш
 * выбор»).
 *
 * @param choice блок выбора из ответа.
 * @returns выбор для мастера; null — выбора у предыстории нет.
 */
function toBackgroundToolChoice(
  choice: { count: number | null; from: BackgroundRef[] } | null,
): ClassChoice | null {
  if (!choice?.count || choice.count < 1) {
    return null;
  }

  return {
    id: BACKGROUND_TOOL_CHOICE_ID,
    kind: 'tool',
    label: BACKGROUND_TOOL_CHOICE_LABEL,
    count: choice.count,
    listed: choice.from
      .filter((reference) => reference.name)
      .map((reference) => reference.name ?? ''),
  };
}

/**
 * Есть ли у предыстории собственные дары, ради которых заводить запись умения.
 *
 * @param grants дары, разобранные схемой черты.
 * @returns признак «есть что применять».
 */
function hasOwnBackgroundGrants(grants: FeatSummary): boolean {
  return Boolean(
    grants.proficiencies
    || grants.modifiers
    || grants.activeEffects.length
    || grants.spells?.length
    || grants.choices.length
    || grants.abilityBonuses.length
    || grants.counters.length,
  );
}

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

  const toolFixed: CharacterToolProficiency[] = toToolProficiencies(
    detail.toolProficiencies,
  );

  let toolChoice: ClassChoice | null = toBackgroundToolChoice(
    detail.toolChoice,
  );

  // Текст читается, только пока владение не задано ссылками: у переведённых
  // записей он остаётся прежней прозой и продублировал бы уже выданное.
  if (!toolFixed.length && !toolChoice) {
    for (const toolText of detail.toolProficiency) {
      // Владения приходят с разметкой каталога («{@item Воровские
      // инструменты|url:thieves-tools-phb}»): подпись идёт в лист, ссылка —
      // в кнопку описания инструмента.
      const tool = parseToolMarker(toolText);

      const choice = getClassToolChoice(tool.name, BACKGROUND_TOOL_CHOICE_ID);

      if (choice) {
        toolChoice = toolChoice ?? choice;
      } else if (tool.name) {
        toolFixed.push(tool);
      }
    }
  }

  const feat = parseFeatMarker(detail.feat);

  // Собственные дары предыстории разбираются схемой черты: модель у них общая,
  // и лист применяет их одинаково — записью умения со снимком владений.
  // Описание записи пустое: полный текст предыстории живёт на её странице, а в
  // умении он был бы простынёй на всю вкладку.
  const parsedGrants = parseFeatDetail(input);

  const ownGrants =
    parsedGrants && hasOwnBackgroundGrants(parsedGrants)
      ? { ...parsedGrants, description: [], category: '' }
      : null;

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
    featChoices: detail.featChoices
      .filter((reference) => reference.name)
      .map((reference) => ({
        url: reference.url,
        name: reference.name ?? '',
      })),
    ownGrants,
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
