import type { AnalysisResult, Distribution } from './types';

import { CHART_MAX_BINS } from './constants';

/** Вероятности исходов внутри каждого столбца гистограммы. */
export interface HistogramOutcomeBins {
  normal: number[];
  critical: number[];
  miss: number[];
}

/** Гистограмма распределения: столбцы одинаковой ширины по значениям. */
export interface Histogram {
  min: number;
  binWidth: number;
  binCount: number;
  total: number[];
  outcomes: HistogramOutcomeBins | null;
  maxProbability: number;
}

/**
 * Раскладывает распределение по столбцам гистограммы.
 *
 * @param distribution - Распределение результатов
 * @param min - Наименьшее значение всей гистограммы
 * @param binWidth - Ширина столбца в единицах значения
 * @param binCount - Число столбцов
 * @returns Массив вероятностей по столбцам
 */
function fillBins(
  distribution: Distribution,
  min: number,
  binWidth: number,
  binCount: number,
): number[] {
  const bins = Array.from({ length: binCount }, () => 0);

  for (const [value, probability] of distribution) {
    const index = Math.floor((value - min) / binWidth);
    const current = bins[index];

    if (current !== undefined) {
      bins[index] = current + probability;
    }
  }

  return bins;
}

/**
 * Строит гистограмму по итогу анализа формулы. Значения группируются в столбцы,
 * чтобы широкие распределения (например, урона) оставались читаемыми.
 *
 * @param analysis - Итог анализа формулы
 * @returns Гистограмма либо null, если распределение пустое
 *
 * @example
 * const histogram = createHistogram(analyzeFormula(parseFormula('2d6')));
 * // histogram.binCount === 11
 */
export function createHistogram(analysis: AnalysisResult): Histogram | null {
  const values = [...analysis.distribution.keys()];

  if (!values.length) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = Math.max(1, Math.ceil((max - min + 1) / CHART_MAX_BINS));
  const binCount = Math.floor((max - min) / binWidth) + 1;

  const total = fillBins(analysis.distribution, min, binWidth, binCount);
  const outcomeDistributions = analysis.outcomeDistributions;

  return {
    min,
    binWidth,
    binCount,
    total,
    outcomes: outcomeDistributions
      ? {
          normal: fillBins(
            outcomeDistributions.normal,
            min,
            binWidth,
            binCount,
          ),
          critical: fillBins(
            outcomeDistributions.critical,
            min,
            binWidth,
            binCount,
          ),
          miss: fillBins(outcomeDistributions.miss, min, binWidth, binCount),
        }
      : null,
    maxProbability: Math.max(...total),
  };
}

/**
 * Считает вероятность выбросить не меньше указанного значения.
 *
 * @param distribution - Распределение результатов
 * @param threshold - Порог, начиная с которого суммируются вероятности
 * @returns Вероятность от 0 до 1
 *
 * @example
 * chanceAtLeast(analysis.distribution, 15); // 0.35
 */
export function chanceAtLeast(
  distribution: Distribution,
  threshold: number,
): number {
  let chance = 0;

  for (const [value, probability] of distribution) {
    if (value >= threshold) {
      chance += probability;
    }
  }

  return Math.min(chance, 1);
}
