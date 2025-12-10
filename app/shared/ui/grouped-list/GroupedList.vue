<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { PageGrid } from '~ui/page';

  import type { Component } from 'vue';

  interface Props {
    items: Array<Record<string, any>>;
    groupBy: string;
    separatorLabel?: string | ((value: string | number) => string);
    itemComponent: Component;
    itemProp: string;
    sortFn?: (a: string | number, b: string | number) => number;
  }

  const {
    items,
    groupBy: groupByField,
    separatorLabel,
    itemComponent: ItemComponent,
    itemProp,
    sortFn,
  } = defineProps<Props>();

  const groupedItems = computed(() => {
    if (!items?.length) {
      return [];
    }

    const grouped = groupBy(items, groupByField);

    const keys = Object.keys(grouped);

    const sortedKeys = sortFn
      ? keys.sort((a, b) => {
          const aValue = isNumeric(a) ? Number(a) : a;
          const bValue = isNumeric(b) ? Number(b) : b;

          return sortFn(aValue, bValue);
        })
      : keys.sort();

    return sortedKeys.map((key) => ({
      key,
      value: isNumeric(key) ? Number(key) : key,
      items: grouped[key],
    }));
  });

  function isNumeric(value: string): boolean {
    return (
      !Number.isNaN(Number(value)) && !Number.isNaN(Number.parseFloat(value))
    );
  }

  function capitalizeFirstLetter(text: string): string {
    if (!text) {
      return text;
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function getSeparatorText(value: string | number): string {
    let text: string;

    if (!separatorLabel) {
      text = String(value);
    } else if (typeof separatorLabel === 'function') {
      text = separatorLabel(value);
    } else {
      text = separatorLabel.replace('{value}', String(value));
    }

    return capitalizeFirstLetter(text);
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedItems"
      :key="group.key"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ getSeparatorText(group.value) }}
        </USeparator>

        <PageGrid :columns="3">
          <component
            :is="ItemComponent"
            v-for="item in group.items"
            :key="item.url"
            v-bind="{ [itemProp]: item }"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
