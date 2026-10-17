import type {
  AnalysisResult,
  CheckKind,
  CheckOutcome,
  DiceFormulaNode,
  Distribution,
  FormulaNode,
  OutcomeDistributions,
} from './types';

import {
  BINARY_COMBINATION_LIMIT,
  CONVOLUTION_SIZE_LIMIT,
  DICE_SUM_EXACT_LIMIT,
  DISTRIBUTION_PROBABILITY_EPSILON,
  KEEP_ENUMERATION_LIMIT,
  MONTE_CARLO_SAMPLES,
} from './constants';
import { applyOperator } from './operators';
import { simulateFormula } from './roll';

/** Границы и среднее по распределению. */
interface DistributionSummary {
  mean: number;
  min: number;
  max: number;
}

/**
 * Считает распределение одной кости с учётом переброса.
 *
 * При перебросе значения не выше порога выпадают только «со второго раза»,
 * поэтому их вероятность складывается из доли перебросов, а не из базовой доли грани.
 *
 * @param sides - Число граней
 * @param reroll - Порог переброса либо null
 * @returns Распределение значений одной кости
 */
function createSingleDieDistribution(
  sides: number,
  reroll: number | null,
): Distribution {
  const distribution: Distribution = new Map();
  const faceProbability = 1 / sides;

  if (!reroll) {
    for (let value = 1; value <= sides; value += 1) {
      distribution.set(value, faceProbability);
    }

    return distribution;
  }

  const rerollProbability = reroll / sides;

  for (let value = 1; value <= sides; value += 1) {
    const direct = value <= reroll ? 0 : faceProbability;

    distribution.set(value, direct + rerollProbability * faceProbability);
  }

  return distribution;
}

/**
 * Складывает два независимых распределения.
 *
 * @param left - Первое распределение
 * @param right - Второе распределение
 * @param sizeLimit - Предел числа различных значений в сумме
 * @returns Распределение суммы либо null, если результат вышел за предел
 */
function convolve(
  left: Distribution,
  right: Distribution,
  sizeLimit: number,
): Distribution | null {
  const result: Distribution = new Map();

  for (const [leftValue, leftProbability] of left) {
    for (const [rightValue, rightProbability] of right) {
      const value = leftValue + rightValue;

      result.set(
        value,
        (result.get(value) ?? 0) + leftProbability * rightProbability,
      );

      if (result.size > sizeLimit) {
        return null;
      }
    }
  }

  return result;
}

/**
 * Считает распределение максимума или минимума из нескольких костей
 * через функцию распределения: вероятность «все кости не больше X».
 *
 * @param single - Распределение одной кости
 * @param count - Число костей
 * @param keepHighest - true для максимума, false для минимума
 * @returns Распределение оставшейся кости
 */
function createExtremeDistribution(
  single: Distribution,
  count: number,
  keepHighest: boolean,
): Distribution {
  const values = [...single.keys()].sort((left, right) => left - right);
  const result: Distribution = new Map();

  let previousCumulative = 0;
  let cumulative = 0;

  for (const value of values) {
    cumulative += single.get(value) ?? 0;

    const probability = keepHighest
      ? cumulative ** count - previousCumulative ** count
      : (1 - previousCumulative) ** count - (1 - cumulative) ** count;

    if (probability > DISTRIBUTION_PROBABILITY_EPSILON) {
      result.set(value, probability);
    }

    previousCumulative = cumulative;
  }

  return result;
}

/**
 * Считает распределение суммы оставленных костей полным перебором комбинаций.
 *
 * @param node - Узел броска костей с правилом `kh` / `kl`
 * @param single - Распределение одной кости
 * @returns Распределение суммы либо null, если перебор слишком велик
 */
function enumerateKeepDistribution(
  node: DiceFormulaNode,
  single: Distribution,
): Distribution | null {
  const keep = node.keep;

  if (!keep || node.sides ** node.count > KEEP_ENUMERATION_LIMIT) {
    return null;
  }

  const faces = [...single.entries()].filter(
    ([, probability]) => probability > 0,
  );

  const result: Distribution = new Map();
  const rolled: number[] = [];

  const walk = (depth: number, probability: number): void => {
    if (depth === node.count) {
      const sorted = [...rolled].sort((left, right) => right - left);

      const kept =
        keep.kind === 'highest'
          ? sorted.slice(0, keep.amount)
          : sorted.slice(sorted.length - keep.amount);

      const sum = kept.reduce((total, value) => total + value, 0);

      result.set(sum, (result.get(sum) ?? 0) + probability);

      return;
    }

    for (const [value, faceProbability] of faces) {
      rolled.push(value);
      walk(depth + 1, probability * faceProbability);
      rolled.pop();
    }
  };

  walk(0, 1);

  return result;
}

/**
 * Считает точное распределение броска костей.
 *
 * @param node - Узел броска костей
 * @returns Распределение либо null, если точный расчёт слишком дорог
 */
function createDiceDistribution(node: DiceFormulaNode): Distribution | null {
  const single = createSingleDieDistribution(node.sides, node.reroll);

  if (!node.keep) {
    if (node.count * node.sides > DICE_SUM_EXACT_LIMIT) {
      return null;
    }

    let result: Distribution = new Map([[0, 1]]);

    for (let index = 0; index < node.count; index += 1) {
      const next = convolve(result, single, CONVOLUTION_SIZE_LIMIT);

      if (!next) {
        return null;
      }

      result = next;
    }

    return result;
  }

  if (node.keep.amount === 1) {
    return createExtremeDistribution(
      single,
      node.count,
      node.keep.kind === 'highest',
    );
  }

  return enumerateKeepDistribution(node, single);
}

/**
 * Считает точное распределение формулы.
 *
 * @param node - Узел формулы
 * @returns Распределение либо null, если точный расчёт невозможен или слишком дорог
 */
function createExactDistribution(node: FormulaNode): Distribution | null {
  if (node.type === 'number') {
    return new Map([[node.value, 1]]);
  }

  if (node.type === 'dice') {
    return createDiceDistribution(node);
  }

  // Проверки против СЛ и КД точному расчёту не поддаются: исход одного
  // броска меняет то, какие кости бросаются дальше.
  if (node.type !== 'binary') {
    return null;
  }

  const left = createExactDistribution(node.left);

  if (!left) {
    return null;
  }

  const right = createExactDistribution(node.right);

  if (!right || left.size * right.size > BINARY_COMBINATION_LIMIT) {
    return null;
  }

  const result: Distribution = new Map();

  for (const [leftValue, leftProbability] of left) {
    for (const [rightValue, rightProbability] of right) {
      const value = applyOperator(node.operator, leftValue, rightValue);

      result.set(
        value,
        (result.get(value) ?? 0) + leftProbability * rightProbability,
      );
    }
  }

  return result;
}

/**
 * Оценивает распределение формулы виртуальными бросками.
 *
 * @param node - Корневой узел формулы
 * @returns Оценка распределения
 */
function createSampledDistribution(node: FormulaNode): Distribution {
  const counts: Distribution = new Map();

  for (let sample = 0; sample < MONTE_CARLO_SAMPLES; sample += 1) {
    const { value } = simulateFormula(node);

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  for (const [value, count] of counts) {
    counts.set(value, count / MONTE_CARLO_SAMPLES);
  }

  return counts;
}

/**
 * Проверяет, есть ли в формуле проверка против СЛ или КД.
 *
 * @param node - Узел формулы
 * @returns true, если проверка есть
 */
function hasCheck(node: FormulaNode): boolean {
  if (node.type === 'check' || node.type === 'onHit') {
    return true;
  }

  return (
    node.type === 'binary' && (hasCheck(node.left) || hasCheck(node.right))
  );
}

/**
 * Находит вид первой проверки в формуле — от него зависят подписи исходов.
 *
 * @param node - Узел формулы
 * @returns Вид проверки либо null, если проверок нет
 */
export function findCheckKind(node: FormulaNode): CheckKind | null {
  if (node.type === 'check') {
    return node.kind;
  }

  if (node.type === 'onHit') {
    return node.check.kind;
  }

  if (node.type === 'binary') {
    return findCheckKind(node.left) ?? findCheckKind(node.right);
  }

  return null;
}

/**
 * Считает среднее, минимум и максимум по распределению.
 *
 * @param distribution - Распределение результатов
 * @returns Среднее и границы
 */
function summarize(distribution: Distribution): DistributionSummary {
  let mean = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const [value, probability] of distribution) {
    mean += value * probability;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return { mean, min, max };
}

/**
 * Выбирает, в какую часть распределения попадает исход броска.
 * Формулы без проверок попадают в обычную часть.
 *
 * @param buckets - Распределения по исходам
 * @param outcome - Исход первой проверки либо null
 * @returns Распределение, к которому относится бросок
 */
function selectOutcomeBucket(
  buckets: OutcomeDistributions,
  outcome: CheckOutcome | null,
): Distribution {
  if (outcome === 'critical') {
    return buckets.critical;
  }

  return outcome === 'miss' ? buckets.miss : buckets.normal;
}

/**
 * Оценивает формулу с проверкой: распределение раскладывается по исходам,
 * чтобы на гистограмме были видны промахи, попадания и криты.
 *
 * @param node - Корневой узел формулы
 * @returns Итог анализа
 */
function analyzeWithChecks(node: FormulaNode): AnalysisResult {
  const outcomeCounts: OutcomeDistributions = {
    normal: new Map(),
    critical: new Map(),
    miss: new Map(),
  };

  let hits = 0;
  let criticals = 0;
  let misses = 0;

  for (let sample = 0; sample < MONTE_CARLO_SAMPLES; sample += 1) {
    const { value, outcome } = simulateFormula(node);

    if (outcome === 'critical') {
      criticals += 1;
      hits += 1;
    } else if (outcome === 'hit') {
      hits += 1;
    } else if (outcome === 'miss') {
      misses += 1;
    }

    const bucket = selectOutcomeBucket(outcomeCounts, outcome);

    bucket.set(value, (bucket.get(value) ?? 0) + 1);
  }

  const distribution: Distribution = new Map();

  for (const bucket of Object.values(outcomeCounts)) {
    for (const [value, count] of bucket) {
      const probability = count / MONTE_CARLO_SAMPLES;

      bucket.set(value, probability);
      distribution.set(value, (distribution.get(value) ?? 0) + probability);
    }
  }

  return {
    distribution,
    outcomeDistributions: outcomeCounts,
    outcomeChances: {
      hit: hits / MONTE_CARLO_SAMPLES,
      critical: criticals / MONTE_CARLO_SAMPLES,
      miss: misses / MONTE_CARLO_SAMPLES,
    },
    ...summarize(distribution),
    exact: false,
  };
}

/**
 * Считает распределение результатов формулы: точно, если это по силам,
 * иначе — оценкой по виртуальным броскам.
 *
 * @param node - Корневой узел формулы
 * @returns Распределение, шансы исходов, среднее и границы
 *
 * @example
 * const analysis = analyzeFormula(parseFormula('4d6kh3'));
 * // analysis.exact === true, analysis.mean ≈ 12.24
 */
export function analyzeFormula(node: FormulaNode): AnalysisResult {
  if (hasCheck(node)) {
    return analyzeWithChecks(node);
  }

  const exactDistribution = createExactDistribution(node);
  const distribution = exactDistribution ?? createSampledDistribution(node);

  return {
    distribution,
    outcomeDistributions: null,
    outcomeChances: null,
    ...summarize(distribution),
    exact: Boolean(exactDistribution),
  };
}
