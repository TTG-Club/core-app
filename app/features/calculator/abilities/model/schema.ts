import type {
  CalculatorAbilitiesBackground,
  CalculatorAbilitiesClass,
  CalculatorAbilitiesFeat,
} from './types';

import { z } from 'zod';

import { AbilityKey } from '~/shared/types';

/**
 * Источник записи. Калькулятору нужен только ярлык книги, но форма разобрана
 * целиком: `catch` на каждом поле не даёт записи выпасть из списка из-за
 * недостающей страницы или группы.
 */
const sourceSchema = z
  .object({
    name: z
      .object({
        rus: z.string().catch(''),
        eng: z.string().catch(''),
        label: z.string().catch(''),
      })
      .catch({ rus: '', eng: '', label: '' }),
    group: z
      .object({
        rus: z.string().catch(''),
        label: z.string().catch(''),
      })
      .catch({ rus: '', label: '' }),
    page: z.number().catch(0),
  })
  .catch({
    name: { rus: '', eng: '', label: '' },
    group: { rus: '', label: '' },
    page: 0,
  });

/** Название записи: русское и английское. */
const nameSchema = z
  .object({
    rus: z.string().catch(''),
    eng: z.string().catch(''),
  })
  .catch({ rus: '', eng: '' });

const abilityKeySchema = z.enum(AbilityKey);

/**
 * Прибавка характеристик от классового умения: с какого уровня она доступна,
 * насколько поднимает характеристику и до какого предела.
 */
const classAbilityBonusSchema = z.object({
  abilities: z.array(abilityKeySchema).catch([]),
  bonus: z.number().catch(0),
  upto: z.number().catch(0),
  level: z.number().catch(0),
});

/**
 * Схема пункта `GET /api/v2/classes/ability-improvement`. `looseObject`
 * сохраняет поля, которых схема не знает, а уровни получения черт и шаблон
 * характеристик гасятся `catch`: класс без них остаётся в списке и просто
 * отдаёт стандартные уровни.
 */
const classSchema = z.looseObject({
  url: z.string(),
  name: nameSchema,
  updatedAt: z.string().catch(''),
  createdAt: z.string().catch(''),
  levels: z.array(z.number()).catch([]),
  source: sourceSchema,
  abilityBonus: z.array(classAbilityBonusSchema).optional().catch(undefined),
  abilityTemplate: z.array(z.number()).optional().catch(undefined),
});

/**
 * Схема пункта `GET /api/v2/backgrounds/select`. Характеристики приходят
 * строками в верхнем регистре (`STRENGTH`); нераспознанные значения отсеивает
 * уже сам селект, поэтому схема их не сужает.
 */
const backgroundSchema = z.looseObject({
  url: z.string(),
  name: nameSchema,
  abilityScores: z.array(z.string()).nullable().catch(null),
  source: sourceSchema,
});

/** Вариант повышения характеристик из механики черты. */
const featAbilityBonusSchema = z.looseObject({
  abilities: z.array(z.string()).nullish().catch(null),
  bonus: z.number().nullish().catch(null),
  upto: z.number().nullish().catch(null),
  count: z.number().nullish().catch(null),
});

/**
 * Схема пункта `GET /api/v2/feats/select`. Механика размечена не у всех черт,
 * поэтому и она, и плоская проекция характеристик необязательны — черта без
 * них выбирается, просто не даёт прибавки.
 */
const featSchema = z.looseObject({
  url: z.string(),
  category: z.string().catch(''),
  prerequisite: z.string().nullable().catch(null),
  repeatability: z.boolean().catch(false),
  abilities: z.array(z.string()).nullable().catch(null),
  abilityScoreIncreaseOptions: z.number().nullable().catch(null),
  mechanics: z
    .looseObject({
      abilityBonuses: z.array(featAbilityBonusSchema).nullish().catch(null),
    })
    .nullish()
    .catch(null),
  source: sourceSchema,
  name: z
    .object({
      rus: z.string().catch(''),
      eng: z.string().catch(''),
      alt: z.array(z.string()).nullish().catch(null),
    })
    .catch({ rus: '', eng: '', alt: null }),
});

/**
 * Разбирает список записей раздела. Запись без `url` опознать нечем — её
 * нечем ни отличить, ни открыть, поэтому она отбрасывается, а весь список
 * из-за неё не пропадает.
 *
 * @param input сырой ответ списочной ручки.
 * @param itemSchema схема одной записи раздела.
 * @returns записи в порядке, полученном от API.
 */
function parseList<Item>(input: unknown, itemSchema: z.ZodType<Item>): Item[] {
  const rawItems = z.array(z.unknown()).catch([]).parse(input);

  return rawItems.flatMap((rawItem) => {
    const parsedItem = itemSchema.safeParse(rawItem);

    return parsedItem.success ? [parsedItem.data] : [];
  });
}

/**
 * Валидирует ответ `GET /api/v2/classes/ability-improvement`.
 *
 * @param input сырой ответ ручки классов.
 * @returns классы с уровнями получения черт.
 */
export function parseCalculatorClasses(
  input: unknown,
): Array<CalculatorAbilitiesClass> {
  return parseList(input, classSchema);
}

/**
 * Валидирует ответ `GET /api/v2/backgrounds/select`.
 *
 * @param input сырой ответ ручки предысторий.
 * @returns предыстории с характеристиками на выбор.
 */
export function parseCalculatorBackgrounds(
  input: unknown,
): Array<CalculatorAbilitiesBackground> {
  return parseList(input, backgroundSchema);
}

/**
 * Валидирует ответ `GET /api/v2/feats/select`.
 *
 * @param input сырой ответ ручки черт.
 * @returns черты с механикой прибавок к характеристикам.
 */
export function parseCalculatorFeats(
  input: unknown,
): Array<CalculatorAbilitiesFeat> {
  return parseList(input, featSchema);
}
