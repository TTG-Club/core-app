import type { ClassLinkResponse } from './link';

import { SUBCLASSES_HIDDEN_BY_SOURCES_LABEL_PREFIX } from './constants';

/** Подклассы после отбора по источникам. */
export interface SubclassesBySources {
  /** Подклассы из выбранных источников, в исходном порядке. */
  subclasses: Array<ClassLinkResponse>;
  /** Сколько подклассов скрыто отбором. */
  hiddenCount: number;
}

/**
 * Оставляет подклассы из выбранных источников. Ручка подклассов класса
 * параметр `source` не принимает, поэтому отбор идёт на клиенте.
 *
 * @param subclasses Подклассы класса.
 * @param sourceAcronyms Акронимы выбранных источников; `undefined` — без отбора.
 * @returns Подходящие подклассы и число скрытых.
 */
export function filterSubclassesBySources(
  subclasses: ReadonlyArray<ClassLinkResponse>,
  sourceAcronyms: ReadonlyArray<string> | undefined,
): SubclassesBySources {
  if (!sourceAcronyms) {
    return { subclasses: [...subclasses], hiddenCount: 0 };
  }

  const allowedAcronyms = new Set(sourceAcronyms);

  const visibleSubclasses = subclasses.filter((subclass) =>
    allowedAcronyms.has(subclass.source.name.label),
  );

  return {
    subclasses: visibleSubclasses,
    hiddenCount: subclasses.length - visibleSubclasses.length,
  };
}

/**
 * Подпись о подклассах, скрытых фильтром источников.
 *
 * @param hiddenCount Сколько подклассов скрыто.
 * @returns Подпись или `undefined`, если ничего не скрыто.
 */
export function getSubclassesHiddenLabel(
  hiddenCount: number,
): string | undefined {
  return hiddenCount > 0
    ? `${SUBCLASSES_HIDDEN_BY_SOURCES_LABEL_PREFIX}${hiddenCount}`
    : undefined;
}
