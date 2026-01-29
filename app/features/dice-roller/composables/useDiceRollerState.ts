import type { DiceDetail, HistoryEntry } from '~dice-roller/types';

interface AddHistoryEntryPayload {
  formula: string;
  value: string;
  isError: boolean;
  detail?: string;
  structuredDetails?: DiceDetail[];
}

type TableRollCallback = (value: number) => void;

export function useDiceRollerState() {
  const dayjs = useDayjs();

  const isOpen = useState<boolean>('dice-roller:isOpen', () => false);
  const formula = useState<string>('dice-roller:formula', () => '');
  const result = useState<string>('dice-roller:result', () => '');
  const details = useState<DiceDetail[]>('dice-roller:details', () => []);
  const history = useState<HistoryEntry[]>('dice-roller:history', () => []);

  const resultKey = ref(0);

  /**
   * Карта callback'ов для таблиц, подписанных на результаты бросков.
   * Ключ - уникальный ID таблицы, значение - callback функция.
   */
  const tableRollCallbacks = useState<Map<string, TableRollCallback>>(
    'dice-roller:tableRollCallbacks',
    () => new Map(),
  );

  const incrementResultKey = () => {
    resultKey.value += 1;
  };

  const generateHistoryEntryId = (): string => {
    const uuid = globalThis.crypto?.randomUUID?.();

    if (uuid) {
      return uuid;
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
      timestamp: dayjs().toISOString(),
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
   * Уведомляет все зарегистрированные таблицы о результате броска.
   *
   * @param value - Числовой результат броска
   */
  const notifyTableRoll = (value: number) => {
    tableRollCallbacks.value.forEach((callback) => {
      callback(value);
    });
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
