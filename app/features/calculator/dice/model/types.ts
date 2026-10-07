/** Тип токена формулы, у которого нет собственного значения. */
export type FormulaKeywordToken =
  | 'plus'
  | 'minus'
  | 'multiply'
  | 'divide'
  | 'parenOpen'
  | 'parenClose'
  | 'dice'
  | 'reroll'
  | 'keepHighest'
  | 'keepLowest'
  | 'difficultyClass'
  | 'armorClass'
  | 'critical'
  | 'save'
  | 'half';

/** Токен формулы: либо целое число, либо ключевое слово или знак. */
export type FormulaToken =
  | { type: 'integer'; value: number }
  | { type: FormulaKeywordToken };

/** Какие кости оставляет модификатор `kh` / `kl`. */
export type DiceKeepKind = 'highest' | 'lowest';

/** Правило «оставить N лучших или худших костей». */
export interface DiceKeepRule {
  kind: DiceKeepKind;
  amount: number;
}

/** Бросок костей вида `4d6kh3r1`. */
export interface DiceFormulaNode {
  type: 'dice';
  count: number;
  sides: number;
  keep: DiceKeepRule | null;
  reroll: number | null;
}

/** Числовая константа формулы. */
export interface NumberFormulaNode {
  type: 'number';
  value: number;
}

/** Арифметическая операция формулы. */
export type FormulaOperator = '+' | '-' | '*' | '/';

/** Сложение, вычитание или умножение двух частей формулы. */
export interface BinaryFormulaNode {
  type: 'binary';
  operator: FormulaOperator;
  left: FormulaNode;
  right: FormulaNode;
}

/**
 * Против чего идёт проверка: сложность (СЛ) или класс доспеха (КД).
 * От этого зависят и подписи, и правила натуральных 20 и 1.
 */
export type CheckKind = 'difficultyClass' | 'armorClass';

/** Проверка броска против числа: `d20 + 5 КД 15`. */
export interface CheckFormulaNode {
  type: 'check';
  kind: CheckKind;
  target: number;
  roll: FormulaNode;
}

/** Урон, который зависит от исхода проверки: попадание, крит или промах. */
export interface OnHitFormulaNode {
  type: 'onHit';
  check: CheckFormulaNode;
  damage: FormulaNode;
  criticalDamage: FormulaNode | null;
  saveHalf: boolean;
}

/** Узел разобранной формулы. */
export type FormulaNode =
  | BinaryFormulaNode
  | CheckFormulaNode
  | DiceFormulaNode
  | NumberFormulaNode
  | OnHitFormulaNode;

/** Выпавшая грань одной кости с пометками о сбросе и перебросе. */
export interface RolledFace {
  value: number;
  dropped: boolean;
  rerolled: boolean;
}

/** Исход проверки против СЛ или КД. */
export type CheckOutcome = 'critical' | 'hit' | 'miss';

/** Группа костей одного вида в разборе броска. */
export interface DiceRollPart {
  type: 'dice';
  sides: number;
  label: string;
  faces: RolledFace[];
}

/** Результат проверки в разборе броска. */
export interface CheckRollPart {
  type: 'check';
  kind: CheckKind;
  target: number;
  total: number;
  natural: number | null;
  outcome: CheckOutcome;
}

/** Строка разбора броска: либо кости, либо проверка. */
export type RollPart = CheckRollPart | DiceRollPart;

/** Режим броска, при котором каждая одиночная d20 бросается дважды. */
export type RollMode = 'advantage' | 'disadvantage';

/**
 * Переключатель, меняющий результат броска, но не формулу в поле ввода.
 * Режимы взаимоисключающие, крит и сопротивление — независимые.
 */
export type RollToggleKey = RollMode | 'critical' | 'resistance';

/** Что включено на момент броска. */
export interface RollModifiers {
  mode: RollMode | null;
  critical: boolean;
  resistance: boolean;
}

/** Готовый бросок: итог, подпись и подробный разбор. */
export interface RollResult {
  label: string;
  value: number;
  parts: RollPart[];
}

/** Распределение вероятностей: значение броска — его вероятность. */
export type Distribution = Map<number, number>;

/** Шансы исходов проверки. */
export interface OutcomeChances {
  hit: number;
  critical: number;
  miss: number;
}

/** Распределения, разложенные по исходам проверки. */
export interface OutcomeDistributions {
  normal: Distribution;
  critical: Distribution;
  miss: Distribution;
}

/** Итог анализа формулы: распределение, границы и среднее. */
export interface AnalysisResult {
  distribution: Distribution;
  outcomeDistributions: OutcomeDistributions | null;
  outcomeChances: OutcomeChances | null;
  mean: number;
  min: number;
  max: number;
  exact: boolean;
}

/** Число, которое пресет спрашивает у игрока перед броском. */
export interface DicePresetPrompt {
  label: string;
  min: number;
  max: number;
  defaultValue: number;
}

/** Готовая формула на кнопке-пресете. */
export interface DicePreset {
  id: string;
  label: string;
  hint?: string;
  /**
   * Формула броска. У пресета с `prompt` это шаблон: подстановка
   * заменяется введённым числом.
   */
  formula: string;
  prompt?: DicePresetPrompt;
}

/** Строка справки по синтаксису формул. */
export interface DiceHelpRow {
  syntax: string;
  description: string;
}
