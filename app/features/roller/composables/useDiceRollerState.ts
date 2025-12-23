import type { DiceDetail, HistoryEntry } from '../types';

export function useDiceRollerState() {
  const isOpen = useState<boolean>('dice-roller:isOpen', () => false);
  const formula = useState<string>('dice-roller:formula', () => '');
  const result = useState<string>('dice-roller:result', () => '');
  const details = useState<DiceDetail[]>('dice-roller:details', () => []);
  const history = useState<HistoryEntry[]>('dice-roller:history', () => []);

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  return { isOpen, formula, result, details, history, open, close, toggle };
}
