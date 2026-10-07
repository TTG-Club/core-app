/**
 * Условие по типу существа: тип носителя, цели, атакующего или того, кто
 * вызвал спасбросок, — из списка или вне его.
 *
 * Одного типа мало («Защита от зла и добра» — аберрация, небожитель,
 * элементаль, фея, исчадие, нежить), поэтому условие пишется списком в кавычках
 * через запятую, а «не из списка» — оператором `!==`:
 *
 * - `target.creatureType === "undead, fiend"` — цель нежить или исчадие;
 * - `self.creatureType !== "construct, undead"` — носитель не конструкт и не
 *   нежить;
 * - `incoming.attackerCreatureType === "aberration, celestial"` — атакует
 *   аберрация или небожитель;
 * - `source.creatureType === "fiend, undead"` — спасбросок вызвало исчадие или
 *   нежить.
 *
 * Список может быть не записан заранее, а взят из выбора владельца эффекта:
 * `target.creatureType === "@choice.monster-manual"` — типы, выбранные в
 * «Гримуаре монстров». Токен подставляет лист владельца в VTTG; пока он не
 * подставлен, условие не выполняется.
 *
 * Одиночный тип (`=== "undead"`) — тот же список из одного.
 *
 * Зеркало: dnd5-test-migrate/src/engine/creatureTypeCondition.ts
 */

import {
  CONDITION_LIST_SEPARATOR,
  readChoiceKey,
  splitConditionList,
  stripListQuotes,
  writeChoiceToken,
} from './conditionSyntax';
import { isEffectCreatureCategory } from './constants';

/** О ком условие: носитель, цель броска, атакующий у защиты, источник спасброска. */
export const CREATURE_TYPE_CONDITION_SUBJECTS = [
  'self.creatureType',
  'target.creatureType',
  'incoming.attackerCreatureType',
  'source.creatureType',
] as const;

/** О ком условие по типу существа. */
export type CreatureTypeConditionSubject =
  (typeof CREATURE_TYPE_CONDITION_SUBJECTS)[number];

/** Разобранное условие по типу существа. */
export interface CreatureTypeCondition {
  /** Ключи типов по порядку, без повторов. */
  types: string[];
  /** «Не из списка». */
  negate: boolean;
  /**
   * Ключ выбора владельца, из которого берётся список (токен `@choice.` с
   * ключом). Задан — список ещё не подставлен, и типов в условии нет.
   */
  choiceKey?: string;
}

/** Субъект условия по типу вместе с самим условием. */
export interface SubjectCreatureTypeCondition {
  /** О ком условие. */
  subject: CreatureTypeConditionSubject;
  /** Типы и отрицание. */
  condition: CreatureTypeCondition;
}

/** Разделитель типов внутри кавычек — общий для всего словаря условий. */
export const CREATURE_TYPE_LIST_SEPARATOR = CONDITION_LIST_SEPARATOR;

/** Оператор «из списка». */
const IN_OPERATOR = '===';

/** Оператор «не из списка». */
const NOT_IN_OPERATOR = '!==';

/**
 * Типы списка из значения: `"undead, fiend"` без кавычек. Пустые места
 * пропускаются.
 *
 * @param listText список типов через запятую; нет — типов нет.
 * @returns ключи типов по порядку.
 */
export function splitCreatureTypeList(listText: string | undefined): string[] {
  return splitConditionList(listText ?? '');
}

/**
 * Список типов строкой — в той же записи, что у условий модификаторов.
 *
 * @param types ключи типов.
 * @returns значение списка без кавычек.
 */
export function joinCreatureTypeList(types: readonly string[]): string {
  return types.join(`${CREATURE_TYPE_LIST_SEPARATOR} `);
}

/**
 * Годится ли значение как список типов: хоть один тип и все из словаря.
 *
 * @param listText список типов через запятую.
 * @returns `true`, если список непустой и все типы знакомы.
 */
export function isCreatureTypeList(listText: string): boolean {
  const types = splitCreatureTypeList(listText);

  return types.length > 0 && types.every(isEffectCreatureCategory);
}

/**
 * Разбирает часть условия по типу существа о заданном субъекте.
 *
 * @param part часть условия.
 * @param subject о ком условие.
 * @returns условие либо `undefined`, если часть о другом или тип незнакомый.
 */
function parseSubjectCondition(
  part: string,
  subject: CreatureTypeConditionSubject,
): CreatureTypeCondition | undefined {
  const trimmedPart = part.trim();

  if (!trimmedPart.startsWith(`${subject} `)) {
    return undefined;
  }

  const operatorAndList = trimmedPart.slice(subject.length).trim();

  const operator = [IN_OPERATOR, NOT_IN_OPERATOR].find((candidate) =>
    operatorAndList.startsWith(candidate),
  );

  if (!operator) {
    return undefined;
  }

  const quotedList = stripListQuotes(operatorAndList.slice(operator.length));
  const negate = operator === NOT_IN_OPERATOR;
  const choiceKey = readChoiceKey(quotedList);

  // Список — выбор владельца, который лист ещё не подставил
  if (choiceKey !== undefined) {
    return { types: [], negate, choiceKey };
  }

  const listText = quotedList.toLowerCase();

  // Незнакомый тип делает непонятым всё условие: молча выкинутый тип сузил
  // бы список, и условие срабатывало бы не там, где задумано
  if (!isCreatureTypeList(listText)) {
    return undefined;
  }

  return { types: [...new Set(splitCreatureTypeList(listText))], negate };
}

/**
 * Разбирает часть условия по типу существа о любом субъекте.
 *
 * @param part часть условия.
 * @returns субъект и условие либо `undefined`.
 */
export function parseCreatureTypeCondition(
  part: string,
): SubjectCreatureTypeCondition | undefined {
  for (const subject of CREATURE_TYPE_CONDITION_SUBJECTS) {
    const condition = parseSubjectCondition(part, subject);

    if (condition) {
      return { subject, condition };
    }
  }

  return undefined;
}

/**
 * Часть условия по типу существа строкой словаря.
 *
 * @param subject о ком условие.
 * @param condition типы и отрицание.
 * @returns часть условия.
 */
export function writeCreatureTypeCondition(
  subject: CreatureTypeConditionSubject,
  condition: CreatureTypeCondition,
): string {
  const operator = condition.negate ? NOT_IN_OPERATOR : IN_OPERATOR;

  const listText = condition.choiceKey
    ? writeChoiceToken(condition.choiceKey)
    : joinCreatureTypeList(condition.types);

  return `${subject} ${operator} "${listText}"`;
}

/**
 * Можно ли записать условие: в нём есть типы или ключ выбора владельца.
 * Условие без того и другого не разобралось бы обратно.
 *
 * @param condition типы, отрицание и ключ выбора.
 * @returns `true`, если условию есть что сверять.
 */
export function isWritableCreatureTypeCondition(
  condition: CreatureTypeCondition,
): boolean {
  return condition.types.length > 0 || Boolean(condition.choiceKey);
}

/**
 * Субъект условия по типу, если значение — это он сам: пункт списка
 * «Действует», у которого типы выбираются вторым полем.
 *
 * @param conditionValue значение пункта.
 * @returns субъект либо `undefined`, если пункт о другом.
 */
export function findCreatureTypeConditionSubject(
  conditionValue: string,
): CreatureTypeConditionSubject | undefined {
  return CREATURE_TYPE_CONDITION_SUBJECTS.find(
    (subject) => subject === conditionValue,
  );
}
