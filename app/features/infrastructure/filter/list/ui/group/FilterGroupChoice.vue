<script setup lang="ts">
  import type { FilterGroup as FilterGroupType } from '../../../types';

  import {
    getGroupItems,
    getSingleChoiceGroupExcludeLabel,
    isSingleChoiceExcluded,
    isSingleChoiceIncluded,
    toggleSingleChoiceExclude,
    toggleSingleChoiceInclude,
  } from '../../../utils';
  import { FilterTag } from '../tag';

  /**
   * Значения группы-признака «да или нет»: единственное значение показывается
   * двумя ответами — «Требуется» и «Не требуется». Отмечен может быть один;
   * повторное нажатие снимает ответ, и признак снова не важен.
   */
  const group = defineModel<FilterGroupType>({
    required: true,
  });

  const isIncluded = computed(() => isSingleChoiceIncluded(group.value));

  const isExcluded = computed(() => isSingleChoiceExcluded(group.value));

  const includeLabel = computed(() => getGroupItems(group.value)[0]?.name);

  const excludeLabel = computed(() =>
    getSingleChoiceGroupExcludeLabel(group.value),
  );

  /**
   * Нажатие на ответ «да».
   *
   * @param selected отмечен ли ответ после нажатия.
   */
  function handleInclude(selected: boolean | null): void {
    group.value = toggleSingleChoiceInclude(group.value, selected);
  }

  /**
   * Нажатие на ответ «нет».
   *
   * @param selected отмечен ли ответ после нажатия.
   */
  function handleExclude(selected: boolean | null): void {
    group.value = toggleSingleChoiceExclude(group.value, selected);
  }
</script>

<template>
  <div
    class="flex flex-wrap gap-2"
    role="group"
    :aria-label="group.name"
  >
    <FilterTag
      :model-value="isIncluded"
      @update:model-value="handleInclude"
    >
      {{ includeLabel }}
    </FilterTag>

    <FilterTag
      :model-value="isExcluded"
      exclude
      @update:model-value="handleExclude"
    >
      {{ excludeLabel }}
    </FilterTag>
  </div>
</template>
