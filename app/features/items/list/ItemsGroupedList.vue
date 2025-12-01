<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { ItemLink } from '~items/link';
  import { PageGrid } from '~ui/page';

  import type { ItemLinkResponse } from '~items/types';

  const { items } = defineProps<{
    items: Array<ItemLinkResponse>;
  }>();

  const groupedItems = computed(() => {
    if (!items?.length) {
      return [];
    }

    const grouped = groupBy(items, 'category');

    return Object.keys(grouped)
      .sort()
      .map((category) => ({
        category,
        items: grouped[category],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedItems"
      :key="group.category"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ group.category }}
        </USeparator>

        <PageGrid :columns="3">
          <ItemLink
            v-for="item in group.items"
            :key="item.url"
            :item="item"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
