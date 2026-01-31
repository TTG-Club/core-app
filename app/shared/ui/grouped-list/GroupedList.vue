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
    field?: keyof T;
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
    if (!text) {
      return '';
    }

    const firstChar = text.slice(0, 1).toUpperCase();
    const rest = text.slice(1);

    return `${firstChar}${rest}`;
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

  function sortKeysCustom(
    keys: Array<GroupKey>,
    sortConfig: GroupSortCustom,
  ): Array<GroupKey> {
    const orderIndexByKeyText = new Map<string, number>();

    sortConfig.order.forEach((key, index) => {
      orderIndexByKeyText.set(String(key), index);
    });

    const knownKeys: Array<GroupKey> = [];
    const unknownKeys: Array<GroupKey> = [];

    keys.forEach((key) => {
      if (orderIndexByKeyText.has(String(key))) {
        knownKeys.push(key);
      } else {
        unknownKeys.push(key);
      }
    });

    const sortedKnown = [...knownKeys].sort((a, b) => {
      const aIndex = orderIndexByKeyText.get(String(a));
      const bIndex = orderIndexByKeyText.get(String(b));

      if (aIndex === undefined && bIndex === undefined) {
        return 0;
      }

      if (aIndex === undefined) {
        return 1;
      }

      if (bIndex === undefined) {
        return -1;
      }

      return aIndex - bIndex;
    });

    const unknownPolicy = sortConfig.unknown ?? 'after';

    if (unknownPolicy === 'auto') {
      return [...sortedKnown, ...sortKeysAuto(unknownKeys)];
    }

    if (unknownPolicy === 'before') {
      return [...unknownKeys, ...sortedKnown];
    }

    return [...sortedKnown, ...unknownKeys];
  }

  function sortGroupKeys(keys: Array<GroupKey>): Array<GroupKey> {
    if (groupSort.mode === 'auto') {
      return sortKeysAuto(keys);
    }

    if (groupSort.mode === 'comparator') {
      return [...keys].sort(groupSort.compare);
    }

    return sortKeysCustom(keys, groupSort);
  }

  const groupedItems = computed<Array<Group<T>>>(() => {
    if (!items.length || !field) {
      return [];
    }

    const grouped = items.reduce<Record<string, Array<T>>>((acc, item) => {
      const keyText = String(item[field] ?? '');

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
      return upperFirst(separatorLabel(value).replace('{value}', valueText));
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
