<script setup lang="ts">
  import type { FilterGroup, FilterGroups, FilterItems } from '../types';

  import {
    getAvailableGroupItems,
    getSearchedGroupItems,
    hasTouchedItem,
    isGroupDependentOn,
  } from '../utils';
  import { FilterGroup as FilterGroupComponent } from './ui';

  type GroupPosition = 'standalone' | 'top' | 'bottom';

  interface DisplayGroup {
    group: FilterGroup;
    index: number;
    availableItems: FilterItems;
  }

  /** Определяет позицию фильтра внутри визуально объединённой группы. */
  function getGroupPosition(
    groupIndex: number,
    groupLength: number,
  ): GroupPosition {
    if (groupLength === 1) {
      return 'standalone';
    }

    return groupIndex === 0 ? 'top' : 'bottom';
  }

  const emit = defineEmits<{
    (event: 'update:empty', value: boolean): void;
  }>();

  const { preview = false, search = '' } = defineProps<{
    preview?: boolean;
    search?: string;
  }>();

  /**
   * Определяет видимость группы в обычном режиме и режиме предпросмотра.
   *
   * При активном поиске пустой набор означает, что не подошло ни одно значение
   * группы и её название — показывать такую группу нечем. Без поиска поведение
   * прежнее: группа без доступных значений остаётся на месте.
   */
  function isGroupVisible(items: FilterItems): boolean {
    if (search && items.length === 0) {
      return false;
    }

    return !preview || hasTouchedItem(items);
  }

  const filter = defineModel<FilterGroups>({
    required: true,
  });

  const containerGapClass = computed(() => (preview ? 'gap-3' : 'gap-6'));
  const groupGapClass = computed(() => (preview ? 'gap-3' : undefined));

  /** Позиция группы с учётом предпросмотра (в превью блоки не объединяются). */
  function resolveGroupPosition(
    itemIndex: number,
    groupLength: number,
  ): GroupPosition {
    return preview ? 'standalone' : getGroupPosition(itemIndex, groupLength);
  }

  /**
   * Значения группы, доступные каскадом зависимостей и подходящие под поиск.
   * Поиск применяется поверх каскада, чтобы не показать значение, которое
   * зависимая группа уже скрыла.
   */
  function getVisibleGroupItems(
    group: FilterGroup,
    groups: FilterGroups,
  ): FilterItems {
    return getSearchedGroupItems(
      group,
      getAvailableGroupItems(group, groups),
      search,
    );
  }

  const groupedFilters = computed(() => {
    const displayGroups: DisplayGroup[][] = [];
    const groups = filter.value;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const nextGroup = groups[i + 1];

      if (!group) {
        continue;
      }

      const availableItems = getVisibleGroupItems(group, groups);

      if (nextGroup && isGroupDependentOn(nextGroup, group.key)) {
        const nextAvailableItems = getVisibleGroupItems(nextGroup, groups);
        const combinedGroups: DisplayGroup[] = [];

        if (isGroupVisible(availableItems)) {
          combinedGroups.push({ group, index: i, availableItems });
        }

        if (isGroupVisible(nextAvailableItems)) {
          combinedGroups.push({
            group: nextGroup,
            index: i + 1,
            availableItems: nextAvailableItems,
          });
        }

        if (combinedGroups.length > 0) {
          displayGroups.push(combinedGroups);
        }

        // Зависимая группа уже отрисована в паре с текущей — пропускаем её,
        // чтобы не вывести повторно на следующей итерации.
        i++;
      } else if (isGroupVisible(availableItems)) {
        displayGroups.push([{ group, index: i, availableItems }]);
      }
    }

    return displayGroups;
  });

  // Пустоту знает только этот компонент — перебор групп живёт здесь. Дровер
  // показывает по ней пустое состояние, поэтому признак уходит наружу событием,
  // а не считается там заново.
  watch(
    () => groupedFilters.value.length === 0,
    (isEmpty) => emit('update:empty', isEmpty),
    { immediate: true },
  );

  /** Обновляет группу фильтров без мутации массива верхнего уровня. */
  function handleGroupUpdate(index: number, updatedGroup: FilterGroup): void {
    const updated = [...filter.value];

    updated[index] = updatedGroup;
    filter.value = updated;
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="containerGapClass"
  >
    <div
      v-for="(itemGroup, groupIndex) in groupedFilters"
      :key="groupIndex"
      class="flex flex-col"
      :class="groupGapClass"
    >
      <FilterGroupComponent
        v-for="(item, itemIndex) in itemGroup"
        :key="`${item.group.key}-${item.group.name}`"
        :model-value="item.group"
        :items="item.availableItems"
        :preview
        :position="resolveGroupPosition(itemIndex, itemGroup.length)"
        @update:model-value="handleGroupUpdate(item.index, $event)"
      />
    </div>
  </div>
</template>
