/**
 * «На выбор из тех, кто в области» в черновике формы: поля по умолчанию и
 * пустое правило в данных не пишутся.
 *
 * Зеркало: dnd5-test-migrate/src/engine/areaChoice.ts
 */

import type {
  AreaChoiceFallback,
  AreaChoiceMode,
  EffectAreaChoice,
  EffectTriggerAreaTarget,
} from './triggerTypes';

import { clamp } from 'es-toolkit';

import {
  DEFAULT_AREA_CHOICE_FALLBACK,
  DEFAULT_AREA_CHOICE_TARGET,
  MAX_TRIGGER_CHOICE_COUNT,
  MIN_TRIGGER_CHOICE_COUNT,
} from './triggerTypes';
import { parseFormNumber } from './types';

/** Правило выбора, как его показывает форма: каждое поле со значением. */
export interface AreaChoiceSettings {
  /** Сколько можно отметить; нет — без предела. */
  count: number | string | undefined;
  /** Как выбирают. */
  mode: AreaChoiceMode;
  /** Кого можно выбрать. */
  target: EffectTriggerAreaTarget;
  /** Кого задеть, если выбор не сделан. */
  fallback: AreaChoiceFallback;
}

/** Предел из одних цифр: такой пишется числом, остальное — формулой. */
const AREA_CHOICE_COUNT_DIGITS_PATTERN = /^\d+$/;

/**
 * Режим без поля `mode`: «до N» у правила с числом и «все» у правила без него.
 *
 * @param count предел выбора.
 * @returns режим, который VTTG подставит сам.
 */
function impliedAreaChoiceMode(
  count: EffectAreaChoice['count'],
): AreaChoiceMode {
  return count === undefined ? 'all' : 'upTo';
}

/**
 * Как выбирают из области: поле `mode` либо умолчание по наличию числа.
 *
 * @param areaChoice правило выбора; нет — выбора нет.
 * @returns режим выбора.
 */
export function resolveAreaChoiceMode(
  areaChoice: EffectAreaChoice | undefined,
): AreaChoiceMode {
  return areaChoice?.mode ?? impliedAreaChoiceMode(areaChoice?.count);
}

/**
 * Правило выбора для полей формы: умолчания VTTG подставлены.
 *
 * @param areaChoice правило выбора эффекта.
 * @returns значения полей.
 */
export function readAreaChoiceSettings(
  areaChoice: EffectAreaChoice | undefined,
): AreaChoiceSettings {
  return {
    count: areaChoice?.count,
    mode: resolveAreaChoiceMode(areaChoice),
    target: areaChoice?.target ?? DEFAULT_AREA_CHOICE_TARGET,
    fallback: areaChoice?.fallback ?? DEFAULT_AREA_CHOICE_FALLBACK,
  };
}

/**
 * Правило выбора из полей формы: значения по умолчанию не пишутся, а правило
 * из одних умолчаний — это его отсутствие. Без выбора («задеты все») предел и
 * исход закрытого окна не нужны: спрашивать некого.
 *
 * @param settings значения полей.
 * @returns правило либо `undefined`.
 */
export function toDraftAreaChoice(
  settings: AreaChoiceSettings,
): EffectAreaChoice | undefined {
  const asks = settings.mode !== 'all';
  const count = asks ? settings.count : undefined;

  const mode =
    settings.mode === impliedAreaChoiceMode(count) ? undefined : settings.mode;

  const target =
    settings.target === DEFAULT_AREA_CHOICE_TARGET
      ? undefined
      : settings.target;

  const fallback =
    asks && settings.fallback !== DEFAULT_AREA_CHOICE_FALLBACK
      ? settings.fallback
      : undefined;

  return count === undefined && !mode && !target && !fallback
    ? undefined
    : { count, mode, target, fallback };
}

/**
 * Предел выбора из поля: одни цифры — число, остальное — формула как набрана.
 * Пробелы по краям снимает нормализация при сохранении, чтобы не мешать
 * набору формулы.
 *
 * @param enteredCount текст поля.
 * @returns число, формула либо `undefined` для пустого поля.
 */
export function toDraftAreaChoiceCount(
  enteredCount: string,
): EffectAreaChoice['count'] {
  if (enteredCount === '') {
    return undefined;
  }

  return AREA_CHOICE_COUNT_DIGITS_PATTERN.test(enteredCount)
    ? Number(enteredCount)
    : enteredCount;
}

/**
 * Предел выбора для записи: число — целым в пределах, формула — без пробелов
 * по краям, пустая — отсутствием поля.
 *
 * @param count предел из черновика.
 * @returns предел либо `undefined`.
 */
function normalizeDraftAreaChoiceCount(
  count: EffectAreaChoice['count'],
): EffectAreaChoice['count'] {
  const numericCount = parseFormNumber(count);

  if (numericCount !== undefined) {
    return clamp(
      Math.trunc(numericCount),
      MIN_TRIGGER_CHOICE_COUNT,
      MAX_TRIGGER_CHOICE_COUNT,
    );
  }

  return typeof count === 'string' ? count.trim() || undefined : undefined;
}

/**
 * Правило выбора черновика к записи. Правило без единого поля не пишется.
 *
 * @param areaChoice правило из формы.
 * @returns правило либо `undefined`.
 */
export function normalizeDraftAreaChoice(
  areaChoice: EffectAreaChoice | undefined,
): EffectAreaChoice | undefined {
  if (!areaChoice) {
    return undefined;
  }

  const { mode, target, fallback } = areaChoice;
  const count = normalizeDraftAreaChoiceCount(areaChoice.count);

  return count === undefined && !mode && !target && !fallback
    ? undefined
    : { count, mode, target, fallback };
}
