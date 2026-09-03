import { inject } from 'vue';

import { useDiceRoller, useDiceRollerState, useDiceRollSink } from '.';
import {
  extractDiceRollDetails,
  extractRollValue,
  formatDiceDetailsSummary,
} from '../utils';

/** Подписи броска: чем бросали и что это за бросок. */
export interface RollMeta {
  subject?: string;
  label?: string;
}

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

  // Куда бросок уходит помимо истории: открытая игровая комната показывает
  // его своей группе.
  const { broadcast } = useDiceRollSink();

  /**
   * Обрабатывает бросок кубов по указанной нотации.
   *
   * @param notation - Нотация броска (например, "1d20", "2d6+3")
   * @param meta - Чем бросали и что за бросок: подписи идут в игровую комнату,
   *   где по одной формуле не понять, атака это или урон
   */
  function handleRoll(notation: string, meta?: RollMeta) {
    if (!notation || notation.trim().length === 0) {
      return;
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

      return;
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

    if (Number.isFinite(numericValue)) {
      notifyTableRoll(Math.round(numericValue), tableId);

      broadcast({
        notation,
        total: Math.round(numericValue),
        details: rollDetails,
        subject: meta?.subject,
        label: meta?.label,
      });
    }
  }

  return {
    handleRoll,
  };
}
