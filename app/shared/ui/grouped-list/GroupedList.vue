<script setup lang="ts" generic="T extends { url: string }">
  import { groupBy, isNumber, sortBy, upperFirst } from 'lodash-es';
  import { PageGrid } from '~ui/page';

  interface Props {
    items: Array<T>;
    field?: keyof T;
    separatorLabel?: string | ((value: string | number) => string);
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  const {
    items,
    field = undefined,
    separatorLabel = undefined,
    columns = 3,
  } = defineProps<Props>();

  const groupedItems = computed(() => {
    if (!items?.length || !field) {
      return [];
    }

    const grouped = groupBy(items, field);

    const keys = Object.keys(grouped).map((key) => {
      const numValue = Number(key);

      if (isNumber(numValue) && !Number.isNaN(numValue)) {
        return numValue;
      }

      return key;
    });

    const sortedKeys = sortBy(keys);

    return sortedKeys.map((key) => ({
      key,
      items: grouped[key],
    }));
  });

  function getSeparatorText(value: string | number): string {
    let text: string;

    if (!separatorLabel) {
      text = String(value);
    } else if (typeof separatorLabel === 'function') {
      text = separatorLabel(value).replace('{value}', String(value));
    } else {
      text = separatorLabel.replace('{value}', String(value));
    }

    return upperFirst(text);
  }
</script>

<template>
  <PageGrid
    v-if="!field"
    :columns="columns"
  >
    <slot
      v-for="item in items"
      :key="item.url"
      :item="item"
    />
  </PageGrid>

  <div
    v-else
    class="flex flex-col gap-6"
  >
    <div
      v-for="group in groupedItems"
      :key="group.key"
      class="flex flex-col gap-4"
    >
      <USeparator>
        {{ getSeparatorText(group.key) }}
      </USeparator>

      <PageGrid :columns="columns">
        <slot
          v-for="item in group.items"
          :key="item.url"
          :item="item"
        />
      </PageGrid>
    </div>
  </div>
</template>
