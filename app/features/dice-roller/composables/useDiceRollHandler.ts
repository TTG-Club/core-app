import { inject } from 'vue';

import { useDiceRoller, useDiceRollerState } from '.';
import {
  extractDiceRollDetails,
  extractRollValue,
  formatDiceDetailsSummary,
} from '../utils';

/**
 * Composable для обработки бросков кубов.
 * Инкапсулирует логику валидации, выполнения броска, обновления состояния и уведомлений.
 *
 * @returns Функция handleRoll для выполнения броска по указанной нотации
 */
export function useDiceRollHandler() {
  const toast = useToast();
  const { validateWithError, roll } = useDiceRoller();

  const {
    isOpen,
    result,
    details,
    incrementResultKey,
    addHistoryEntry,
    notifyTableRoll,
  } = useDiceRollerState();

  const tableId = inject<string | undefined>('dice-roller:table-id', undefined);

  /**
   * Обрабатывает бросок кубов по указанной нотации.
   *
   * @param notation - Нотация броска (например, "1d20", "2d6+3")
   * @returns выпавшее число; null — нотация пустая, неверная или бросок не дал
   * числа.
   */
  function handleRoll(notation: string): number | null {
    if (!notation || notation.trim().length === 0) {
      return null;
    }

    const { valid, error } = validateWithError(notation);

    if (!valid) {
      if (!isOpen.value) {
        toast.add({
          color: 'error',
          icon: 'ttg:dice-outline-d20',
          title: 'Некорректная нотация броска',
          description: error ?? 'Проверь формат записи броска.',
        });
      }

      addHistoryEntry({
        formula: notation,
        value: error ?? 'Некорректная нотация',
        isError: true,
      });

      return null;
    }

    const rollResult = roll(notation);
    const numericValue = extractRollValue(rollResult);

    const displayValue = Number.isFinite(numericValue)
      ? numericValue.toLocaleString('ru-RU')
      : String(numericValue);

    const rollDetails = extractDiceRollDetails(rollResult);

    if (!isOpen.value) {
      toast.add({
        color: 'neutral',
        title: `Бросок ${notation}`,
        icon: 'ttg:dice-outline-d20',
        description: () =>
          h('span', [
            `Результат: `,
            h('span', { class: 'font-bold text-link' }, displayValue),
          ]),
      });
    }

    result.value = displayValue;
    details.value = [];

    incrementResultKey();

    addHistoryEntry({
      formula: notation,
      value: displayValue,
      isError: false,
      detail: formatDiceDetailsSummary(rollDetails),
      structuredDetails: rollDetails,
    });

    if (!Number.isFinite(numericValue)) {
      return null;
    }

    // Столу и вызывающему уходит одно и то же целое число
    const roundedValue = Math.round(numericValue);

    notifyTableRoll(roundedValue, tableId);

    return roundedValue;
  }

  return {
    handleRoll,
  };
}
