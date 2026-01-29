export type CriticalType = 'success' | 'failure' | null;

export interface DiceFormulaExample {
  formula: string;
  note: string;
}

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
  displayValue: string;
  isError: boolean;
  timestamp: string;
  detail?: string;
  structuredDetails?: DiceDetail[];
}
