import { z } from 'zod';

import { createFeatMechanics, createPrerequisiteDetails } from './mechanics';

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

const abilityKeySchema = z.enum([
  'STRENGTH',
  'DEXTERITY',
  'CONSTITUTION',
  'INTELLIGENCE',
  'WISDOM',
  'CHARISMA',
]);

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

const spellFilterSchema = z.object({
  level: z.number().optional(),
  maxLevel: z.number().optional(),
  schools: z.array(z.string()).optional(),
  classes: z.array(entityRefSchema).optional(),
  classesFromChoiceKey: z.string().optional(),
  castingTime: z.string().optional(),
});

const choiceSchema = z.object({
  key: z.string().optional(),
  type: z
    .enum([
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
      'OPTION',
    ])
    .optional(),
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

const damageAffinitySchema = z.object({
  resistances: z.array(z.string()).optional(),
  immunities: z.array(z.string()).optional(),
  vulnerabilities: z.array(z.string()).optional(),
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
  initiativeProficiencyBonus: z.boolean().optional(),
});

const proficiencyGrantSchema = z.object({
  weaponCategories: z.array(z.string()).optional(),
  armorCategories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  tools: z.array(entityRefSchema).optional(),
});

const spellGrantSchema = z.object({
  spells: z.array(entityRefSchema).optional(),
  spellcastingAbility: abilityKeySchema.optional(),
  alwaysPrepared: z.boolean().optional(),
});

const mechanicsSchema = z.object({
  abilityBonuses: z.array(abilityBonusSchema).optional(),
  choices: z.array(choiceSchema).optional(),
  modifiers: modifiersSchema.optional(),
  proficiencies: proficiencyGrantSchema.optional(),
  spells: spellGrantSchema.optional(),
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
 * Приводит загруженную с сервера черту к структуре формы.
 *
 * Механика и предусловие разбираются схемами; если их нет или они не прошли
 * разбор, подставляются пустые заготовки — форма всегда открывается с полной
 * структурой, а неизвестные поля не попадают в состояние.
 */
export function normalizeLoadedFeat(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const mechanics = mechanicsSchema.safeParse(raw.mechanics);

  const prerequisiteDetails = prerequisiteDetailsSchema.safeParse(
    raw.prerequisiteDetails,
  );

  return {
    ...raw,
    mechanics: mechanics.success ? mechanics.data : createFeatMechanics(),
    prerequisiteDetails: prerequisiteDetails.success
      ? prerequisiteDetails.data
      : createPrerequisiteDetails(),
  };
}
