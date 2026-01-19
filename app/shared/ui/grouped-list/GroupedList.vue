<script setup lang="ts" generic="T extends { url: string }">
  import { upperFirst } from 'es-toolkit';
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

    const grouped = items.reduce<Record<string, T[]>>((acc, item) => {
      const key = String(item[field]);

      (acc[key] ??= []).push(item);

      return acc;
    }, {});

    const keys = Object.keys(grouped)
      .map((key) => {
        const numValue = Number(key);

        return !Number.isNaN(numValue) ? numValue : key;
      })
      .sort((a, b) => {
        if (typeof a === 'number' && typeof b === 'number') {
          return a - b;
        }

        return String(a).localeCompare(String(b), undefined, { numeric: true });
      });

    return keys.map((key) => ({
      key,
      items: grouped[String(key)],
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
