import type { WritableComputedRef } from 'vue';

import { LayoutWidthName } from '~/shared/consts';

import { SECTION_LAYOUT_OPTIONS } from '../constants';

/** Раскладка разделов — одна из восьми в панели настроек. */
export type SectionLayout = (typeof SECTION_LAYOUT_OPTIONS)[number]['value'];

/**
 * Раскладка разделов целиком. Отдельной куки у неё нет: она складывается из
 * ширины сайта, узкой колонки, места фильтров (над списком — это свёрнутая
 * колонка) и стороны записи. Её читает панель настроек и учёт онлайна.
 *
 * @returns Текущая раскладка; запись переставляет все её настройки.
 */
export function useSectionLayout(): WritableComputedRef<SectionLayout> {
  const { width: layoutWidth, change: changeLayoutWidth } = useLayoutWidth();

  const { isCollapsed: isFiltersCollapsed, setCollapsed: setFiltersCollapsed } =
    useSectionFiltersCollapsed();

  const { filtersSide, detailSide, setFiltersSide, setDetailSide } =
    useSectionColumnSides();

  const { isCentered, setCentered } = useSectionCentered();

  return computed({
    get: (): SectionLayout => {
      if (layoutWidth.value !== LayoutWidthName.Wide) {
        return 'default';
      }

      if (isCentered.value) {
        return 'centered';
      }

      const filters = isFiltersCollapsed.value ? 'top' : filtersSide.value;

      return (
        SECTION_LAYOUT_OPTIONS.find(
          (option) =>
            option.width === LayoutWidthName.Wide
            && option.filters === filters
            && !option.centered
            && option.detail === detailSide.value,
        )?.value ?? 'default'
      );
    },
    set: (value: SectionLayout) => {
      const option = SECTION_LAYOUT_OPTIONS.find(
        (entry) => entry.value === value,
      );

      if (!option) {
        return;
      }

      changeLayoutWidth(option.width);

      // Обычной ширине место колонок не важно — оставляем прежние
      if (option.width !== LayoutWidthName.Wide) {
        return;
      }

      setCentered(option.centered);

      // Узкой раскладке колонки фильтров не нужно — прежний выбор сохраняем
      if (option.centered) {
        setDetailSide(option.detail);

        return;
      }

      setFiltersCollapsed(option.filters === 'top');

      if (option.filters !== 'top') {
        setFiltersSide(option.filters);
      }

      setDetailSide(option.detail);
    },
  });
}
