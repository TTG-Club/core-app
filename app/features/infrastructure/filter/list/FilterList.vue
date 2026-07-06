<script setup lang="ts">
  import type { FilterGroup, FilterGroups, FilterItems } from '../types';

  import {
    getAvailableGroupItems,
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

  /** Определяет видимость группы в обычном режиме и режиме предпросмотра. */
  function isGroupVisible(items: FilterItems, isPreview: boolean): boolean {
    return !isPreview || hasTouchedItem(items);
  }

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

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

  const groupedFilters = computed(() => {
    const displayGroups: DisplayGroup[][] = [];
    const groups = filter.value;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const nextGroup = groups[i + 1];

      if (!group) {
        continue;
      }

      const availableItems = getAvailableGroupItems(group, groups);

      if (nextGroup && isGroupDependentOn(nextGroup, group.key)) {
        const nextAvailableItems = getAvailableGroupItems(nextGroup, groups);
        const combinedGroups: DisplayGroup[] = [];

        if (isGroupVisible(availableItems, preview)) {
          combinedGroups.push({ group, index: i, availableItems });
        }

        if (isGroupVisible(nextAvailableItems, preview)) {
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
      } else if (isGroupVisible(availableItems, preview)) {
        displayGroups.push([{ group, index: i, availableItems }]);
      }
    }

    return displayGroups;
  });

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
