<script setup lang="ts" generic="T extends { url: string }">
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

  interface GroupSortCustom {
    mode: 'custom';
    order: Array<GroupKey>;
    unknown?: 'after' | 'before' | 'auto';
  }

  interface GroupSortComparator {
    mode: 'comparator';
    compare: (a: GroupKey, b: GroupKey) => number;
  }

  type GroupSort = GroupSortAuto | GroupSortCustom | GroupSortComparator;

  interface Props {
    items: Array<T>;
    groupBy?: (item: T) => GroupKey | undefined;
    separatorLabel?: SeparatorLabel;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    groupSort?: GroupSort;
  }

  const {
    items,
    groupBy = undefined,
    separatorLabel = undefined,
    columns = 3,
    groupSort = { mode: 'auto' },
  } = defineProps<Props>();

  function upperFirst(text: string): string {
    if (!text) {
      return '';
    }

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function getComparableKey(rawKey: string): GroupKey {
    const numericKey = Number(rawKey);

    return Number.isNaN(numericKey) ? rawKey : numericKey;
  }

  function sortKeysAuto(keys: Array<GroupKey>): Array<GroupKey> {
    return [...keys].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }

      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  }

  function sortGroupKeys(keys: Array<GroupKey>): Array<GroupKey> {
    if (groupSort.mode === 'auto') {
      return sortKeysAuto(keys);
    }

    if (groupSort.mode === 'comparator') {
      return [...keys].sort(groupSort.compare);
    }

    const orderIndex = new Map<string, number>();

    groupSort.order.forEach((key, index) => {
      orderIndex.set(String(key), index);
    });

    return [...keys].sort((a, b) => {
      const aIndex = orderIndex.get(String(a));
      const bIndex = orderIndex.get(String(b));

      if (aIndex != null && bIndex != null) {
        return aIndex - bIndex;
      }

      if (aIndex != null) {
        return -1;
      }

      if (bIndex != null) {
        return 1;
      }

      return sortKeysAuto([a, b])[0] === a ? -1 : 1;
    });
  }

  const groupedItems = computed<Array<Group<T>>>(() => {
    if (!items.length || !groupBy) {
      return [];
    }

    const grouped = items.reduce<Record<string, Array<T>>>((acc, item) => {
      const keyText = String(groupBy(item) ?? '');

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
    v-if="!groupBy"
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
