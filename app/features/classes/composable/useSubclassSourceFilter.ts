import type { ComputedRef, MaybeRefOrGetter } from 'vue';

import type { ClassLinkResponse } from '../model';

import { useSectionSourceSelection } from '~infrastructure/filter';

import {
  CLASS_FILTER_KEY,
  CLASS_SECTION_PATH,
  filterSubclassesBySources,
  getSubclassesHiddenLabel,
} from '../model';

/**
 * Подклассы класса, отобранные по источникам фильтра раздела классов: если
 * в списке классов выбраны только некоторые книги, подклассы из остальных
 * тоже не показываются. Без выбранных источников видны все подклассы.
 *
 * @param subclasses Все подклассы класса.
 * @returns Видимые подклассы и подпись о скрытых (если скрыты).
 */
export function useSubclassSourceFilter(
  subclasses: MaybeRefOrGetter<Array<ClassLinkResponse> | undefined>,
): {
  visibleSubclasses: ComputedRef<Array<ClassLinkResponse> | undefined>;
  hiddenLabel: ComputedRef<string | undefined>;
} {
  const sourceAcronyms = useSectionSourceSelection(
    CLASS_FILTER_KEY,
    CLASS_SECTION_PATH,
  );

  const subclassesBySources = computed(() => {
    const allSubclasses = toValue(subclasses);

    return allSubclasses
      ? filterSubclassesBySources(allSubclasses, sourceAcronyms.value)
      : undefined;
  });

  const visibleSubclasses = computed(
    () => subclassesBySources.value?.subclasses,
  );

  const hiddenLabel = computed(() =>
    getSubclassesHiddenLabel(subclassesBySources.value?.hiddenCount ?? 0),
  );

  return { visibleSubclasses, hiddenLabel };
}
