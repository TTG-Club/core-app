import { v7 as uuidv7 } from 'uuid';

import type { DiceDetail, HistoryEntry } from '../types';

interface AddHistoryEntryPayload {
  formula: string;
  value: string;
  isError: boolean;
  detail?: string;
  structuredDetails?: DiceDetail[];
}

type TableRollCallback = (value: number) => void;

type TableRollCallbacksMap = Map<string, TableRollCallback>;

/**
 * Глобальный стейт роллера кубов.
 * Управляет состоянием модального окна, текущей формулой, результатами и историей.
 * Синхронизирует состояние между различными компонентами (кнопка, модалка, сайдбар).
 */
export function useDiceRollerState() {
  const { $dayjs } = useDayjs();

  const tableRollCallbacks = useState<TableRollCallbacksMap>(
    'dice-roller:tableRollCallbacks',
    () => new Map(),
  );

  const isOpen = useState<boolean>('dice-roller:isOpen', () => false);
  const formula = useState<string>('dice-roller:formula', () => '');
  const result = useState<string>('dice-roller:result', () => '');
  const details = useState<DiceDetail[]>('dice-roller:details', () => []);
  const history = useState<HistoryEntry[]>('dice-roller:history', () => []);

  const resultKey = ref(0);

  const incrementResultKey = () => {
    resultKey.value += 1;
  };

  const generateHistoryEntryId = (): string => {
    return uuidv7();
  };

  const addHistoryEntry = (payload: AddHistoryEntryPayload) => {
    if (!payload.formula) {
      return;
    }

    const entry: HistoryEntry = {
      id: generateHistoryEntryId(),
      formula: payload.formula,
      displayValue: payload.value,
      isError: payload.isError,
      timestamp: $dayjs().valueOf(),
      detail: payload.detail || undefined,
      structuredDetails: payload.structuredDetails,
    };

    history.value = [...history.value, entry];
  };

  const openModal = () => {
    isOpen.value = true;
  };

  const closeModal = () => {
    isOpen.value = false;
  };

  const toggleModal = () => {
    isOpen.value = !isOpen.value;
  };

  /**
   * Регистрирует callback таблицы для получения результатов бросков.
   *
   * @param tableId - Уникальный ID таблицы
   * @param callback - Функция, вызываемая при броске
   */
  const registerTableRollCallback = (
    tableId: string,
    callback: TableRollCallback,
  ) => {
    tableRollCallbacks.value.set(tableId, callback);
  };

  /**
   * Удаляет callback таблицы.
   *
   * @param tableId - Уникальный ID таблицы
   */
  const unregisterTableRollCallback = (tableId: string) => {
    tableRollCallbacks.value.delete(tableId);
  };

  /**
   * Уведомляет таблицу о результате броска.
   * Если передан tableId, уведомляет только конкретную таблицу.
   * Если tableId не передан, ничего не делает (глобальные броски не влияют на таблицы).
   *
   * @param value - Числовой результат броска
   * @param tableId - ID таблицы, из которой был сделан бросок
   */
  const notifyTableRoll = (value: number, tableId?: string) => {
    if (tableId) {
      const callback = tableRollCallbacks.value.get(tableId);

      if (callback) {
        callback(value);
      }
    }
  };

  return {
    isOpen,
    formula,
    result,
    details,
    history,
    resultKey,
    openModal,
    closeModal,
    toggleModal,
    incrementResultKey,
    addHistoryEntry,
    registerTableRollCallback,
    unregisterTableRollCallback,
    notifyTableRoll,
  };
}
