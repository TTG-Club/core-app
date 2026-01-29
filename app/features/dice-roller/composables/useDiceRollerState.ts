import type { DiceDetail, HistoryEntry } from '~dice-roller/types';

export function useDiceRollerState() {
  const isOpen = useState<boolean>('dice-roller:isOpen', () => false);
  const formula = useState<string>('dice-roller:formula', () => '');
  const result = useState<string>('dice-roller:result', () => '');
  const details = useState<DiceDetail[]>('dice-roller:details', () => []);
  const history = useState<HistoryEntry[]>('dice-roller:history', () => []);

  const resultKey = ref(0);

  const bumpResultKey = () => {
    resultKey.value += 1;
  };

  function createHistoryId(): string {
    const uuid = globalThis.crypto?.randomUUID?.();

    if (uuid) {
      return uuid;
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const addHistoryEntry = (payload: {
    formula: string;
    value: string;
    isError: boolean;
    detail?: string;
    structuredDetails?: DiceDetail[];
  }) => {
    if (!payload.formula) {
      return;
    }

    const entry: HistoryEntry = {
      id: createHistoryId(),
      formula: payload.formula,
      displayValue: payload.value,
      isError: payload.isError,
      timestamp: new Date().toISOString(),
      detail: payload.detail || undefined,
      structuredDetails: payload.structuredDetails,
    };

    history.value = [...history.value, entry];
  };

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  return {
    isOpen,
    formula,
    result,
    details,
    history,
    open,
    close,
    toggle,
    resultKey,
    bumpResultKey,
    addHistoryEntry,
  };
}
