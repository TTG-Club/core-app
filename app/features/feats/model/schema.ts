import type {
  FeatMechanics,
  FeatPrerequisiteDetails,
  FeatSpellListGroup,
} from './mechanics';

import { z } from 'zod';

import { AbilityKey } from '~/shared/types';
import { normalizeLoadedActiveEffects } from '~active-effects/model';

import { createFeatMechanics, createPrerequisiteDetails } from './mechanics';
import { toFeatEditorRows } from './rows';

/**
 * Разбор механики и предусловия, пришедших с сервера.
 *
 * Данные приходят из `GET /api/v2/feats/{url}/raw`, где механика хранится в
 * JSONB: у старых записей блоков может не быть вовсе, а списки приходить
 * пропущенными — поэтому в схемах почти всё необязательно. Задача разбора не
 * подставить значения, а отсеять чужое: недостающее дозаполняет слияние с
 * начальным состоянием формы внутри `useWorkshopForm`.
 */

const entityRefSchema = z.object({
  url: z.string(),
  name: z.string().optional(),
});

// Схема строится из самого перечисления, а не из списка литералов: строковый
// литерал и член `enum` в TypeScript — разные типы, и разбор литералами не
// присваивался бы модели, где характеристики описаны перечислением.
const abilityKeySchema = z.enum(AbilityKey);

const abilityBonusSchema = z.object({
  abilities: z.array(abilityKeySchema).optional(),
  bonus: z.number().optional(),
  upto: z.number().optional(),
  count: z.number().optional(),
  fromChoiceKey: z.string().optional(),
});

const abilityRequirementSchema = z.object({
  anyOf: z.array(abilityKeySchema).optional(),
  minValue: z.number().optional(),
});

const choiceOptionSchema = z.object({
  value: z.string(),
  name: z.string().optional(),
});

// Школа магии и время накладывания в фильтре больше не задаются: пул
// заклинаний в листе персонажа их не учитывал, и в записи они только
// расходились с тем, что игрок в итоге видел
const spellFilterSchema = z.object({
  level: z.number().optional(),
  maxLevel: z.number().optional(),
  classes: z.array(entityRefSchema).optional(),
  classesFromChoiceKey: z.string().optional(),
});

const choiceTypeSchema = z.enum([
  'ABILITY',
  'SAVING_THROW',
  'SKILL',
  'TOOL',
  'LANGUAGE',
  'DAMAGE_TYPE',
  'SPELL',
  'CANTRIP',
  'SPELL_LIST',
  'SPELLCASTING_ABILITY',
  'WEAPON',
  'WEAPON_MASTERY',
  'ARMOR',
  'OPTION',
]);

const choiceSchema = z.object({
  key: z.string().optional(),
  type: choiceTypeSchema.optional(),
  types: z.array(choiceTypeSchema).optional(),
  label: z.string().optional(),
  count: z.number().optional(),
  countEqualsProficiencyBonus: z.boolean().optional(),
  options: z.array(choiceOptionSchema).optional(),
  spellFilter: spellFilterSchema.optional(),
  onlyIfNotProficient: z.boolean().optional(),
  onlyIfProficient: z.boolean().optional(),
  // Единственное значение, которое разбор подставляет сам: слияние с начальным
  // состоянием формы до выборов внутри списка не достаёт, а отсутствие поля —
  // это владение, и без подстановки селект «Что даёт выбор» открывался бы
  // пустым у всех записей, сохранённых с обычным исходом.
  grants: z.enum(['PROFICIENCY', 'EXPERTISE']).default('PROFICIENCY'),
  expertiseIfProficient: z.boolean().optional(),
  rechooseOnLongRest: z.boolean().optional(),
});

const hitPointsSchema = z.object({
  flat: z.number().optional(),
  perAcquisitionLevel: z.number().optional(),
  perLevelAfterAcquisition: z.number().optional(),
});

const speedSchema = z.object({
  walkBonus: z.number().optional(),
  fly: z.number().optional(),
  climb: z.number().optional(),
  swim: z.number().optional(),
  flyEqualsWalk: z.boolean().optional(),
  climbEqualsWalk: z.boolean().optional(),
  swimEqualsWalk: z.boolean().optional(),
});

const senseSchema = z.object({
  type: z.string().optional(),
  range: z.number().optional(),
});

const damageDefenseChoiceSchema = z.object({
  choiceKey: z.string(),
  kind: z.enum(['RESISTANCE', 'IMMUNITY', 'VULNERABILITY']),
});

const damageAffinitySchema = z.object({
  resistances: z.array(z.string()).optional(),
  immunities: z.array(z.string()).optional(),
  vulnerabilities: z.array(z.string()).optional(),
  defenseChoices: z.array(damageDefenseChoiceSchema).optional(),
  resistanceFromChoiceKey: z.string().optional(),
});

const modifiersSchema = z.object({
  hitPoints: hitPointsSchema.optional(),
  speed: speedSchema.optional(),
  armorClassBonus: z.number().optional(),
  senses: z.array(senseSchema).optional(),
  telepathyRange: z.number().optional(),
  damage: damageAffinitySchema.optional(),
  conditionImmunities: z.array(z.string()).optional(),
  creatureType: z.string().optional(),
  initiativeBonus: z.number().optional(),
  initiativeProficiencyBonus: z.boolean().optional(),
});

const proficiencyGrantSchema = z.object({
  weaponCategories: z.array(z.string()).optional(),
  weapons: z.array(entityRefSchema).optional(),
  weaponMasteries: z.array(entityRefSchema).optional(),
  savingThrows: z.array(abilityKeySchema).optional(),
  armorCategories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  tools: z.array(entityRefSchema).optional(),
});

const counterSchema = z.object({
  key: z.string().optional(),
  name: z.string().optional(),
  shortName: z.string().optional(),
  max: z.string().optional(),
  recovery: z.enum(['SHORT_REST', 'LONG_REST']).default('LONG_REST'),
});

// Выдаваемое заклинание — та же ссылка плюс уровень, с которого оно доступно.
// Форма плоская, поэтому ссылки, сохранённые до появления уровня, читаются как
// «доступно с момента взятия».
const grantedSpellRefSchema = entityRefSchema.extend({
  requiredLevel: z.number().optional(),
});

const spellGrantSchema = z.object({
  spells: z.array(grantedSpellRefSchema).optional(),
  spellcastingAbility: abilityKeySchema.optional(),
  alwaysPrepared: z.boolean().optional(),
});

const spellListGroupSchema = z.object({
  requiredLevel: z.number().optional(),
  count: z.string().optional(),
  spells: z.array(entityRefSchema).optional(),
});

const spellListSchema = z.object({
  groups: z.array(spellListGroupSchema).optional(),
  // Прежняя плоская форма: один список без уровня и количества. Читается в
  // одну группу, чтобы у черт, сохранённых до появления уровней, список не
  // пропал
  spells: z.array(entityRefSchema).optional(),
  requiresSpellcasting: z.boolean().optional(),
});

const mechanicsSchema = z.object({
  abilityBonuses: z.array(abilityBonusSchema).optional(),
  choices: z.array(choiceSchema).optional(),
  modifiers: modifiersSchema.optional(),
  proficiencies: proficiencyGrantSchema.optional(),
  spells: spellGrantSchema.optional(),
  spellList: spellListSchema.optional(),
  counters: z.array(counterSchema).optional(),
});

const prerequisiteDetailsSchema = z.object({
  minCharacterLevel: z.number().optional(),
  abilities: z.array(abilityRequirementSchema).optional(),
  feats: z.array(entityRefSchema).optional(),
  anyDragonmark: z.boolean().optional(),
  classFeatures: z
    .array(
      z.enum([
        'SPELLCASTING',
        'PACT_MAGIC',
        'FIGHTING_STYLE',
        'WEAPON_MASTERY',
      ]),
    )
    .optional(),
  classes: z.array(entityRefSchema).optional(),
  species: z.array(entityRefSchema).optional(),
  backgrounds: z.array(entityRefSchema).optional(),
  armorProficiency: z.array(z.string()).optional(),
  campaign: z.string().optional(),
  custom: z.string().optional(),
});

/**
 * Списки заклинаний из разобранного блока.
 *
 * Записи новой формы читаются как есть; у старых список лежал плоско, без
 * уровня и количества, — он становится единственной группой «доступна сразу,
 * весь список».
 *
 * @param parsed разобранный блок расширения списка.
 * @returns списки заклинаний по уровням доступа.
 */
function toSpellListGroups(
  parsed: z.infer<typeof spellListSchema> | undefined,
): Array<FeatSpellListGroup> {
  if (parsed?.groups?.length) {
    return parsed.groups.map((group) => ({
      requiredLevel: group.requiredLevel,
      count: group.count ?? '',
      spells: group.spells ?? [],
    }));
  }

  if (parsed?.spells?.length) {
    return [{ requiredLevel: undefined, count: '', spells: parsed.spells }];
  }

  return [];
}

/** Разобранная механика: у всех полей структура есть, значений может не быть. */
type ParsedMechanics = z.infer<typeof mechanicsSchema>;

/** Разобранное предусловие в том же смысле. */
type ParsedPrerequisiteDetails = z.infer<typeof prerequisiteDetailsSchema>;

/**
 * Достраивает разобранную механику до полной структуры формы.
 *
 * Поля перечислены поимённо, а не разложены спредом: в схемах они
 * необязательны (`type?: string`), а в модели обязательны со значением
 * `undefined` (`type: string | undefined`) — для TypeScript это разные вещи, и
 * спред такую пару не соединяет.
 *
 * @param parsed разобранная механика; не задана — черта её не хранит.
 * @returns механика со всеми блоками и списками.
 */
function toFeatMechanicsState(
  parsed: ParsedMechanics | undefined,
): FeatMechanics {
  const empty = createFeatMechanics();

  if (!parsed) {
    return empty;
  }

  return {
    abilityBonuses: (parsed.abilityBonuses ?? []).map((bonus) => ({
      abilities: bonus.abilities ?? [],
      bonus: bonus.bonus,
      upto: bonus.upto,
      count: bonus.count,
      fromChoiceKey: bonus.fromChoiceKey ?? '',
    })),
    choices: (parsed.choices ?? []).map((choice) => ({
      key: choice.key ?? '',
      type: choice.type,
      types: choice.types,
      label: choice.label ?? '',
      count: choice.count,
      countEqualsProficiencyBonus: choice.countEqualsProficiencyBonus ?? false,
      options: choice.options ?? [],
      spellFilter: choice.spellFilter
        ? {
            level: choice.spellFilter.level,
            maxLevel: choice.spellFilter.maxLevel,
            classes: choice.spellFilter.classes ?? [],
            classesFromChoiceKey: choice.spellFilter.classesFromChoiceKey ?? '',
          }
        : undefined,
      onlyIfNotProficient: choice.onlyIfNotProficient ?? false,
      onlyIfProficient: choice.onlyIfProficient ?? false,
      grants: choice.grants,
      expertiseIfProficient: choice.expertiseIfProficient ?? false,
      rechooseOnLongRest: choice.rechooseOnLongRest ?? false,
    })),
    modifiers: {
      hitPoints: {
        flat: parsed.modifiers?.hitPoints?.flat,
        perAcquisitionLevel: parsed.modifiers?.hitPoints?.perAcquisitionLevel,
        perLevelAfterAcquisition:
          parsed.modifiers?.hitPoints?.perLevelAfterAcquisition,
      },
      speed: {
        walkBonus: parsed.modifiers?.speed?.walkBonus,
        fly: parsed.modifiers?.speed?.fly,
        climb: parsed.modifiers?.speed?.climb,
        swim: parsed.modifiers?.speed?.swim,
        flyEqualsWalk: parsed.modifiers?.speed?.flyEqualsWalk ?? false,
        climbEqualsWalk: parsed.modifiers?.speed?.climbEqualsWalk ?? false,
        swimEqualsWalk: parsed.modifiers?.speed?.swimEqualsWalk ?? false,
      },
      armorClassBonus: parsed.modifiers?.armorClassBonus,
      senses: (parsed.modifiers?.senses ?? []).map((sense) => ({
        type: sense.type,
        range: sense.range,
      })),
      telepathyRange: parsed.modifiers?.telepathyRange,
      damage: {
        resistances: parsed.modifiers?.damage?.resistances ?? [],
        immunities: parsed.modifiers?.damage?.immunities ?? [],
        vulnerabilities: parsed.modifiers?.damage?.vulnerabilities ?? [],
        defenseChoices: (parsed.modifiers?.damage?.defenseChoices ?? []).map(
          (choice) => ({ ...choice }),
        ),
        resistanceFromChoiceKey:
          parsed.modifiers?.damage?.resistanceFromChoiceKey ?? '',
      },
      conditionImmunities: parsed.modifiers?.conditionImmunities ?? [],
      creatureType: parsed.modifiers?.creatureType,
      initiativeBonus: parsed.modifiers?.initiativeBonus,
      initiativeProficiencyBonus:
        parsed.modifiers?.initiativeProficiencyBonus ?? false,
    },
    proficiencies: {
      weaponCategories: parsed.proficiencies?.weaponCategories ?? [],
      weapons: parsed.proficiencies?.weapons ?? [],
      weaponMasteries: parsed.proficiencies?.weaponMasteries ?? [],
      savingThrows: parsed.proficiencies?.savingThrows ?? [],
      armorCategories: parsed.proficiencies?.armorCategories ?? [],
      skills: parsed.proficiencies?.skills ?? [],
      languages: parsed.proficiencies?.languages ?? [],
      tools: parsed.proficiencies?.tools ?? [],
    },
    spells: {
      spells: (parsed.spells?.spells ?? []).map((spell) => ({
        url: spell.url,
        name: spell.name,
        requiredLevel: spell.requiredLevel,
      })),
      spellcastingAbility: parsed.spells?.spellcastingAbility,
      alwaysPrepared: parsed.spells?.alwaysPrepared ?? false,
    },
    spellList: {
      groups: toSpellListGroups(parsed.spellList),
      // Пустое поле читается как «расширяет всегда» — так же его читает бэк
      requiresSpellcasting: parsed.spellList?.requiresSpellcasting ?? false,
    },
    counters: (parsed.counters ?? []).map((counter) => ({
      key: counter.key ?? '',
      name: counter.name ?? '',
      shortName: counter.shortName ?? '',
      max: counter.max ?? '',
      recovery: counter.recovery,
    })),
  };
}

/**
 * Достраивает разобранное предусловие до полной структуры формы.
 *
 * @param parsed разобранное предусловие; не задано — черта его не хранит.
 * @returns предусловие со всеми списками.
 */
function toFeatPrerequisiteState(
  parsed: ParsedPrerequisiteDetails | undefined,
): FeatPrerequisiteDetails {
  if (!parsed) {
    return createPrerequisiteDetails();
  }

  return {
    minCharacterLevel: parsed.minCharacterLevel,
    abilities: (parsed.abilities ?? []).map((requirement) => ({
      anyOf: requirement.anyOf ?? [],
      minValue: requirement.minValue,
    })),
    feats: parsed.feats ?? [],
    anyDragonmark: parsed.anyDragonmark ?? false,
    classFeatures: parsed.classFeatures ?? [],
    classes: parsed.classes ?? [],
    species: parsed.species ?? [],
    backgrounds: parsed.backgrounds ?? [],
    armorProficiency: parsed.armorProficiency ?? [],
    campaign: parsed.campaign ?? '',
    custom: parsed.custom ?? '',
  };
}

/**
 * Разбирает механику, пришедшую с сервера, в состояние формы.
 *
 * Той же моделью механику хранит предыстория (`Background.mechanics`), поэтому
 * разбор вынесен из `normalizeLoadedFeat`: обе формы читают один и тот же блок
 * и должны отсеивать чужое одинаково.
 *
 * @param raw сырое значение поля `mechanics` из ответа сервера.
 * @returns механика со всеми блоками и списками; не прошедшая разбор — пустая.
 */
export function parseLoadedMechanics(raw: unknown): FeatMechanics {
  const parsed = mechanicsSchema.safeParse(raw);

  return toFeatMechanicsState(parsed.success ? parsed.data : undefined);
}

/**
 * Приводит загруженную с сервера черту к структуре формы.
 *
 * Механика и предусловие разбираются схемами; если их нет или они не прошли
 * разбор, подставляются пустые заготовки — форма всегда открывается с полной
 * структурой, а неизвестные поля не попадают в состояние.
 *
 * Здесь же собираются строки редактора: форма правит их, а не механику
 * напрямую, — механику из них пересобирает `transformFeatBeforeSubmit`.
 */
export function normalizeLoadedFeat(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const parsedPrerequisite = prerequisiteDetailsSchema.safeParse(
    raw.prerequisiteDetails,
  );

  const mechanics = parseLoadedMechanics(raw.mechanics);

  const prerequisiteDetails = toFeatPrerequisiteState(
    parsedPrerequisite.success ? parsedPrerequisite.data : undefined,
  );

  return {
    ...raw,
    mechanics,
    prerequisiteDetails,
    // Эффекты разбирает своя схема раздела: битый эффект отбрасывается
    // поштучно, а не роняет весь список
    activeEffects: normalizeLoadedActiveEffects(raw.activeEffects),
    editorRows: toFeatEditorRows(mechanics, prerequisiteDetails),
  };
}
