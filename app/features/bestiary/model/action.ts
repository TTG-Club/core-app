import type { ActiveEffect } from '~active-effects/model';
import type { DamageFormulaPart } from '~ui/damage-formula';

import { AbilityKey } from '~/shared/types';
import {
  normalizeActiveEffects,
  normalizeLoadedActiveEffects,
} from '~active-effects/model';
import {
  normalizeDamageFormulaParts,
  parseLoadedDamageFormulaParts,
} from '~ui/damage-formula';

/**
 * Тип атаки записи существа — словарь сайта. В VTTG он переводится в тип
 * дальности: рукопашная и «рукопашная или дальнобойная» уезжают `melee`.
 */
export type CreatureAttackType = 'MELEE' | 'MELEE_OR_RANGE' | 'RANGE';

/** Что происходит с уроном при успешном спасброске цели. */
export type CreatureSaveEffect = 'HALF' | 'NONE' | 'SPECIAL';

/** Спасбросок записи: характеристика и Сл плоским числом. */
export interface CreatureSavingThrow {
  ability: AbilityKey | undefined;
  dc: number | undefined;
}

/** Область воздействия записи — та же форма, что у заклинания. */
export interface CreatureAreaOfEffect {
  type: string | undefined;
  value1: number | undefined;
  value2: number | undefined;
}

/**
 * Боевая механика записи существа: действия, реакции, умения, эффекта логова.
 *
 * Тот же по смыслу объект, что `SpellEffect` у заклинания. До него бэкенд
 * выуживал бросок атаки, урон, спасбросок и область регулярками из текста
 * описания — здесь всё это задано числами.
 *
 * Формулы существа плоские: модификатор уже вшит в число («1к8 + 3»), токены
 * `@mod.*`, `@prof`, `@level` и `@classLevel` VTTG считает ошибкой — у существа
 * нет ни характеристик листа, ни уровня в классе.
 */
export interface CreatureActionEffect {
  attackType: CreatureAttackType | undefined;
  attackBonus: number | undefined;
  reach: number | undefined;
  rangeNormal: number | undefined;
  rangeLong: number | undefined;
  damageParts: Array<DamageFormulaPart>;
  savingThrows: Array<CreatureSavingThrow>;
  saveEffect: CreatureSaveEffect | undefined;
  areaOfEffect: CreatureAreaOfEffect;

  /**
   * Типы урона старых данных. Формой не показываются: они нужны разбору
   * описания на бэкенде как подсказка о типе урона. Возятся сквозь форму,
   * чтобы круг «открыл — сохранил» их не стёр у записей, которым механику ещё
   * не завели.
   */
  damageTypes: Array<string>;

  activeEffects: Array<ActiveEffect>;
}

/**
 * Создаёт пустую боевую механику записи.
 *
 * @returns механика без заполненных полей.
 */
export function createEmptyCreatureActionEffect(): CreatureActionEffect {
  return {
    attackType: undefined,
    attackBonus: undefined,
    reach: undefined,
    rangeNormal: undefined,
    rangeLong: undefined,
    damageParts: [],
    savingThrows: [],
    saveEffect: undefined,
    areaOfEffect: {
      type: undefined,
      value1: undefined,
      value2: undefined,
    },
    damageTypes: [],
    activeEffects: [],
  };
}

const ATTACK_TYPES: Array<CreatureAttackType> = [
  'MELEE',
  'RANGE',
  'MELEE_OR_RANGE',
];

const SAVE_EFFECTS: Array<CreatureSaveEffect> = ['HALF', 'NONE', 'SPECIAL'];

const ABILITY_KEYS: Array<AbilityKey> = Object.values(AbilityKey);

/** Схема механики из «сырого» ответа: битое поле не должно ронять соседние. */
const loadedActionEffectSchema = z
  .object({
    attackType: z.string().nullish().catch(null),
    attackBonus: z.number().nullish().catch(null),
    reach: z.number().nullish().catch(null),
    rangeNormal: z.number().nullish().catch(null),
    rangeLong: z.number().nullish().catch(null),
    damageParts: z.unknown().nullish().catch(null),
    savingThrows: z
      .array(
        z.object({
          ability: z.string().nullish().catch(null),
          dc: z.number().nullish().catch(null),
        }),
      )
      .nullish()
      .catch(null),
    saveEffect: z.string().nullish().catch(null),
    areaOfEffect: z
      .object({
        type: z.string().nullish().catch(null),
        value1: z.number().nullish().catch(null),
        value2: z.number().nullish().catch(null),
      })
      .nullish()
      .catch(null),
    damageTypes: z.array(z.string()).nullish().catch(null),
    activeEffects: z.unknown().nullish().catch(null),
  })
  .nullish()
  .catch(null);

/**
 * Восстанавливает боевую механику записи из ответа `/raw`.
 *
 * @param raw значение поля `effect` записи.
 * @returns механика формы; незаполненная, если поля не было.
 */
export function parseLoadedCreatureActionEffect(
  raw: unknown,
): CreatureActionEffect {
  const parsed = loadedActionEffectSchema.parse(raw);
  const empty = createEmptyCreatureActionEffect();

  if (!parsed) {
    return empty;
  }

  return {
    attackType: ATTACK_TYPES.find((type) => type === parsed.attackType),
    attackBonus: parsed.attackBonus ?? undefined,
    reach: parsed.reach ?? undefined,
    rangeNormal: parsed.rangeNormal ?? undefined,
    rangeLong: parsed.rangeLong ?? undefined,
    damageParts: parseLoadedDamageFormulaParts(parsed.damageParts),
    savingThrows: (parsed.savingThrows ?? []).map((save) => ({
      ability: ABILITY_KEYS.find((ability) => ability === save.ability),
      dc: save.dc ?? undefined,
    })),
    saveEffect: SAVE_EFFECTS.find((effect) => effect === parsed.saveEffect),
    areaOfEffect: {
      type: parsed.areaOfEffect?.type ?? undefined,
      value1: parsed.areaOfEffect?.value1 ?? undefined,
      value2: parsed.areaOfEffect?.value2 ?? undefined,
    },
    damageTypes: parsed.damageTypes ?? [],
    activeEffects: normalizeLoadedActiveEffects(parsed.activeEffects),
  };
}

/** Запись боевого блока из «сырого» ответа: всё, кроме механики, как есть. */
const loadedActionSchema = z
  .record(z.string(), z.unknown())
  .catch({})
  .transform((record) => ({
    ...record,
    effect: parseLoadedCreatureActionEffect(record.effect),
  }));

/**
 * Достраивает механику у записей боевого блока из ответа `/raw`.
 *
 * Остальные поля записи не трогаются: описание приезжает разметкой AST, и
 * пересобирать его форме нечем.
 *
 * @param raw значение списка записей (действия, умения, эффекты логова).
 * @returns записи с разобранной механикой.
 */
export function normalizeLoadedCreatureActions(raw: unknown): Array<unknown> {
  if (!Array.isArray(raw)) {
    return [];
  }

  // Array.isArray сужает unknown до any[], поэтому элементы читаются через
  // явно типизированный unknown-массив.
  const items: Array<unknown> = raw;

  return items.map((item) => loadedActionSchema.parse(item));
}

/**
 * Готовит боевую механику записи к отправке: незаполненные части и спасброски
 * отбрасываются, а область без формы — сбрасывается целиком.
 *
 * Незаполненную механику бэкенд не считает заведённой и разбирает описание
 * регулярками, как делал до её появления, — поэтому пустой объект отправлять
 * безопасно, и тип записи остаётся одним на форму и на запрос.
 *
 * @param effect механика из формы.
 * @returns механика для запроса.
 */
export function normalizeCreatureActionEffect(
  effect: CreatureActionEffect | undefined,
): CreatureActionEffect {
  if (!effect) {
    return createEmptyCreatureActionEffect();
  }

  // Форма области — единственное обязательное её поле: без неё размеры не к
  // чему приложить.
  const areaOfEffect = effect.areaOfEffect.type
    ? effect.areaOfEffect
    : createEmptyCreatureActionEffect().areaOfEffect;

  return {
    ...effect,
    damageParts: normalizeDamageFormulaParts(effect.damageParts),
    savingThrows: effect.savingThrows.filter(
      (save) => save.ability !== undefined,
    ),
    areaOfEffect,
    activeEffects: normalizeActiveEffects(effect.activeEffects),
  };
}
