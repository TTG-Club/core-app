<script setup lang="ts" generic="T extends object">
  import { groupBy, isNumber, sortBy, upperFirst } from 'lodash-es';
  import { PageGrid } from '~ui/page';

  interface Props {
    items: Array<T>;
    groupBy: keyof T;
    separatorLabel?: string | ((value: string | number) => string);
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
  }

  const {
    items,
    groupBy: groupByField,
    separatorLabel,
    columns = 3,
  } = defineProps<Props>();

  const groupedItems = computed(() => {
    if (!items?.length) {
      return [];
    }

    const grouped = groupBy(items, groupByField);

    const keys = Object.keys(grouped);

    const sortedKeys = sortBy(keys, (key) => {
      const numValue = Number(key);

      if (isNumber(numValue) && !Number.isNaN(numValue)) {
        return numValue;
      }

      return key;
    });

    return sortedKeys.map((key) => {
      const numValue = Number(key);

      return {
        key,
        value: isNumber(numValue) && !Number.isNaN(numValue) ? numValue : key,
        items: grouped[key],
      };
    });
  });

  function getSeparatorText(value: string | number): string {
    let text: string;

    if (!separatorLabel) {
      text = String(value);
    } else if (typeof separatorLabel === 'function') {
      text = separatorLabel(value);
    } else {
      text = separatorLabel.replace('{value}', String(value));
    }

    return upperFirst(text);
  }
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      v-for="group in groupedItems"
      :key="group.key"
      class="flex flex-col gap-4"
    >
      <USeparator>
        {{ getSeparatorText(group.value) }}
      </USeparator>

      <PageGrid :columns="columns">
        <slot
          v-for="(item, index) in group.items"
          :key="String((item as { url?: string }).url ?? index)"
          :item="item"
        />
      </PageGrid>
    </div>
  </div>
</template>
