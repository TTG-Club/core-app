<script setup lang="ts">
  import type { FilterGroup, FilterGroups } from '../types';

  import { FilterGroup as FilterGroupComponent } from './ui';

  type GroupPosition = 'standalone' | 'top' | 'bottom';

  /**
   * Определяет позицию элемента внутри визуально объединённой группы.
   * Используется для управления скруглениями бордеров смежных блоков.
   */
  function getGroupPosition(
    subIdx: number,
    groupLength: number,
  ): GroupPosition {
    if (groupLength === 1) {
      return 'standalone';
    }

    return subIdx === 0 ? 'top' : 'bottom';
  }

  const { preview = false } = defineProps<{
    preview?: boolean;
  }>();

  const filter = defineModel<FilterGroups>({
    required: true,
  });

  const groupedFilters = computed(() => {
    const items: Array<Array<{ group: FilterGroup; index: number }>> = [];
    const groups = filter.value;

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const nextGroup = groups[i + 1];

      // Если идут подряд Классы и Подклассы, объединяем их (без отступа между ними)
      if (group?.key === 'className' && nextGroup?.key === 'subclassName') {
        items.push([
          { group, index: i },
          { group: nextGroup, index: i + 1 },
        ]);

        i++;
      } else if (group) {
        items.push([{ group, index: i }]);
      }
    }

    return items;
  });

  function handleGroupUpdate(index: number, updatedGroup: FilterGroup) {
    const updated = [...filter.value];

    updated[index] = updatedGroup;
    filter.value = updated;
  }
</script>

<template>
  <div
    class="flex flex-col"
    :class="preview ? 'gap-3' : 'gap-6'"
  >
    <div
      v-for="(itemGroup, idx) in groupedFilters"
      :key="idx"
      class="flex flex-col"
      :class="preview ? 'gap-3' : undefined"
    >
      <FilterGroupComponent
        v-for="(item, subIdx) in itemGroup"
        :key="`${item.group.key}-${item.group.name}`"
        :model-value="item.group"
        :preview
        :position="
          preview ? 'standalone' : getGroupPosition(subIdx, itemGroup.length)
        "
        @update:model-value="handleGroupUpdate(item.index, $event)"
      />
    </div>
  </div>
</template>
