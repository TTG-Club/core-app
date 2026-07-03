import type { DropdownMenuItem } from '@nuxt/ui';
import type { ComputedRef, Ref } from 'vue';

import type { ListPresentationConfig, ListPresentationOption } from '../model';

import {
  LIST_PRESENTATION_GROUPING_ICON,
  LIST_PRESENTATION_GROUPING_LABEL,
  LIST_PRESENTATION_SORTING_ICON,
  LIST_PRESENTATION_SORTING_LABEL,
} from '../model';

export interface ListPresentationMenu {
  id: string;
  label: string;
  icon: string;
  items: Array<DropdownMenuItem>;
}

/**
 * Превращает варианты настройки в чекбокс-пункты меню Nuxt UI.
 */
function toCheckboxItems<TValue extends string>(
  options: Array<ListPresentationOption<TValue>>,
  active: Ref<TValue>,
): Array<DropdownMenuItem> {
  return options.map((option) => ({
    label: option.label,
    type: 'checkbox',
    checked: active.value === option.value,
    onSelect: (event: Event) => {
      event.preventDefault();
      active.value = option.value;
    },
  }));
}

/**
 * Строит меню группировки и сортировки для тулбара списка. Измерение
 * попадает в меню только когда у него больше одного варианта. Результат
 * переиспользуется как для отдельных дропдаунов (десктоп), так и для
 * вложенных подменю в оверфлоу-меню «⋯» (мобильный режим).
 */
export function useListPresentationMenus<
  TItem,
  TGrouping extends string,
  TSorting extends string,
>(
  config: ListPresentationConfig<TItem, TGrouping, TSorting>,
  grouping: Ref<TGrouping>,
  sorting: Ref<TSorting>,
): ComputedRef<Array<ListPresentationMenu>> {
  return computed(() => {
    const menus: Array<ListPresentationMenu> = [];

    if (config.groupingOptions.length > 1) {
      menus.push({
        id: 'grouping',
        label: LIST_PRESENTATION_GROUPING_LABEL,
        icon: LIST_PRESENTATION_GROUPING_ICON,
        items: toCheckboxItems(config.groupingOptions, grouping),
      });
    }

    if (config.sortingOptions.length > 1) {
      menus.push({
        id: 'sorting',
        label: LIST_PRESENTATION_SORTING_LABEL,
        icon: LIST_PRESENTATION_SORTING_ICON,
        items: toCheckboxItems(config.sortingOptions, sorting),
      });
    }

    return menus;
  });
}
