<script setup lang="ts">
  import type { FilterGroup as FilterGroupType } from '../../../types';
  import type { SingleChoiceState } from '../../../utils';

  import {
    getGroupItems,
    getSingleChoiceExcludeLabel,
    getSingleChoiceState,
    setSingleChoiceState,
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

  const choiceState = computed(() => getSingleChoiceState(group.value));

  const isIncluded = computed(() => choiceState.value === 'include');

  const isExcluded = computed(() => choiceState.value === 'exclude');

  const includeLabel = computed(() => getGroupItems(group.value)[0]?.name);

  const excludeLabel = computed(() =>
    includeLabel.value ? getSingleChoiceExcludeLabel(includeLabel.value) : '',
  );

  /**
   * Отмечает ответ или снимает его, если он уже отмечен.
   *
   * @param answer ответ, по которому нажали.
   * @param selected отмечен ли ответ после нажатия.
   */
  function handleAnswer(
    answer: Exclude<SingleChoiceState, 'any'>,
    selected: boolean | null,
  ): void {
    group.value = setSingleChoiceState(group.value, selected ? answer : 'any');
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
      @update:model-value="handleAnswer('include', $event)"
    >
      {{ includeLabel }}
    </FilterTag>

    <FilterTag
      :model-value="isExcluded"
      exclude
      @update:model-value="handleAnswer('exclude', $event)"
    >
      {{ excludeLabel }}
    </FilterTag>
  </div>
</template>
