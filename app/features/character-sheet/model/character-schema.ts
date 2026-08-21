import type {
  AbilityKey,
  Character,
  CharacterClass,
  CharacterCustomBonus,
  CharacterNote,
  CharacterSavingThrow,
  CharacterSheetDetail,
  CharacterSheetListItem,
  CharacterSheetListPage,
  CharacterSpellcasting,
  FeatureDescriptionNode,
  ResourceRecovery,
  ResourceRecoveryMode,
  ResourceRecoveryRule,
  SavedCharacterSheet,
  SavedCharacterSheetListPage,
} from './types';

import { clamp } from 'es-toolkit';

import { z } from '~/utils/zod';
import { CasterType } from '~classes/model';

import {
  CLASS_FEATURE_ID_PREFIX,
  CLASS_RESOURCE_ID_PREFIX,
  DRAFT_CHARACTER_ID,
  EXHAUSTION_LEVEL_MAX,
  EXHAUSTION_LEVEL_MIN,
  INVENTORY_QUANTITY_MAX,
  INVENTORY_QUANTITY_MIN,
  LEGACY_NOTE_ID,
  LEVEL_MAX,
  LEVEL_MIN,
  NEW_CUSTOM_BONUS,
  RESOURCE_MAX_DEFAULT_ABILITY,
  RESOURCE_RECOVERY_AMOUNT_MIN,
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

/**
 * Схема выданного стартового снаряжения. Листы, сохранённые до появления поля,
 * приходят без него: снимать при смене класса или предыстории нечего.
 */
const grantedStartingEquipmentSchema = z
  .object({
    items: z
      .array(
        z.object({
          id: z.string(),
          quantity: z.coerce.number().catch(0),
        }),
      )
      .catch([]),
    coins: z.coerce.number().catch(0),
    coinKey: z
      .enum(['copper', 'silver', 'electrum', 'gold', 'platinum'])
      .catch('gold'),
  })
  .nullable()
  .catch(null);

/** Прогрессия числа из колонки таблицы класса: подготовленные и заговоры. */
const classScalingSchema = z
  .array(
    z.object({
      level: z.coerce.number(),
      value: z.coerce.number(),
    }),
  )
  .catch([]);

const classEntrySchema = z.object({
  url: z.string(),
  name: z.string().catch(''),
  // Листы, сохранённые до мультикласса, уровня в классе не имеют: 0 — метка
  // «неизвестен», нормализация ниже выводит его из общего уровня персонажа.
  level: z.coerce.number().catch(0),
  subclassUrl: z.string().nullable().catch(null),
  subclassName: z.string().nullable().catch(null),
  // Листы, сохранённые до появления поля, приходят без типа заклинательства:
  // для них он определяется по названию класса (см. `getClassCasterType`).
  casterType: z.nativeEnum(CasterType).nullable().catch(null),
  hitDie: z.coerce.number().catch(8),
  // Листы до мультикласса хранили заклинательную характеристику одну на весь
  // лист (`spellcasting.ability`) — нормализация переносит её в основной класс.
  spellcastingAbility: abilityKeySchema.nullable().catch(null),
  // Листы, сохранённые до появления поля, приходят без прогрессии
  // подготовленных заклинаний: она запишется при следующем выборе класса
  // или повышении уровня. То же и с прогрессией заговоров.
  preparedSpells: classScalingSchema,
  preparedCantrips: classScalingSchema,
  startingEquipment: grantedStartingEquipmentSchema,
});

const characterClassSchema = classEntrySchema.nullable().catch(null);

// Битая запись выпадает поодиночке (null отфильтровывается нормализацией):
// один испорченный класс не должен уносить весь мультикласс.
const additionalClassesSchema = z
  .array(classEntrySchema.nullable().catch(null))
  .catch([]);

const characterBackgroundSchema = z
  .object({
    url: z.string(),
    name: z.string().catch(''),
    featUrl: z.string().nullable().catch(null),
    abilityBonuses: z
      .partialRecord(abilityKeySchema, z.coerce.number())
      .catch({}),
    startingEquipment: grantedStartingEquipmentSchema,
  })
  .nullable()
  .catch(null);

// Листы до появления ссылок на инструменты хранят владения строками: такая
// запись читается без ссылки, а url подставится при следующей правке владений.
const toolProficiencySchema = z.union([
  z.string().transform((name) => ({ name, url: null })),
  z.object({
    name: z.string().catch(''),
    url: z.string().nullable().catch(null),
  }),
]);

/**
 * Набор выданных владений. Отдельная схема на два случая: журнал выдач листа и
 * снимок владений на записи черты.
 */
const grantedProficienciesSchema = z.object({
  armor: z.array(z.string()).catch([]),
  weapons: z.array(z.string()).catch([]),
  tools: z.array(toolProficiencySchema).catch([]),
  languages: z.array(z.string()).catch([]),
  // Навыки появились в выдаче позже прочего: у записей без поля их просто нет.
  skills: z.array(z.string()).catch([]),
  // Компетентность — ещё позже, вместе с выбором игрока при взятии черты.
  expertiseSkills: z.array(z.string()).catch([]),
  // Мастерство оружием и спасброски пришли в выдачу последними: у записей без
  // полей их нет, и снятие источника их не тронет.
  weaponMasteries: z.array(z.string()).catch([]),
  savingThrows: z.array(abilityKeySchema).catch([]),
});

/**
 * Снимок ресурса черты в записи умения: максимум приходит формулой справочника
 * и разбирается при сборке панели, поэтому здесь он строкой.
 */
const featCounterSchema = z.object({
  key: z.string().catch(''),
  name: z.string().catch(''),
  shortName: z.string().catch(''),
  max: z.string().catch(''),
  recovery: z.enum(['short-rest', 'long-rest']).catch('long-rest'),
});

/**
 * Снимок владений, выдаваемых чертой, в записи умения.
 *
 * Схема только для документа листа — в отличие от механики, одной на оба
 * случая: справочник отдаёт владения категориями (`MATERIAL_MELEE`), а лист
 * хранит записями своего справочника («Всё воинское оружие»), и перевод между
 * ними делает разбор детали черты в `schemas.ts`.
 */
const featProficienciesSchema = grantedProficienciesSchema
  .nullable()
  .catch(null);

/** Необязательное число снимка механики: чужое значение просто пропадает. */
const modifierNumberSchema = z.coerce.number().optional().catch(undefined);

/** Необязательный флаг снимка механики. */
const modifierFlagSchema = z.boolean().optional().catch(undefined);

/** Необязательный список кодов словаря в снимке механики. */
const modifierCodesSchema = z.array(z.string()).optional().catch(undefined);

/**
 * Снимок `mechanics.modifiers` черты в записи умения листа. Зеркало
 * `featModifiersSchema` из `~feats/model`, но `catch` стоит на каждом уровне, а
 * не только снаружи: у сохранённых листов поля нет вовсе, а у записанных ранней
 * версией справочника часть блоков может не совпасть по форме — ни то, ни
 * другое не должно ронять загрузку листа целиком.
 *
 * Справочник отдаёт механику в той же форме, что хранит документ листа, поэтому
 * схема одна на оба случая: `schemas.ts` разбирает ей деталь черты — как это уже
 * сделано с описанием (`descriptionNodesSchema`).
 */
export const featModifiersSchema = z
  .object({
    hitPoints: z
      .object({
        flat: modifierNumberSchema,
        perAcquisitionLevel: modifierNumberSchema,
        perLevelAfterAcquisition: modifierNumberSchema,
      })
      .optional()
      .catch(undefined),
    speed: z
      .object({
        walkBonus: modifierNumberSchema,
        fly: modifierNumberSchema,
        climb: modifierNumberSchema,
        swim: modifierNumberSchema,
        flyEqualsWalk: modifierFlagSchema,
        climbEqualsWalk: modifierFlagSchema,
        swimEqualsWalk: modifierFlagSchema,
      })
      .optional()
      .catch(undefined),
    armorClassBonus: modifierNumberSchema,
    senses: z
      .array(
        z.object({
          type: z.string().optional().catch(undefined),
          range: modifierNumberSchema,
        }),
      )
      .optional()
      .catch(undefined),
    telepathyRange: modifierNumberSchema,
    damage: z
      .object({
        resistances: modifierCodesSchema,
        immunities: modifierCodesSchema,
        vulnerabilities: modifierCodesSchema,
        // Защиты от типов урона, которые называет игрок: сам тип лежит в
        // ответе на выбор, а здесь — ссылка на него и исход
        defenseChoices: z
          .array(
            z.object({
              choiceKey: z.string().catch(''),
              kind: z
                .enum(['RESISTANCE', 'IMMUNITY', 'VULNERABILITY'])
                .catch('RESISTANCE'),
            }),
          )
          .optional()
          .catch(undefined),
        resistanceFromChoiceKey: z.string().optional().catch(undefined),
      })
      .optional()
      .catch(undefined),
    conditionImmunities: modifierCodesSchema,
    creatureType: z.string().optional().catch(undefined),
    initiativeBonus: modifierNumberSchema,
    initiativeProficiencyBonus: modifierFlagSchema,
  })
  .nullable()
  .catch(null);

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
  prepared: z.boolean().optional().catch(undefined),
  // Уровень доступа выданного чертой заклинания; у записей до него поля нет —
  // такое заклинание доступно с момента взятия черты
  requiredLevel: z.coerce.number().optional().catch(undefined),
  // Своя характеристика заклинания: её ставит черта, давшая заклинание. Нет
  // поля — заклинание считается от характеристики класса
  spellcastingAbility: abilityKeySchema.optional().catch(undefined),
  castingTime: z.string().optional().catch(undefined),
  range: z.string().optional().catch(undefined),
  components: z.string().optional().catch(undefined),
  duration: z.string().optional().catch(undefined),
  description: z.array(descriptionNodeSchema).optional().catch(undefined),
});

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
  // Снимок механики черты; у записей до её появления поля нет — такая черта
  // лист не двигает, пока её не добавят заново.
  modifiers: featModifiersSchema,
  // Снимок выдаваемых чертой владений; у записей до его появления поля нет.
  proficiencies: featProficienciesSchema,
  // Заклинания, которые черта даёт знать; у записей до их появления поля нет.
  // Подготовку игрок снимает и возвращает прямо здесь, поэтому список хранится
  // в самой записи, а не пересобирается из справочника.
  spells: z.array(spellSchema).nullable().optional().catch(undefined),
  // Ответы игрока на выборы черты по ключу выбора; у записей до их появления
  // поля нет.
  choiceAnswers: z
    .record(z.string(), z.array(z.string()).catch([]))
    .optional()
    .catch(undefined),
  // Прибавки к характеристикам, уже применённые чертой; у записей до них поля
  // нет — такая черта характеристики не двигала и при снятии их не тронет.
  abilityIncreases: z
    .partialRecord(abilityKeySchema, z.coerce.number())
    .nullable()
    .optional()
    .catch(undefined),
  // Снимок ресурсов черты; у записей до него поля нет — такая черта ресурсов
  // не заводила, и панель по ней ничего не пересоберёт.
  counters: z.array(featCounterSchema).nullable().optional().catch(undefined),
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
  // Листы до мультикласса ячеек договора отдельно не хранили: у них все траты
  // обычные (у чистого колдуна обычные ячейки и есть договор).
  kind: z.enum(['standard', 'pact']).catch('standard'),
});

/** Настройка числа подготовленных: одна и та же у заклинаний и заговоров. */
const preparedSpellsSettingSchema = z.object({
  custom: z.coerce.number().nullable().catch(null),
  bonus: z.coerce.number().catch(0),
});

// По умолчанию — авто (легаси-листы без поля заклинательства): характеристика
// определяется по классу. Поле `ability` — легаси: до мультикласса оно было
// одно на весь лист, теперь живёт у класса и снимается нормализацией.
const spellcastingSchema = z
  .object({
    ability: abilityKeySchema.nullable().optional().catch(undefined),
    // Настройка подготовленных заклинаний появилась позже: у листов без неё
    // число считается по таблице класса без бонуса. Настройка заговоров
    // появилась ещё позже и ведёт себя так же.
    prepared: preparedSpellsSettingSchema.catch(() => ({
      ...DEFAULT_CHARACTER.spellcasting.prepared,
    })),
    preparedCantrips: preparedSpellsSettingSchema.catch(() => ({
      ...DEFAULT_CHARACTER.spellcasting.preparedCantrips,
    })),
  })
  .catch(() => ({
    ...DEFAULT_CHARACTER.spellcasting,
    prepared: { ...DEFAULT_CHARACTER.spellcasting.prepared },
    preparedCantrips: { ...DEFAULT_CHARACTER.spellcasting.preparedCantrips },
  }));

// Запись своего бонуса общая для навыков и настроек листа: вид, обе стороны
// источника (характеристика и число) и пометка игрока.
const customBonusSchema = z.object({
  id: z.string(),
  // Вид «бонус мастерства» появился вместе с механикой черт («Бдительный»), а
  // виды «уровень персонажа» и «уровень класса» — позже него: листы до них
  // таких записей не имеют, а незнакомый вид падает в число.
  kind: z
    .enum(['ability', 'classLevel', 'flat', 'level', 'proficiency'])
    .catch(NEW_CUSTOM_BONUS.kind),
  ability: abilityKeySchema.catch(NEW_CUSTOM_BONUS.ability),
  // Листы до вида «уровень класса» класса-источника не хранят: пустая строка
  // тут значит «класс не выбран», и такой бонус ничего не прибавляет.
  classUrl: z.string().catch(NEW_CUSTOM_BONUS.classUrl),
  value: z.coerce.number().int().catch(0),
  label: z.string().catch(''),
});

/**
 * Свои бонусы настроек: сперва это было одно число, поэтому у листов без
 * списка ненулевое легаси-значение переезжает в него одной записью-числом, а
 * нулевое просто пропадает — бонуса не было.
 *
 * @param bonuses список своих бонусов записи листа.
 * @param legacyValue легаси-число одного бонуса записи листа.
 * @returns свои бонусы настроек листа.
 */
function toCustomBonuses(
  bonuses: CharacterCustomBonus[] | undefined,
  legacyValue: number | undefined,
): CharacterCustomBonus[] {
  if (bonuses) {
    return bonuses;
  }

  if (!legacyValue) {
    return [];
  }

  return [{ ...NEW_CUSTOM_BONUS, id: crypto.randomUUID(), value: legacyValue }];
}

// По умолчанию — правила D&D (легаси-листы без блока настроек): базовая
// характеристика атаки оружием определяется свойствами оружия.
const settingsSchema = z
  .object({
    weaponAttackAbility: abilityKeySchema.nullable().catch(null),
    // Своё значение основы и характеристика инициативы появились позже: без
    // них основа считается по правилам (уровень и Ловкость).
    customProficiencyBase: z.coerce.number().int().nullable().catch(null),
    initiativeAbility: abilityKeySchema.nullable().catch(null),
    customInitiativeBase: z.coerce.number().int().nullable().catch(null),
    // Группировка навыков появилась позже: листы без неё выводят навыки общим
    // списком по алфавиту, как и раньше.
    groupSkillsByAbility: z.boolean().catch(false),
    // Легаси-поля одного своего бонуса: списками они стали позже, а отсутствие
    // и списка, и числа означает подсчёт строго по правилам.
    customProficiencyBonus: z.coerce.number().int().optional().catch(undefined),
    customInitiativeBonus: z.coerce.number().int().optional().catch(undefined),
    customProficiencyBonuses: z
      .array(customBonusSchema)
      .optional()
      .catch(undefined),
    customInitiativeBonuses: z
      .array(customBonusSchema)
      .optional()
      .catch(undefined),
    // Свои бонусы скоростей появились позже прочих: у листов без них бонусов
    // просто нет, и скорости считаются от своих значений и черт.
    customSpeedBonuses: z
      .object({
        walk: z.array(customBonusSchema).catch([]),
        burrow: z.array(customBonusSchema).catch([]),
        climb: z.array(customBonusSchema).catch([]),
        fly: z.array(customBonusSchema).catch([]),
        swim: z.array(customBonusSchema).catch([]),
      })
      .catch(() =>
        structuredClone(DEFAULT_CHARACTER.settings.customSpeedBonuses),
      ),
  })
  .catch(() => ({
    ...DEFAULT_CHARACTER.settings,
    customProficiencyBonuses: [],
    customInitiativeBonuses: [],
    customSpeedBonuses: structuredClone(
      DEFAULT_CHARACTER.settings.customSpeedBonuses,
    ),
  }))
  .transform(
    ({
      customProficiencyBonus,
      customInitiativeBonus,
      customProficiencyBonuses,
      customInitiativeBonuses,
      ...settings
    }) => ({
      ...settings,
      customProficiencyBonuses: toCustomBonuses(
        customProficiencyBonuses,
        customProficiencyBonus,
      ),
      customInitiativeBonuses: toCustomBonuses(
        customInitiativeBonuses,
        customInitiativeBonus,
      ),
    }),
  );

const experienceSchema = z
  .object({
    current: z.coerce.number().catch(0),
    nextLevel: z.coerce.number().catch(DEFAULT_CHARACTER.experience.nextLevel),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.experience }));

/**
 * Характеристики класса доспеха: список появился позже одиночного поля
 * `ability`, поэтому у старых листов он собирается из него — так, чтобы уже
 * посчитанный КД не поехал.
 *
 * @param abilities список характеристик записи листа.
 * @param ability легаси-характеристика записи листа.
 * @param custom взято ли ручное значение КД.
 * @returns характеристики, чьи модификаторы идут в КД.
 */
function toArmorClassAbilities(
  abilities: AbilityKey[] | undefined,
  ability: AbilityKey | null | undefined,
  custom: boolean,
): AbilityKey[] {
  if (abilities) {
    return abilities;
  }

  // В ручном значении `null` означал «без модификатора», а отсутствие поля —
  // запись до появления настройки: там работал дефолт листа.
  if (custom && ability !== undefined) {
    return ability ? [ability] : [];
  }

  // Автоподсчёт по доспеху всегда брал Ловкость и на `ability` не смотрел:
  // перенос его значения поменял бы КД задним числом.
  return [...DEFAULT_CHARACTER.armorClass.abilities];
}

const armorClassSchema = z
  .object({
    base: z.coerce.number().catch(DEFAULT_CHARACTER.armorClass.base),
    // Легаси-поле одной характеристики: `null` в нём означал «без модификатора»,
    // а отсутствие — запись до появления настройки.
    ability: abilityKeySchema.nullable().optional().catch(undefined),
    abilities: z.array(abilityKeySchema).optional().catch(undefined),
    natural: z.boolean().catch(false),
    // Свой предел бонуса Ловкости от доспеха; у листов до его появления поля
    // нет — предел берётся по правилу доспеха.
    dexLimit: z.coerce.number().int().nullable().catch(null),
    // По умолчанию — автоподсчёт по надетой броне (легаси-листы без поля).
    custom: z.boolean().catch(false),
  })
  .catch(() => ({
    ...DEFAULT_CHARACTER.armorClass,
    abilities: [...DEFAULT_CHARACTER.armorClass.abilities],
  }))
  .transform(({ ability, abilities, ...armorClass }) => ({
    ...armorClass,
    abilities: toArmorClassAbilities(abilities, ability, armorClass.custom),
  }));

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

/**
 * Свои бонусы к значениям характеристик. Списки заведены по всем шести ключам
 * сразу: пустой список — бонусов нет, и разбирать в подсчёте нечего.
 */
const abilityBonusesSchema = z
  .object({
    strength: z.array(customBonusSchema).catch([]),
    dexterity: z.array(customBonusSchema).catch([]),
    constitution: z.array(customBonusSchema).catch([]),
    intelligence: z.array(customBonusSchema).catch([]),
    wisdom: z.array(customBonusSchema).catch([]),
    charisma: z.array(customBonusSchema).catch([]),
  })
  .catch(() => structuredClone(DEFAULT_CHARACTER.abilityBonuses));

const savingThrowSchema = z.object({
  key: abilityKeySchema,
  ability: abilityKeySchema,
  proficient: z.boolean().catch(false),
  bonuses: z.array(customBonusSchema).catch([]),
});

/**
 * Спасброски листа: сперва они хранились одним списком характеристик, которыми
 * персонаж владеет, поэтому у листов без записей владение переезжает из
 * легаси-списка, а характеристика и свои бонусы заводятся по правилам. Записей
 * всегда шесть и в порядке листа: документ мог потерять строку или сложить их
 * иначе, а блок спасбросков и PDF читают их по порядку.
 *
 * @param savingThrows спасброски записи листа.
 * @param legacyProficiencies легаси-список владений спасбросками записи листа.
 * @returns спасброски листа.
 */
function toSavingThrows(
  savingThrows: CharacterSavingThrow[] | undefined,
  legacyProficiencies: AbilityKey[] | undefined,
): CharacterSavingThrow[] {
  return DEFAULT_CHARACTER.savingThrows.map(({ key, ability }) => {
    const stored = savingThrows?.find((savingThrow) => savingThrow.key === key);

    return (
      stored ?? {
        key,
        ability,
        proficient: legacyProficiencies?.includes(key) ?? false,
        bonuses: [],
      }
    );
  });
}

const skillSchema = z.object({
  name: z.string(),
  ability: abilityKeySchema,
  proficiency: skillProficiencySchema.catch('none'),
  // Свои бонусы навыка появились позже самих навыков: у листов без них навык
  // считается строго по правилам.
  bonuses: z.array(customBonusSchema).catch([]),
});

const levelHitPointsSchema = z.object({
  level: z.coerce.number(),
  amount: z.coerce.number().catch(0),
  // Листы до мультикласса класс прироста не отмечали: нормализация приписывает
  // такие записи основному классу — до второго класса они все его и были.
  classUrl: z.string().nullable().catch(null),
});

const healthSchema = z
  .object({
    current: z.coerce.number().catch(0),
    max: z.coerce.number().catch(0),
    temporary: z.coerce.number().catch(0),
    // Листы до появления учёта прироста записей не имеют: снижение уровня у них
    // максимум не тронет, пока уровни не будут взяты заново.
    levelGains: z.array(levelHitPointsSchema).catch([]),
    // Листы, сохранённые до появления истощения, читаются с нулевым уровнем.
    // Уровень вне границ правил (правка файла руками) тоже сбрасывается в ноль:
    // дальше он живёт в подсчётах отдыха и подписях, где допустимы только 0…6.
    exhaustion: z.coerce
      .number()
      .int()
      .min(EXHAUSTION_LEVEL_MIN)
      .max(EXHAUSTION_LEVEL_MAX)
      .catch(EXHAUSTION_LEVEL_MIN),
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

const resourceRecoveryRuleSchema = z.object({
  mode: z.enum(['none', 'all', 'amount']).catch('none'),
  amount: z.coerce.number().catch(RESOURCE_RECOVERY_AMOUNT_MIN),
});

/**
 * Правило максимума ресурса. Неизвестный источник читается как своё число:
 * такой ресурс останется с записанным максимумом, а не обнулится.
 */
const resourceMaxRuleSchema = z.object({
  source: z.enum(['fixed', 'proficiency', 'ability', 'level']).catch('fixed'),
  ability: abilityKeySchema.catch(RESOURCE_MAX_DEFAULT_ABILITY),
  offset: z.coerce.number().catch(0),
});

/**
 * Правила восстановления ресурса: раздельные порции появились позже одного
 * поля `recovery`, где отдых возвращал ресурс целиком. У старых листов
 * продолжительный отдых возвращал всё всегда, а короткий — только ресурсам,
 * отмеченным коротким отдыхом.
 *
 * @param rule правило записи листа.
 * @param recovery легаси-вид отдыха записи листа.
 * @param isShortRest собирается ли правило короткого отдыха.
 * @returns правило восстановления ресурса.
 */
function toResourceRecoveryRule(
  rule: ResourceRecoveryRule | undefined,
  recovery: ResourceRecovery | undefined,
  isShortRest: boolean,
): ResourceRecoveryRule {
  if (rule) {
    return rule;
  }

  const mode: ResourceRecoveryMode =
    !isShortRest || recovery === 'short-rest' ? 'all' : 'none';

  return { mode, amount: RESOURCE_RECOVERY_AMOUNT_MIN };
}

const classResourceSchema = z
  .object({
    id: z.string(),
    name: z.string().catch(''),
    shortLabel: z.string().catch(''),
    // Легаси-поле одного вида отдыха: у листов до раздельных порций оно
    // задавало, возвращает ли ресурс короткий отдых.
    recovery: z.enum(['short-rest', 'long-rest']).optional().catch(undefined),
    shortRest: resourceRecoveryRuleSchema.optional().catch(undefined),
    longRest: resourceRecoveryRuleSchema.optional().catch(undefined),
    current: z.coerce.number().catch(0),
    max: z.coerce.number().catch(0),
    // Правило максимума: у ресурсов до него поля нет — их максимум записан
    // числом и от листа не зависит.
    maxRule: resourceMaxRuleSchema.nullable().optional().catch(null),
  })
  .transform(({ recovery, shortRest, longRest, ...resource }) => ({
    ...resource,
    shortRest: toResourceRecoveryRule(shortRest, recovery, true),
    longRest: toResourceRecoveryRule(longRest, recovery, false),
  }));

const proficienciesSchema = z
  .object({
    armor: z.array(z.string()).catch([]),
    weapons: z.array(z.string()).catch([]),
    weaponMasteries: z.array(z.string()).catch([]),
    tools: z.array(toolProficiencySchema).catch([]),
    languages: z.array(z.string()).catch([]),
  })
  .catch(() => structuredClone(DEFAULT_CHARACTER.proficiencies));

/**
 * Журнал выдач владений. У листов, сохранённых до его появления, поля нет:
 * пустой журнал означает, что все владения отмечены вручную и снятие источника
 * их не трогает — ровно прежнее поведение листа.
 *
 * Запись без источника бессмысленна (снять по ней нечего), поэтому `source`
 * обязателен, а битая запись выпадает поодиночке.
 */
const proficiencyGrantsSchema = z
  .array(
    grantedProficienciesSchema
      .extend({ source: z.string() })
      .nullable()
      .catch(null),
  )
  .catch([])
  .transform((grants) => grants.filter((grant) => grant !== null));

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

const inventoryExtraDamageSchema = z
  .object({
    diceCount: z.coerce.number().catch(0),
    diceFaces: z.coerce.number().catch(0),
    type: z.string().catch(''),
  })
  .nullable()
  .catch(null);

const inventoryWeaponSchema = z
  .object({
    category: z.enum(['simple', 'martial']).catch('simple'),
    ranged: z.boolean().catch(false),
    finesse: z.boolean().catch(false),
    // Листы, сохранённые до появления свойства «Тяжёлое», поля не содержат:
    // помехи у такого оружия нет, пока игрок не отметит свойство сам.
    heavy: z.boolean().catch(false),
    // Листы, сохранённые до появления магических бонусов, поля не содержат:
    // ноль означает обычное оружие, поэтому доливать нечего.
    attackBonus: z.coerce.number().catch(0),
    // Оружие из листов, сохранённых до появления урона, приходит без блока —
    // схема даёт null, и плитка урона просто не показывается.
    damage: inventoryWeaponDamageSchema,
    // То же с уроном двумя руками: у листов, сохранённых до появления хвата,
    // блока нет — переключать нечего, пока предмет не добавят заново.
    versatileDamage: inventoryWeaponDamageSchema,
    // И то же с дополнительным уроном: у листов до его появления блока нет —
    // оружие катит один свой бросок.
    extraDamage: inventoryExtraDamageSchema,
  })
  .nullable()
  .catch(null);

/**
 * Пассивный бонус предмета. Вид цели закрыт списком модели: незнакомая строка
 * означает запись из другой версии листа, и такой бонус отбрасывается целиком —
 * иначе он молча ушёл бы не в ту цель.
 */
const inventoryBonusSchema = z
  .object({
    id: z.string().catch(() => crypto.randomUUID()),
    kind: z.enum([
      'ability',
      'ability-check',
      'skill',
      'saving-throw',
      'all-saving-throws',
      'speed',
      'all-speeds',
      'armor-class',
      'spell-save-dc',
      'spell-attack',
      'initiative',
    ]),
    key: z.string().catch(''),
    value: z.coerce.number().catch(0),
    // Режим и порядок появились вместе с эффектами магических предметов: у
    // прежних записей и у своей формы листа их нет — это обычные прибавки.
    mode: z
      .enum(['add', 'override', 'upgrade', 'downgrade'])
      .optional()
      .catch(undefined),
    priority: z.coerce.number().optional().catch(undefined),
  })
  .nullable()
  .catch(null);

/** Бонусы предмета: у листов, сохранённых до их появления, список пуст. */
const inventoryBonusesSchema = z
  .array(inventoryBonusSchema)
  .catch([])
  .transform((bonuses) => bonuses.filter((bonus) => bonus !== null));

/**
 * Заряды предмета. Остаток не выше максимума: иначе правка максимума в разделе
 * оставила бы на листе больше зарядов, чем предмет вмещает.
 */
const inventoryChargesSchema = z
  .object({
    current: z.coerce.number().int().min(0).catch(0),
    max: z.coerce.number().int().min(0).catch(0),
  })
  .transform((charges) => ({
    ...charges,
    current: Math.min(charges.current, charges.max),
  }))
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

// Настройка грузоподъёмности появилась позже снаряжения: у листов без неё
// предел считается по правилам от Силы и размера персонажа, без бонуса.
const carryingCapacitySchema = z
  .object({
    size: z.string().nullable().catch(null),
    custom: z.coerce.number().nullable().catch(null),
    bonus: z.coerce.number().catch(0),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.carryingCapacity }));

// Настройка предела настройки на предметы появилась позже снаряжения: у листов
// без неё предел считается по правилам 2024 (три предмета) без бонуса.
const attunementSchema = z
  .object({
    custom: z.coerce.number().nullable().catch(null),
    ability: abilityKeySchema.nullable().catch(null),
    bonus: z.coerce.number().catch(0),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.attunement }));

const notesSchema = z
  .union([z.array(noteSchema), z.string()])
  .catch([])
  .transform((notes) =>
    typeof notes === 'string' ? toLegacyNotes(notes) : notes,
  );

// Личность появилась позже остальных блоков: у листов без неё все поля пустые.
// Каждое поле со своим `catch` — чужое значение (число из другого редактора,
// пропавшее поле) обнуляет только себя, а не всю личность целиком.
const personalitySchema = z
  .object({
    alignment: z.string().catch(''),
    age: z.string().catch(''),
    height: z.string().catch(''),
    weight: z.string().catch(''),
    eyes: z.string().catch(''),
    hair: z.string().catch(''),
    skin: z.string().catch(''),
    description: z.string().catch(''),
  })
  .catch(() => ({ ...DEFAULT_CHARACTER.personality }));

const inventoryItemSchema = z.object({
  id: z.string(),
  url: z.string().catch(''),
  name: z.string().catch(''),
  category: z.enum(['WEAPON', 'ARMOR', 'ITEM', 'MAGIC_ITEM']).catch('ITEM'),
  typesLabel: z.string().catch(''),
  cost: z.string().catch(''),
  weight: z.coerce.number().catch(0),
  // Ноль — рабочее состояние («Отсутствует»), а вот дробное и отрицательное
  // количество запись листа держать не должна: строка показывала бы «−2», и
  // предмет молча считался бы отсутствующим.
  quantity: z.coerce
    .number()
    .int()
    .min(INVENTORY_QUANTITY_MIN)
    .max(INVENTORY_QUANTITY_MAX)
    .catch(1),
  armor: inventoryArmorSchema,
  // Плоский бонус к КД предмета без брони; у листов до его появления — ноль.
  armorClassBonus: z.coerce.number().catch(0),
  weapon: inventoryWeaponSchema,
  equipped: z.boolean().catch(false),
  twoHanded: z.boolean().catch(false),
  bonuses: inventoryBonusesSchema,
  // Состояние магии; у листов до его появления — настройки нет, предмет
  // выключен, зарядов не заведено.
  requiresAttunement: z.boolean().catch(false),
  attuned: z.boolean().catch(false),
  active: z.boolean().catch(false),
  charges: inventoryChargesSchema,
  // Описание есть только у своих предметов (`custom:<uuid>`): у каталожных оно
  // живёт в разделе-источнике, а не в листе.
  description: z.array(descriptionNodeSchema).optional().catch(undefined),
});

/**
 * Форма листа сразу после разбора схемой: классы могут быть без уровня, среди
 * дополнительных попадаются выпавшие записи, а заклинательная характеристика
 * ещё лежит легаси-полем на всём листе.
 */
type ParsedCharacter = Omit<Character, 'additionalClasses' | 'spellcasting'> & {
  additionalClasses: (CharacterClass | null)[];
  spellcasting: CharacterSpellcasting & { ability?: AbilityKey | null };
};

/**
 * Идентификатор с url класса вместо прежнего сквозного. Ключи умений и названия
 * колонок в справочнике повторяются между классами, поэтому в мультиклассе они
 * разнесены по классам; листы, сохранённые до этого, разносятся здесь.
 *
 * @param id идентификатор умения или ресурса.
 * @param prefix начало идентификаторов этого вида.
 * @param classUrls url всех классов листа.
 * @param primaryClassUrl url основного класса — ему достаются легаси-записи.
 * @returns идентификатор с url класса.
 */
function toScopedClassId(
  id: string,
  prefix: string,
  classUrls: Set<string>,
  primaryClassUrl: string,
): string {
  if (!id.startsWith(prefix)) {
    return id;
  }

  const rest = id.slice(prefix.length);

  const [firstSegment = ''] = rest.split(':');

  // Идентификатор уже разнесён по классам — второй раз url не приписываем.
  return classUrls.has(firstSegment)
    ? id
    : `${prefix}${primaryClassUrl}:${rest}`;
}

/**
 * Приведение листа к мультиклассовой форме: классы получают свои уровни, общий
 * уровень становится их суммой, легаси-идентификаторы умений и ресурсов
 * разносятся по классам, а заклинательная характеристика листа переезжает в
 * основной класс.
 *
 * @param character лист сразу после разбора схемой.
 * @returns лист в нынешней форме.
 */
function normalizeCharacterClasses(character: ParsedCharacter): Character {
  const { ability: legacySpellcastingAbility, ...spellcasting } =
    character.spellcasting;

  // Дубли по url схлопываются: один класс дважды — это битый документ, а не
  // мультикласс (уровни в одном классе не складываются).
  const seenUrls = new Set<string>();

  const parsedClasses = [
    character.characterClass,
    ...character.additionalClasses,
  ].filter((entry): entry is CharacterClass => {
    if (!entry || seenUrls.has(entry.url)) {
      return false;
    }

    seenUrls.add(entry.url);

    return true;
  });

  const [primary, ...additional] = parsedClasses;

  if (!primary) {
    return {
      ...character,
      spellcasting,
      characterClass: null,
      additionalClasses: [],
      level: clamp(Math.trunc(character.level), LEVEL_MIN, LEVEL_MAX),
    };
  }

  // Уровень дополнительного класса без значения — единица: раньше их не было
  // вовсе, а битую запись честнее считать одним уровнем, чем нулём.
  const normalizedAdditional = additional.map((entry) => ({
    ...entry,
    level: clamp(Math.trunc(entry.level) || 1, LEVEL_MIN, LEVEL_MAX),
  }));

  const additionalLevels = normalizedAdditional.reduce(
    (sum, entry) => sum + entry.level,
    0,
  );

  // Лист до мультикласса уровня в классе не хранил: весь общий уровень был
  // уровнем единственного класса, поэтому дополнительные из него вычитаются.
  const primaryLevel = clamp(
    Math.trunc(primary.level) || Math.trunc(character.level) - additionalLevels,
    LEVEL_MIN,
    LEVEL_MAX,
  );

  const classUrls = new Set(parsedClasses.map((entry) => entry.url));

  const scopeFeatureId = (id: string) =>
    toScopedClassId(id, CLASS_FEATURE_ID_PREFIX, classUrls, primary.url);

  return {
    ...character,
    spellcasting,
    characterClass: {
      ...primary,
      level: primaryLevel,
      spellcastingAbility:
        primary.spellcastingAbility ?? legacySpellcastingAbility ?? null,
    },
    additionalClasses: normalizedAdditional,
    level: clamp(primaryLevel + additionalLevels, LEVEL_MIN, LEVEL_MAX),
    features: character.features.map((feature) => ({
      ...feature,
      id: scopeFeatureId(feature.id),
    })),
    classResources: character.classResources.map((resource) => ({
      ...resource,
      id: toScopedClassId(
        resource.id,
        CLASS_RESOURCE_ID_PREFIX,
        classUrls,
        primary.url,
      ),
    })),
    health: {
      ...character.health,
      levelGains: character.health.levelGains.map((gain) => ({
        ...gain,
        classUrl: gain.classUrl ?? primary.url,
      })),
    },
  };
}

/** Схема персонажа целиком (jsonb-документ листа). */
const characterSchema = z
  .object({
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
    additionalClasses: additionalClassesSchema,
    characterBackground: characterBackgroundSchema,
    level: z.coerce.number().catch(DEFAULT_CHARACTER.level),
    experience: experienceSchema,
    inspiration: z.boolean().catch(false),
    armorClass: armorClassSchema,
    speed: speedSchema,
    vision: visionSchema,
    abilities: abilitiesSchema,
    // Свои бонусы характеристик появились позже самих значений: у листов до них
    // поля нет, и оно падает в пустые списки.
    abilityBonuses: abilityBonusesSchema,
    // Легаси-поле: одним списком владений спасброски хранились до того, как у
    // каждого появились своя характеристика и свои бонусы.
    savingThrowProficiencies: z
      .array(abilityKeySchema)
      .optional()
      .catch(undefined),
    savingThrows: z.array(savingThrowSchema).optional().catch(undefined),
    // Общие бонусы ко всем спасброскам появились вместе с записями; у листов до
    // них общих бонусов попросту нет.
    commonSavingThrowBonuses: z.array(customBonusSchema).catch([]),
    skills: z
      .array(skillSchema)
      .catch(() => structuredClone(DEFAULT_CHARACTER.skills)),
    health: healthSchema,
    hitDice: z.array(hitDieSchema).catch([]),
    extraHitDice: z.array(extraHitDieSchema).catch([]),
    classResources: z.array(classResourceSchema).catch([]),
    proficiencies: proficienciesSchema,
    proficiencyGrants: proficiencyGrantsSchema,
    currency: currencySchema,
    customCurrencies: z.array(customCurrencySchema).catch([]),
    inventory: z.array(inventoryItemSchema).catch([]),
    carryingCapacity: carryingCapacitySchema,
    attunement: attunementSchema,
    notes: notesSchema,
    personality: personalitySchema,
    settings: settingsSchema,
  })
  // Легаси-список владений спасбросками уходит из документа, как только тот
  // разобран: дальше по листу ходят только сами записи спасбросков. Тем же
  // проходом лист приводится к мультиклассовой форме.
  .transform(({ savingThrowProficiencies, savingThrows, ...character }) =>
    normalizeCharacterClasses({
      ...character,
      savingThrows: toSavingThrows(savingThrows, savingThrowProficiencies),
    }),
  );

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
 * Лимиты по подписке — тоже с `catch`: без них подсказка про подписку не
 * показывается, а сам список работает как раньше.
 */
const sheetListPageSchema = z.object({
  limit: z.number(),
  subscriberLimit: z.coerce.number().catch(0),
  historyLimit: z.coerce.number().catch(0),
  subscriberHistoryLimit: z.coerce.number().catch(0),
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
    subscriberLimit: page.subscriberLimit,
    historyLimit: page.historyLimit,
    subscriberHistoryLimit: page.subscriberHistoryLimit,
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
 * серверный лимит обязателен, а лимит по подписке — нет.
 */
const savedSheetListPageSchema = z.object({
  limit: z.number(),
  subscriberLimit: z.coerce.number().catch(0),
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
    subscriberLimit: page.subscriberLimit,
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
