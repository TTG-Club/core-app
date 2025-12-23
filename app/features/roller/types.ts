export type CriticalType = 'success' | 'failure' | null;

export interface DiceRollItem {
  id: string;
  value: number;
  valid: boolean;
  critical: CriticalType;
}

export interface DiceDetail {
  id: string;
  label: string;
  total: number;
  rolls: DiceRollItem[];
}

export interface HistoryEntry {
  id: string;
  formula: string;
  displayValue: string; // всегда строка
  isError: boolean;
  timestamp: string; // ISO
  detail?: string;
}
