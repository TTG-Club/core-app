import type { CriticalType, DiceDetail, DiceRollItem } from './types';

/**
 * Внутренний интерфейс для информации о количестве кубов.
 */
interface DieCountInfo {
  value?: number;
}

/**
 * Внутренний интерфейс для информации о типе куба.
 */
interface DieTypeInfo {
  type?: string;
  value?: number;
}

/**
 * Интерфейс с информацией о броске куба.
 */
interface DieRollInfo {
  count?: DieCountInfo;
  die?: DieTypeInfo;
  label?: string;
}

/**
 * Внутренний интерфейс, представляющий узел куба из результата dice-roller-parser.
 * Содержит информацию о типе куба, количестве, результатах отдельных бросков
 * и вычисленных значениях.
 */
interface DieNode extends DieRollInfo {
  type: 'die';
  order?: number;
  value?: number;
  rolls?: Array<{
    value?: number;
    valid?: boolean;
    critical?: CriticalType | undefined;
  }>;
}

/**
 * Проверяет, является ли значение непустым объектом.
 * Используется для сужения типов при обработке результатов бросков.
 *
 * @param value - Значение для проверки
 * @returns true, если значение является непустым объектом
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Проверяет, является ли узел узлом куба из dice-roller-parser.
 * Узлы кубов имеют type === 'die' и содержат массив rolls.
 *
 * @param node - Узел для проверки
 * @returns true, если узел является DieNode
 */
function isDieNode(node: unknown): node is DieNode {
  return (
    isPlainObject(node) && node.type === 'die' && Array.isArray(node.rolls)
  );
}

/**
 * Извлекает массив кубов из узла броска, если он присутствует.
 *
 * @param node - Узел для извлечения кубов
 * @returns Массив кубов или null, если отсутствует
 */
function extractDiceArray(node: unknown): unknown[] | null {
  if (!isPlainObject(node)) {
    return null;
  }

  const dice = node.dice;

  return Array.isArray(dice) ? dice : null;
}

/**
 * Извлекает узел выражения из узла броска, если он присутствует.
 *
 * @param node - Узел для извлечения выражения
 * @returns Узел выражения или null, если отсутствует
 */
function extractExpression(node: unknown): unknown | null {
  if (!isPlainObject(node)) {
    return null;
  }

  return node.expr ?? null;
}

/**
 * Генерирует человекочитаемую метку для броска куба в русской нотации.
 * Преобразует вывод dice-roller-parser в знакомую D&D нотацию (например, "2к6", "к20").
 *
 * @param roll - Объект броска с информацией о количестве и типе куба
 * @param rollIndex - Индекс броска (используется для запасной метки)
 * @returns Строковая метка вида "к20", "2к6" или "Бросок N" как запасной вариант
 *
 * @example
 * // Вернёт "2к6"
 * createDieLabel({ count: { value: 2 }, die: { type: 'number', value: 6 } }, 0)
 *
 * @example
 * // Вернёт "к20"
 * createDieLabel({ count: { value: 1 }, die: { type: 'number', value: 20 } }, 0)
 */
export function createDieLabel(roll: DieRollInfo, rollIndex: number): string {
  const countValue = roll.count?.value;
  const dieType = roll.die?.type;

  let suffix = '?';

  if (dieType === 'fate') {
    suffix = 'кс';
  } else if (dieType === 'number') {
    const dieValue = roll.die?.value;

    if (dieValue === 100) {
      suffix = 'к100';
    } else if (typeof dieValue === 'number') {
      suffix = `к${dieValue}`;
    }
  }

  if (suffix === '?' && roll.label) {
    return roll.label.replace(/d%/i, 'к100').replace('%', '100');
  }

  if (typeof countValue === 'number') {
    return `${countValue}${suffix}`;
  }

  return `Бросок ${rollIndex + 1}`;
}

/**
 * Извлекает структурированные детали броска из результата dice-roller-parser.
 * Рекурсивно обходит дерево броска для поиска всех узлов кубов и
 * собирает информацию о каждом отдельном броске.
 *
 * @param rollResult - Сырой результат из dice-roller-parser
 * @returns Массив объектов DiceDetail со структурированной информацией о бросках
 *
 * @example
 * const roll = diceRoller.roll('2к6+3');
 * const details = extractDiceRollDetails(roll);
 * // Вернёт: [{ id: '0-0', label: '2к6', total: 8, rolls: [...] }]
 */
export function extractDiceRollDetails(rollResult: unknown): DiceDetail[] {
  const details: DiceDetail[] = [];

  const traverseNode = (node: unknown, nodeIndex: string | number = 0) => {
    if (!isPlainObject(node)) {
      return;
    }

    if (isDieNode(node)) {
      details.push({
        id: `${nodeIndex}-${node.order}`,
        label: createDieLabel(node, details.length),
        total: node.value ?? 0,
        rolls: (node.rolls ?? []).map(
          (rollItem, rollItemIndex: number): DiceRollItem => ({
            id: `${nodeIndex}-${rollItemIndex}`,
            value: rollItem?.value ?? 0,
            valid: Boolean(rollItem?.valid),
            critical: (rollItem?.critical as CriticalType | undefined) ?? null,
          }),
        ),
      });

      return;
    }

    const diceArray = extractDiceArray(node);

    if (diceArray) {
      diceArray.forEach((child: unknown, childIndex: number) =>
        traverseNode(child, `${nodeIndex}-${childIndex}`),
      );
    }

    const expression = extractExpression(node);

    if (expression) {
      traverseNode(expression, `${nodeIndex}-expr`);
    }
  };

  traverseNode(rollResult);

  return details;
}

/**
 * Форматирует детали бросков кубов в человекочитаемую строку-сводку.
 * Создаёт список бросков через разделитель с их валидными значениями.
 *
 * @param details - Массив объектов DiceDetail для форматирования
 * @returns Отформатированная строка вида "к20: 15 | 2к6: 3 + 5"
 *
 * @example
 * const summary = formatDiceDetailsSummary(details);
 * // Вернёт: "к20: 15 | 2к6: 3 + 5"
 */
export function formatDiceDetailsSummary(details: DiceDetail[]): string {
  const formattedChunks = details
    .map((detail) => {
      const validRolls = detail.rolls
        .filter((rollItem) => rollItem.valid)
        .map((rollItem) => rollItem.value)
        .join(' + ');

      return validRolls ? `${detail.label}: ${validRolls}` : '';
    })
    .filter(Boolean);

  return formattedChunks.join(' | ');
}

/**
 * Извлекает числовое значение из результата dice-roller-parser.
 *
 * @param rollResult - Сырой результат из dice-roller-parser
 * @returns Числовое значение или NaN, если недоступно
 *
 * @example
 * const roll = diceRoller.roll('2к6+3');
 * const value = extractRollValue(roll);
 * // Вернёт: 11 (или какой-либо другой результат броска)
 */
export function extractRollValue(rollResult: unknown): number {
  if (!isPlainObject(rollResult)) {
    return Number.NaN;
  }

  const value = rollResult.value;

  return typeof value === 'number' ? value : Number.NaN;
}
