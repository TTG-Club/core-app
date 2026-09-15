/**
 * Проверка арифметической формулы эффекта без вычисления: числа, `+ - * /`,
 * скобки, @-переменные и функции `min`, `max`, `floor`, `ceil`, `abs`.
 *
 * Нужна полю «Сл формулой» у срабатываний урона (`max(10, floor(@damage / 2))`):
 * формулу с ошибкой VTTG молча заменяет числом Сл, и автор должен увидеть
 * ошибку ещё в форме. Значения переменных не проверяются — контекста нет.
 *
 * Зеркало синтаксиса `validateFormula` из
 * dnd5-test-migrate/src/engine/formulaParser.ts: те же токены, приоритеты и
 * сообщения об ошибках.
 */

/** Результат проверки формулы. */
export interface FormulaValidationResult {
  /** Годна ли формула. */
  valid: boolean;
  /** Описание ошибки, если формула негодна. */
  error?: string;
}

/** Вид токена формулы. */
type FormulaTokenType =
  | 'number'
  | 'operator'
  | 'leftParen'
  | 'rightParen'
  | 'variable'
  | 'function'
  | 'comma';

/** Токен формулы. */
interface FormulaToken {
  type: FormulaTokenType;
  value: string;
}

/** Ошибка разбора формулы. */
class FormulaError extends Error {
  /**
   * @param message описание ошибки для автора.
   */
  constructor(message: string) {
    super(message);
    this.name = 'FormulaError';
  }
}

/** Поддерживаемые функции. */
const SUPPORTED_FUNCTIONS: ReadonlySet<string> = new Set([
  'min',
  'max',
  'floor',
  'ceil',
  'abs',
]);

/** Приоритет операторов. */
const OPERATOR_PRECEDENCE: Record<string, number> = {
  '+': 1,
  '-': 1,
  '*': 2,
  '/': 2,
};

/** Одиночные символы формулы и их токены. */
const PUNCTUATION_TOKENS: Record<string, FormulaTokenType> = {
  '(': 'leftParen',
  ')': 'rightParen',
  ',': 'comma',
};

/** Буква латиницы. */
const ALPHA_PATTERN = /^[a-z]$/i;

/** Буква латиницы, цифра или подчёркивание. */
const ALPHANUMERIC_PATTERN = /^\w$/;

/** Цифра. */
const DIGIT_PATTERN = /^\d$/;

/**
 * Сообщения об ошибках разбора — те же, что у системы.
 */
const FORMULA_ERRORS = {
  empty: 'Формула не может быть пустой',
  invalid: 'Невалидная формула',
  missingVariable: (position: number) =>
    `Ожидалось имя переменной после @ на позиции ${position}`,
  unknownIdentifier: (identifier: string) =>
    `Неизвестный идентификатор: "${identifier}". Переменные должны начинаться с @`,
  unexpectedChar: (char: string, position: number) =>
    `Неожиданный символ "${char}" на позиции ${position}`,
  unexpectedEnd: 'Неожиданный конец формулы',
  missingFunctionParen: (name: string) => `Ожидалась '(' после функции ${name}`,
  unclosedFunction: (name: string) =>
    `Ожидалась ')' после аргументов функции ${name}`,
  unclosedParen: 'Незакрытая скобка',
  unexpectedToken: (value: string) => `Неожиданный токен: "${value}"`,
  extraToken: (value: string) => `Лишний токен: "${value}"`,
} as const;

/**
 * Разбивает формулу на токены.
 *
 * @param formula строка формулы.
 * @returns токены.
 * @throws FormulaError при недопустимом символе.
 */
function tokenize(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];

  let position = 0;

  const charAt = (index: number): string => formula.charAt(index);

  while (position < formula.length) {
    const char = charAt(position);

    if (char === ' ' || char === '\t') {
      position++;

      continue;
    }

    if (DIGIT_PATTERN.test(char)) {
      let numberText = '';

      while (
        position < formula.length
        && (DIGIT_PATTERN.test(charAt(position)) || charAt(position) === '.')
      ) {
        numberText += charAt(position);
        position++;
      }

      tokens.push({ type: 'number', value: numberText });

      continue;
    }

    if (char === '@') {
      let variablePath = '';

      position++;

      while (
        position < formula.length
        && (ALPHANUMERIC_PATTERN.test(charAt(position))
          || charAt(position) === '.')
      ) {
        variablePath += charAt(position);
        position++;
      }

      if (variablePath.length === 0) {
        throw new FormulaError(FORMULA_ERRORS.missingVariable(position));
      }

      tokens.push({ type: 'variable', value: variablePath });

      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char });
      position++;

      continue;
    }

    const punctuationType = PUNCTUATION_TOKENS[char];

    if (punctuationType) {
      tokens.push({ type: punctuationType, value: char });
      position++;

      continue;
    }

    if (ALPHA_PATTERN.test(char)) {
      let identifier = '';

      while (
        position < formula.length
        && ALPHANUMERIC_PATTERN.test(charAt(position))
      ) {
        identifier += charAt(position);
        position++;
      }

      if (!SUPPORTED_FUNCTIONS.has(identifier)) {
        throw new FormulaError(FORMULA_ERRORS.unknownIdentifier(identifier));
      }

      tokens.push({ type: 'function', value: identifier });

      continue;
    }

    throw new FormulaError(FORMULA_ERRORS.unexpectedChar(char, position));
  }

  return tokens;
}

/**
 * Проверяет порядок токенов рекурсивным спуском с приоритетами операторов.
 *
 * @param tokens токены формулы.
 * @throws FormulaError при синтаксической ошибке.
 */
function parse(tokens: readonly FormulaToken[]): void {
  let position = 0;

  const tokenAt = (index: number): FormulaToken | undefined => tokens[index];

  /**
   * Разбирает выражение не ниже приоритета.
   *
   * @param minPrecedence минимальный приоритет уровня.
   */
  function parseExpression(minPrecedence: number): void {
    parsePrimary();

    for (
      let token = tokenAt(position);
      token?.type === 'operator';
      token = tokenAt(position)
    ) {
      const precedence = OPERATOR_PRECEDENCE[token.value] ?? 0;

      if (precedence < minPrecedence) {
        break;
      }

      position++;
      parseExpression(precedence + 1);
    }
  }

  /** Разбирает число, переменную, функцию, скобки или унарный знак. */
  function parsePrimary(): void {
    const token = tokenAt(position);

    if (!token) {
      throw new FormulaError(FORMULA_ERRORS.unexpectedEnd);
    }

    if (token.type === 'number' || token.type === 'variable') {
      position++;

      return;
    }

    if (token.type === 'function') {
      position++;

      if (tokenAt(position)?.type !== 'leftParen') {
        throw new FormulaError(
          FORMULA_ERRORS.missingFunctionParen(token.value),
        );
      }

      position++;

      if (tokenAt(position) && tokenAt(position)?.type !== 'rightParen') {
        parseExpression(0);

        while (tokenAt(position)?.type === 'comma') {
          position++;
          parseExpression(0);
        }
      }

      if (tokenAt(position)?.type !== 'rightParen') {
        throw new FormulaError(FORMULA_ERRORS.unclosedFunction(token.value));
      }

      position++;

      return;
    }

    if (token.type === 'leftParen') {
      position++;
      parseExpression(0);

      if (tokenAt(position)?.type !== 'rightParen') {
        throw new FormulaError(FORMULA_ERRORS.unclosedParen);
      }

      position++;

      return;
    }

    if (
      token.type === 'operator'
      && (token.value === '-' || token.value === '+')
    ) {
      position++;
      parsePrimary();

      return;
    }

    throw new FormulaError(FORMULA_ERRORS.unexpectedToken(token.value));
  }

  parseExpression(0);

  const extra = tokenAt(position);

  if (extra) {
    throw new FormulaError(FORMULA_ERRORS.extraToken(extra.value));
  }
}

/**
 * Проверяет синтаксис формулы.
 *
 * @param formula строка формулы.
 * @returns результат проверки с описанием ошибки.
 */
export function validateFormula(formula: string): FormulaValidationResult {
  const trimmed = formula.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: FORMULA_ERRORS.empty };
  }

  if (!Number.isNaN(Number(trimmed))) {
    return { valid: true };
  }

  try {
    parse(tokenize(trimmed));

    return { valid: true };
  } catch (parseError) {
    return {
      valid: false,
      error:
        parseError instanceof FormulaError
          ? parseError.message
          : FORMULA_ERRORS.invalid,
    };
  }
}
