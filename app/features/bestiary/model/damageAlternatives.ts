import type {
  DamageFormulaPart,
  DamageFormulaStatusSide,
  DamageFormulaStatusToken,
} from '~ui/damage-formula';

import {
  createEmptyDamageFormulaPart,
  getDamageFormulaStatusName,
  listDamageFormulaStatusTokens,
  normalizeDamageFormulaParts,
  parseLoadedDamageFormulaParts,
} from '~ui/damage-formula';

/**
 * Урон «или» у действия существа: другие наборы частей урона, каждый ЗАМЕНЯЕТ
 * основной целиком. «20 (4к8 + 2), или 11 (2к8 + 2), если рой окровавлен» —
 * основной урон `4к8@dmg.necrotic + 2` и вариант
 * `2к8@dmg.necrotic@self.status.bloodied + 2`.
 *
 * Зеркало `creatureDamageAlternatives.ts` системы VTTG: условие варианта —
 * состояние в его формуле; такой вариант берётся сам, когда все его состояния
 * есть. Способ выбора нужен вариантам без состояний.
 *
 * Способы:
 * - `formula` — «по формуле»: вариант решают состояния в формуле; без них не
 *   берётся никогда (вариант не дописан);
 * - `ask` — решает бросающий («если у химеры было преимущество»);
 * - `random` — набор выпадает сам.
 */
export const CREATURE_DAMAGE_CONDITIONS = ['formula', 'ask', 'random'] as const;

/** Способ выбора варианта урона. */
export type CreatureDamageCondition =
  (typeof CREATURE_DAMAGE_CONDITIONS)[number];

/** Способ «по формуле»: вариант решают состояния в его формуле. */
const FORMULA_CREATURE_DAMAGE_CONDITION: CreatureDamageCondition = 'formula';

/**
 * Предел вариантов у одного действия. Статблоки 2024 года обходятся одним;
 * предел нужен против мусорных данных, а не против автора.
 */
export const MAX_CREATURE_DAMAGE_ALTERNATIVES = 5;

/** Подписи способов выбора — как в окне действия системы. */
export const CREATURE_DAMAGE_CONDITION_LABELS: Record<
  CreatureDamageCondition,
  string
> = {
  formula: 'По формуле',
  ask: 'Выбрать при броске',
  random: 'Случайно',
};

/** Начало строки варианта с состоянием: дальше идёт его условие. */
const CREATURE_DAMAGE_AUTOMATIC_PREFIX = 'Берётся сам — ';

/** Начало фразы по состоянию стороны: «если у атакующего: Окровавленный». */
const CREATURE_DAMAGE_STATUS_PHRASE_PREFIXES: Record<
  DamageFormulaStatusSide,
  string
> = {
  self: 'если у атакующего: ',
  target: 'если у цели: ',
};

/** Между состояниями в одной фразе. */
const CREATURE_DAMAGE_STATUS_PHRASE_JOINER = ' и ';

/** Вариант урона действия существа. */
export interface CreatureDamageAlternative {
  /** Как выбирается вариант; состояние в формуле главнее способа. */
  condition: CreatureDamageCondition;

  /**
   * Своя подпись варианта («С преимуществом»). Ключ обязателен, как у частей
   * урона: необязательный ключ то появлялся бы, то исчезал. В форме пустая
   * строка — «подписи нет»; при отправке пустая становится `undefined` и в
   * запрос не попадает.
   */
  label: string | undefined;

  /** Части урона варианта — целый набор вместо основного. */
  damageParts: Array<DamageFormulaPart>;
}

/**
 * Схема варианта из «сырого» ответа. Каждый проверяется отдельно: битый
 * (незнакомый способ, нет частей) выпадает, соседние остаются.
 */
const loadedDamageAlternativeSchema = z.object({
  condition: z.enum(CREATURE_DAMAGE_CONDITIONS),
  label: z.string().nullish().catch(null),
  damageParts: z.array(z.unknown()),
});

/**
 * Разбирает один вариант из «сырого» ответа.
 *
 * @param loadedAlternative вариант, как его хранит бэкенд.
 * @returns вариант формы; пусто — вариант битый или без частей.
 */
function parseLoadedCreatureDamageAlternative(
  loadedAlternative: unknown,
): Array<CreatureDamageAlternative> {
  const alternativeResult =
    loadedDamageAlternativeSchema.safeParse(loadedAlternative);

  if (!alternativeResult.success) {
    return [];
  }

  const damageParts = parseLoadedDamageFormulaParts(
    alternativeResult.data.damageParts,
  );

  if (damageParts.length === 0) {
    return [];
  }

  return [
    {
      condition: alternativeResult.data.condition,
      label: alternativeResult.data.label ?? '',
      damageParts,
    },
  ];
}

/**
 * Варианты урона из ответа `/raw`.
 *
 * @param loadedAlternatives значение поля `damageAlternatives` механики.
 * @returns варианты формы, не больше предела; пусто — вариантов нет.
 */
export function parseLoadedCreatureDamageAlternatives(
  loadedAlternatives: unknown,
): Array<CreatureDamageAlternative> {
  if (!Array.isArray(loadedAlternatives)) {
    return [];
  }

  // Array.isArray сужает unknown до any[], поэтому элементы читаются через
  // явно типизированный unknown-массив.
  const loadedAlternativeList: Array<unknown> = loadedAlternatives;

  return loadedAlternativeList
    .flatMap(parseLoadedCreatureDamageAlternative)
    .slice(0, MAX_CREATURE_DAMAGE_ALTERNATIVES);
}

/**
 * Готовит варианты к отправке: пустые части отбрасываются, вариант без частей
 * — целиком; подпись обрезается, пустая не пишется.
 *
 * @param alternatives варианты из формы.
 * @returns варианты для запроса.
 */
export function normalizeCreatureDamageAlternatives(
  alternatives: Array<CreatureDamageAlternative>,
): Array<CreatureDamageAlternative> {
  return alternatives.flatMap((alternative) => {
    const damageParts = normalizeDamageFormulaParts(alternative.damageParts);

    if (damageParts.length === 0) {
      return [];
    }

    return [
      {
        condition: alternative.condition,
        label: alternative.label?.trim() || undefined,
        damageParts,
      },
    ];
  });
}

/**
 * Состояния из формул варианта — его условие. Каждое один раз, в порядке
 * первого появления.
 *
 * @param damageParts части урона варианта.
 * @returns состояния сторон, которые требует вариант.
 */
function listCreatureDamageAlternativeStatuses(
  damageParts: Array<DamageFormulaPart>,
): Array<DamageFormulaStatusToken> {
  return listDamageFormulaStatusTokens(damageParts.map((part) => part.formula));
}

/**
 * Строка варианта с состояниями: «Берётся сам — если у атакующего:
 * Окровавленный»; несколько состояний — через « и ».
 *
 * @param statuses состояния варианта.
 * @returns строка условия.
 */
function describeCreatureDamageStatuses(
  statuses: Array<DamageFormulaStatusToken>,
): string {
  const statusPhrase = statuses
    .map(
      (statusToken) =>
        `${CREATURE_DAMAGE_STATUS_PHRASE_PREFIXES[statusToken.side]}${getDamageFormulaStatusName(statusToken.status)}`,
    )
    .join(CREATURE_DAMAGE_STATUS_PHRASE_JOINER);

  return `${CREATURE_DAMAGE_AUTOMATIC_PREFIX}${statusPhrase}`;
}

/** Что показать у варианта в форме. */
export interface CreatureDamageAlternativeView {
  /** Состояние в формуле — вариант берётся сам, способ ему не нужен. */
  isAutomatic: boolean;
  /** Строка «Берётся сам — …»; пустая без состояний. */
  automaticCaption: string;
  /** «По формуле», а состояния в формуле нет — вариант не сработает. */
  lacksStatus: boolean;
  /** Состояние цели у действия с областью: одной цели там нет. */
  warnsArea: boolean;
  /** Подпись для поля ввода: пустая строка — подписи нет. */
  labelText: string;
}

/**
 * Разбирает вариант для показа в форме.
 *
 * @param alternative вариант урона.
 * @param hasArea у действия задана область.
 * @returns признаки показа варианта.
 */
export function getCreatureDamageAlternativeView(
  alternative: CreatureDamageAlternative,
  hasArea: boolean,
): CreatureDamageAlternativeView {
  const statuses = listCreatureDamageAlternativeStatuses(
    alternative.damageParts,
  );

  const isAutomatic = statuses.length > 0;

  return {
    isAutomatic,
    automaticCaption: isAutomatic
      ? describeCreatureDamageStatuses(statuses)
      : '',
    lacksStatus:
      !isAutomatic
      && alternative.condition === FORMULA_CREATURE_DAMAGE_CONDITION,
    warnsArea:
      hasArea && statuses.some((statusToken) => statusToken.side === 'target'),
    labelText: alternative.label ?? '',
  };
}

/**
 * Новый вариант: способ «по формуле», части — копия основного урона
 * (непустые), без основного — одна пустая часть. Вариант заменяет основной
 * урон целиком, поэтому автору остаётся лишь поправить кости.
 *
 * @param baseParts основной урон действия.
 * @returns вариант для формы.
 */
export function createCreatureDamageAlternative(
  baseParts: Array<DamageFormulaPart>,
): CreatureDamageAlternative {
  const copiedParts = baseParts
    .filter((part) => part.formula.trim().length > 0)
    .map((part) => ({ ...part }));

  return {
    condition: FORMULA_CREATURE_DAMAGE_CONDITION,
    label: '',
    damageParts:
      copiedParts.length > 0 ? copiedParts : [createEmptyDamageFormulaPart()],
  };
}

/**
 * Заменяет части урона варианта. Появилось состояние в формуле — способ сам
 * становится «по формуле»: вариант теперь решает состояние, и прежний способ
 * лишь путал бы, всплыв после того, как состояние уберут.
 *
 * @param alternative вариант урона.
 * @param damageParts новые части.
 * @returns вариант с новыми частями.
 */
export function replaceCreatureDamageAlternativeParts(
  alternative: CreatureDamageAlternative,
  damageParts: Array<DamageFormulaPart>,
): CreatureDamageAlternative {
  const condition =
    listCreatureDamageAlternativeStatuses(damageParts).length > 0
      ? FORMULA_CREATURE_DAMAGE_CONDITION
      : alternative.condition;

  return { ...alternative, condition, damageParts };
}

/** Способы выбора для проверки значения без типа. */
const CREATURE_DAMAGE_CONDITION_SET: ReadonlySet<unknown> = new Set(
  CREATURE_DAMAGE_CONDITIONS,
);

/**
 * Проверяет, что значение — способ выбора варианта. Выпадающий список отдаёт
 * значение без типа.
 *
 * @param selectedCondition выбранное в списке значение.
 * @returns `true`, если значение — известный способ.
 */
export function isCreatureDamageCondition(
  selectedCondition: unknown,
): selectedCondition is CreatureDamageCondition {
  return CREATURE_DAMAGE_CONDITION_SET.has(selectedCondition);
}
