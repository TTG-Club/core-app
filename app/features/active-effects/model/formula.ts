/**
 * Разбор арифметической формулы эффекта без вычисления: числа, `+ - * /`,
 * скобки, @-переменные и функции `min`, `max`, `floor`, `ceil`, `abs`, `steps`.
 *
 * Нужен полю «Сл формулой» у срабатываний урона (`max(10, floor(@damage / 2))`):
 * формулу с ошибкой VTTG молча заменяет числом Сл, и автор должен увидеть
 * ошибку ещё в форме. Значения переменных не проверяются — контекста нет.
 * Второе назначение — формула словами под полем значения модификатора.
 *
 * Зеркало `validateFormula` и `renderReadableFormula` из
 * dnd5-test-migrate/src/engine/formulaParser.ts: те же токены, приоритеты,
 * сообщения об ошибках и читаемая запись.
 */

import {
  EFFECT_FORMULA_ERRORS,
  EFFECT_FORMULA_READABLE_FUNCTIONS,
  EFFECT_FORMULA_READABLE_LABELS,
  EFFECT_FORMULA_READABLE_OPERATORS,
} from './constants';

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

/** Узел дерева разобранной формулы. */
type FormulaNode =
  | { type: 'number'; value: number }
  | { type: 'variable'; path: string }
  | { type: 'negate'; operand: FormulaNode }
  | { type: 'function'; name: string; argumentNodes: FormulaNode[] }
  | {
      type: 'binary';
      operator: string;
      left: FormulaNode;
      right: FormulaNode;
    };

/** Ошибка разбора формулы. */
class FormulaError extends Error {
  /**
   * Создаёт ошибку разбора с сообщением, которое увидит автор формулы.
   *
   * @param message описание ошибки для автора.
   */
  constructor(message: string) {
    super(message);
    this.name = 'FormulaError';
  }
}

/**
 * Функция ступеней: `steps(значение, порог1, порог2, …)` — сколько порогов
 * значение уже достигло. Правила растят число по ступеням уровня
 * («Божественная искра» — лишняя к8 на 7, 13 и 18 уровнях), и `floor` такой
 * ряд не описывает.
 */
const STEPS_FUNCTION = 'steps';

/** Поддерживаемые функции. */
const SUPPORTED_FUNCTIONS: ReadonlySet<string> = new Set([
  'min',
  'max',
  'floor',
  'ceil',
  'abs',
  STEPS_FUNCTION,
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
 * Разбивает формулу на токены.
 *
 * @param formula строка формулы.
 * @returns токены.
 * @throws FormulaError при недопустимом символе.
 */
function tokenize(formula: string): FormulaToken[] {
  const tokens: FormulaToken[] = [];

  let position = 0;

  while (position < formula.length) {
    const character = formula.charAt(position);

    if (character === ' ' || character === '\t') {
      position++;

      continue;
    }

    if (DIGIT_PATTERN.test(character)) {
      let numberText = '';

      while (
        position < formula.length
        && (DIGIT_PATTERN.test(formula.charAt(position))
          || formula.charAt(position) === '.')
      ) {
        numberText += formula.charAt(position);
        position++;
      }

      tokens.push({ type: 'number', value: numberText });

      continue;
    }

    if (character === '@') {
      let variablePath = '';

      position++;

      while (
        position < formula.length
        && (ALPHANUMERIC_PATTERN.test(formula.charAt(position))
          || formula.charAt(position) === '.')
      ) {
        variablePath += formula.charAt(position);
        position++;
      }

      if (variablePath.length === 0) {
        throw new FormulaError(EFFECT_FORMULA_ERRORS.missingVariable(position));
      }

      tokens.push({ type: 'variable', value: variablePath });

      continue;
    }

    if (
      character === '+'
      || character === '-'
      || character === '*'
      || character === '/'
    ) {
      tokens.push({ type: 'operator', value: character });
      position++;

      continue;
    }

    const punctuationType = PUNCTUATION_TOKENS[character];

    if (punctuationType) {
      tokens.push({ type: punctuationType, value: character });
      position++;

      continue;
    }

    if (ALPHA_PATTERN.test(character)) {
      let identifier = '';

      while (
        position < formula.length
        && ALPHANUMERIC_PATTERN.test(formula.charAt(position))
      ) {
        identifier += formula.charAt(position);
        position++;
      }

      if (!SUPPORTED_FUNCTIONS.has(identifier)) {
        throw new FormulaError(
          EFFECT_FORMULA_ERRORS.unknownIdentifier(identifier),
        );
      }

      tokens.push({ type: 'function', value: identifier });

      continue;
    }

    throw new FormulaError(
      EFFECT_FORMULA_ERRORS.unexpectedChar(character, position),
    );
  }

  return tokens;
}

/**
 * Разбирает токены рекурсивным спуском с приоритетами операторов. Ничего не
 * вычисляет: негодная формула бросает, годная становится деревом.
 *
 * @param tokens токены формулы.
 * @returns дерево формулы.
 * @throws FormulaError при синтаксической ошибке.
 */
function parseFormula(tokens: readonly FormulaToken[]): FormulaNode {
  let position = 0;

  /**
   * Разбирает выражение не ниже приоритета.
   *
   * @param minPrecedence минимальный приоритет уровня.
   * @returns узел выражения.
   */
  function parseExpression(minPrecedence: number): FormulaNode {
    let left = parsePrimary();

    for (
      let token = tokens[position];
      token?.type === 'operator';
      token = tokens[position]
    ) {
      const precedence = OPERATOR_PRECEDENCE[token.value] ?? 0;

      if (precedence < minPrecedence) {
        break;
      }

      position++;

      left = {
        type: 'binary',
        operator: token.value,
        left,
        right: parseExpression(precedence + 1),
      };
    }

    return left;
  }

  /**
   * Разбирает аргументы функции после её имени.
   *
   * @param functionName имя функции.
   * @returns узлы аргументов.
   */
  function parseFunctionArguments(functionName: string): FormulaNode[] {
    if (tokens[position]?.type !== 'leftParen') {
      throw new FormulaError(
        EFFECT_FORMULA_ERRORS.missingFunctionParen(functionName),
      );
    }

    position++;

    const argumentNodes: FormulaNode[] = [];

    if (tokens[position] && tokens[position]?.type !== 'rightParen') {
      argumentNodes.push(parseExpression(0));

      while (tokens[position]?.type === 'comma') {
        position++;
        argumentNodes.push(parseExpression(0));
      }
    }

    if (tokens[position]?.type !== 'rightParen') {
      throw new FormulaError(
        EFFECT_FORMULA_ERRORS.unclosedFunction(functionName),
      );
    }

    position++;

    return argumentNodes;
  }

  /**
   * Разбирает число, переменную, функцию, скобки или унарный знак.
   *
   * @returns узел первичного выражения.
   */
  function parsePrimary(): FormulaNode {
    const token = tokens[position];

    if (!token) {
      throw new FormulaError(EFFECT_FORMULA_ERRORS.unexpectedEnd);
    }

    position++;

    if (token.type === 'number') {
      return { type: 'number', value: Number.parseFloat(token.value) };
    }

    if (token.type === 'variable') {
      return { type: 'variable', path: token.value };
    }

    if (token.type === 'function') {
      return {
        type: 'function',
        name: token.value,
        argumentNodes: parseFunctionArguments(token.value),
      };
    }

    if (token.type === 'leftParen') {
      const expression = parseExpression(0);

      if (tokens[position]?.type !== 'rightParen') {
        throw new FormulaError(EFFECT_FORMULA_ERRORS.unclosedParen);
      }

      position++;

      return expression;
    }

    if (token.type === 'operator' && token.value === '-') {
      return { type: 'negate', operand: parsePrimary() };
    }

    // Унарный плюс ничего не меняет — узла для него нет
    if (token.type === 'operator' && token.value === '+') {
      return parsePrimary();
    }

    throw new FormulaError(EFFECT_FORMULA_ERRORS.unexpectedToken(token.value));
  }

  const formulaTree = parseExpression(0);
  const extraToken = tokens[position];

  if (extraToken) {
    throw new FormulaError(EFFECT_FORMULA_ERRORS.extraToken(extraToken.value));
  }

  return formulaTree;
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
    return { valid: false, error: EFFECT_FORMULA_ERRORS.empty };
  }

  if (!Number.isNaN(Number(trimmed))) {
    return { valid: true };
  }

  try {
    parseFormula(tokenize(trimmed));

    return { valid: true };
  } catch (parseError) {
    return {
      valid: false,
      error:
        parseError instanceof FormulaError
          ? parseError.message
          : EFFECT_FORMULA_ERRORS.invalid,
    };
  }
}

/** Номер аргумента в шаблоне функции: `{0}`, `{1}`. */
const READABLE_ARGUMENT_PATTERN = /\{(\d)\}/g;

/**
 * Вызов функции словами. У ступеней число порогов любое — шаблон с номерами
 * аргументов им не годится.
 *
 * @param functionName имя функции.
 * @param argumentTexts аргументы, уже записанные словами.
 * @returns читаемая запись вызова.
 */
function renderReadableFunction(
  functionName: string,
  argumentTexts: string[],
): string {
  if (functionName === STEPS_FUNCTION) {
    const [steppedValue = '', ...thresholds] = argumentTexts;

    return EFFECT_FORMULA_READABLE_LABELS.steps(
      thresholds.join(', '),
      steppedValue,
    );
  }

  const template = EFFECT_FORMULA_READABLE_FUNCTIONS[functionName];

  return template
    ? template.replace(
        READABLE_ARGUMENT_PATTERN,
        (_placeholder, argumentIndex: string) =>
          argumentTexts[Number(argumentIndex)] ?? '',
      )
    : `${functionName}(${argumentTexts.join('; ')})`;
}

/**
 * Узел формулы словами. Скобки ставятся только там, где без них поменялся бы
 * смысл: исходные скобки дерево не хранит, а лишние мешают читать.
 *
 * @param node узел.
 * @param labelVariable подпись переменной по токену (`@prof` → «бонус мастерства»).
 * @param parentPrecedence приоритет оператора-родителя.
 * @param isRightOperand узел стоит справа от родителя (для `a − (b − c)`).
 * @returns читаемая запись узла.
 */
function renderReadableNode(
  node: FormulaNode,
  labelVariable: (token: string) => string,
  parentPrecedence = 0,
  isRightOperand = false,
): string {
  switch (node.type) {
    case 'number':
      return String(node.value);
    case 'variable':
      return labelVariable(`@${node.path}`);
    case 'negate':
      return `${EFFECT_FORMULA_READABLE_LABELS.negate}${renderReadableNode(node.operand, labelVariable, Number.POSITIVE_INFINITY)}`;
    case 'function':
      return renderReadableFunction(
        node.name,
        node.argumentNodes.map((argumentNode) =>
          renderReadableNode(argumentNode, labelVariable),
        ),
      );
    // Остался бинарный оператор: `default` вместо `case 'binary'` — иначе
    // линтер требует возврата после исчерпанного `switch`
    default: {
      const precedence = OPERATOR_PRECEDENCE[node.operator] ?? 0;
      const left = renderReadableNode(node.left, labelVariable, precedence);

      const right = renderReadableNode(
        node.right,
        labelVariable,
        precedence,
        true,
      );

      const operator =
        EFFECT_FORMULA_READABLE_OPERATORS[node.operator] ?? node.operator;

      const operationText = `${left} ${operator} ${right}`;

      const needsParens =
        precedence < parentPrecedence
        || (isRightOperand && precedence === parentPrecedence);

      return needsParens ? `(${operationText})` : operationText;
    }
  }
}

/**
 * Формула словами — для подписи под полем значения: `floor(@classLevel / 4)`
 * читается «(уровень в классе / 4, с округлением вниз)».
 *
 * Формулу разбирает тот же разбор, что и проверку, поэтому подпись не
 * разойдётся с тем, как формулу поймёт VTTG. Кости и токены урона разбор не
 * понимает — для них подписи нет.
 *
 * @param formula строка формулы.
 * @param labelVariable подпись переменной по токену.
 * @returns читаемая запись либо `undefined`, если формулу не разобрать.
 */
export function renderReadableFormula(
  formula: string,
  labelVariable: (token: string) => string,
): string | undefined {
  const trimmedFormula = formula.trim();

  if (trimmedFormula.length === 0) {
    return undefined;
  }

  try {
    return renderReadableNode(
      parseFormula(tokenize(trimmedFormula)),
      labelVariable,
    );
  } catch {
    return undefined;
  }
}
