<script setup lang="ts" generic="T extends { url: string }">
  import { get } from 'es-toolkit/compat';
  import { computed } from 'vue';
  import { PageGrid } from '~ui/page';

  type SeparatorLabel = string | ((value: string | number) => string);
  type GroupKey = string | number;

  interface Group<TItem> {
    key: GroupKey;
    items: Array<TItem>;
  }

  interface GroupSortAuto {
    mode: 'auto';
  }

  interface GroupSortOrdered {
    mode: 'ordered';
    order: Set<GroupKey>;
    unknown?: 'after' | 'before' | 'auto';
  }

  interface GroupSortComparator {
    mode: 'comparator';
    compare: (a: GroupKey, b: GroupKey) => number;
  }

  interface GroupSortCustom {
    mode: 'custom';
    compare: (items: Array<T>) => Array<Group<T>>;
  }

  type GroupSort =
    | GroupSortAuto
    | GroupSortOrdered
    | GroupSortComparator
    | GroupSortCustom;

  interface Props {
    items: Array<T>;
    field?: string;
    separatorLabel?: SeparatorLabel;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    groupSort?: GroupSort;
  }

  const {
    items,
    field = undefined,
    separatorLabel = undefined,
    columns = 3,
    groupSort = { mode: 'auto' },
  } = defineProps<Props>();

  function upperFirst(text: string): string {
    const str = text.trim();

    if (!str.length) {
      return '';
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function getComparableKey(rawKey: string): GroupKey {
    const numericKey = Number(rawKey);

    return Number.isNaN(numericKey) ? rawKey : numericKey;
  }

  function sortKeysAuto(keys: Array<GroupKey>): Array<GroupKey> {
    if (!field) {
      return [];
    }

    return [...keys].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }

      return sortString(String(a), String(b));
    });
  }

  function sortGroupKeys(keys: Array<GroupKey>): Array<GroupKey> {
    if (groupSort.mode === 'comparator') {
      return [...keys].sort(groupSort.compare);
    }

    if (groupSort.mode === 'ordered') {
      return groupSort.order.values().toArray();
    }

    return sortKeysAuto(keys);
  }

  const groupedItems = computed<Array<Group<T>>>(() => {
    if (!items.length) {
      return [];
    }

    if (groupSort.mode === 'custom') {
      return groupSort.compare(items);
    }

    if (!field) {
      return [];
    }

    const grouped = items.reduce<Record<string, Array<T>>>((acc, item) => {
      const keyText = String(get(item, field) ?? '');

      (acc[keyText] ??= []).push(item);

      return acc;
    }, {});

    const keys = Object.keys(grouped).map(getComparableKey);
    const sortedKeys = sortGroupKeys(keys);

    return sortedKeys.map((key) => ({
      key,
      items: grouped[String(key)] ?? [],
    }));
  });

  function getSeparatorText(value: GroupKey): string {
    const valueText = String(value);

    if (!separatorLabel) {
      return upperFirst(valueText);
    }

    if (typeof separatorLabel === 'function') {
      return upperFirst(separatorLabel(value));
    }

    return upperFirst(separatorLabel.replace('{value}', valueText));
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
