import type { ChatDiceGroup } from '../model';

import { useDiceRoller } from '~dice-roller/composables';
import { extractDiceRollDetails, extractRollValue } from '~dice-roller/utils';

/** Разобранный бросок, готовый к отправке в ленту. */
export interface RolledDice {
  /** Формула, как её набрал игрок. */
  expression: string;
  total: number;
  /** Что выпало на кубах, по группам одного вида. */
  groups: Array<ChatDiceGroup>;

  /** Чем бросали: оружие, навык, характеристика. */
  subject?: string;
}

/**
 * Бросок для чата комнаты.
 *
 * Считает роллер сайта — тот же, что и в справочнике: он знает всю нотацию,
 * включая «2к20вл1», перебросы и скобки. Сервис результат не пересчитывает:
 * второй разбор на Java неизбежно разошёлся бы с этим в мелочах, а за столом
 * бросок и так держится на доверии группы.
 */
export function useNexusDice() {
  const { roll, validateWithError } = useDiceRoller();

  /**
   * Похожа ли строка на формулу броска.
   *
   * Одного согласия роллера мало: он считает выражением и «5», и «2+2», а
   * такие сообщения — обычный текст. Формулой считается только то, где есть
   * куб.
   *
   * @param text Текст сообщения.
   */
  function looksLikeDice(text: string): boolean {
    const trimmed = text.trim();

    return (
      /^[\d\s()+\-*/<>=]*[кkдd]/i.test(trimmed)
      && validateWithError(trimmed).valid
    );
  }

  /**
   * Бросает формулу.
   *
   * @param expression Формула в нотации сайта.
   * @returns Результат броска или `null`, если формулу не удалось разобрать.
   */
  function rollExpression(expression: string): RolledDice | null {
    const trimmed = expression.trim();

    if (!validateWithError(trimmed).valid) {
      return null;
    }

    const result = roll(trimmed);
    const total = extractRollValue(result);

    if (!Number.isFinite(total)) {
      return null;
    }

    // Кубы уходят в ленту поштучно: игрок должен видеть, что выпало на
    // каждом, а не только сумму — по ним и читается итог.
    const groups = extractDiceRollDetails(result).map((detail) => ({
      label: detail.label,
      rolls: detail.rolls.map((die) => ({
        value: die.value,
        valid: die.valid,
        critical: die.critical ?? null,
      })),
    }));

    return { expression: trimmed, total, groups };
  }

  return { looksLikeDice, rollExpression };
}
