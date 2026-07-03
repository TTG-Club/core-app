<script
  setup
  lang="ts"
  generic="TItem, TGrouping extends string, TSorting extends string"
>
  import type { DropdownMenuItem } from '@nuxt/ui';

  import type { ListPresentationConfig } from '../model';

  import {
    LIST_PRESENTATION_GROUPING_ICON,
    LIST_PRESENTATION_GROUPING_LABEL,
    LIST_PRESENTATION_SORTING_ICON,
    LIST_PRESENTATION_SORTING_LABEL,
  } from '../model';

  const props = defineProps<{
    config: ListPresentationConfig<TItem, TGrouping, TSorting>;
  }>();

  const grouping = defineModel<TGrouping>('grouping', { required: true });
  const sorting = defineModel<TSorting>('sorting', { required: true });

  const groupingItems = computed<Array<DropdownMenuItem>>(() =>
    props.config.groupingOptions.map((option) => ({
      label: option.label,
      type: 'checkbox',
      checked: grouping.value === option.value,
      onSelect: (event: Event) => {
        event.preventDefault();
        grouping.value = option.value;
      },
    })),
  );

  const sortingItems = computed<Array<DropdownMenuItem>>(() =>
    props.config.sortingOptions.map((option) => ({
      label: option.label,
      type: 'checkbox',
      checked: sorting.value === option.value,
      onSelect: (event: Event) => {
        event.preventDefault();
        sorting.value = option.value;
      },
    })),
  );
</script>

<template>
  <div class="flex gap-2">
    <UDropdownMenu
      v-if="props.config.groupingOptions.length > 1"
      :items="groupingItems"
      :ui="{ content: 'w-56' }"
    >
      <UButton
        square
        :icon="LIST_PRESENTATION_GROUPING_ICON"
        :title="LIST_PRESENTATION_GROUPING_LABEL"
        :aria-label="LIST_PRESENTATION_GROUPING_LABEL"
      />
    </UDropdownMenu>

    <UDropdownMenu
      v-if="props.config.sortingOptions.length > 1"
      :items="sortingItems"
      :ui="{ content: 'w-56' }"
    >
      <UButton
        square
        :icon="LIST_PRESENTATION_SORTING_ICON"
        :title="LIST_PRESENTATION_SORTING_LABEL"
        :aria-label="LIST_PRESENTATION_SORTING_LABEL"
      />
    </UDropdownMenu>
  </div>
</template>
