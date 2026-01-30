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

/**
 * Внутренний интерфейс для информации о количестве кубов.
 */
export interface DieCountInfo {
  value?: number;
}

/**
 * Внутренний интерфейс для информации о типе куба.
 */
export interface DieTypeInfo {
  type?: string;
  value?: number;
}

/**
 * Интерфейс с информацией о броске куба.
 */
export interface DieRollInfo {
  count?: DieCountInfo;
  die?: DieTypeInfo;
  label?: string;
}

/**
 * Внутренний интерфейс, представляющий узел куба из результата dice-roller-parser.
 * Содержит информацию о типе куба, количестве, результатах отдельных бросков
 * и вычисленных значениях.
 */
export interface DieNode extends DieRollInfo {
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
 * Интерфейс узла с вложенным выражением из dice-roller-parser.
 * Используется для рекурсивного обхода дерева результатов броска.
 */
export interface ExpressionNode {
  expr?: Record<string, unknown>;
}
