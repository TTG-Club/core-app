<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { MagicItemLink } from '~magic-items/link';
  import { PageGrid } from '~ui/page';

  import type { MagicItemLinkResponse } from '~magic-items/types';

  const { magicItems } = defineProps<{
    magicItems: Array<MagicItemLinkResponse>;
  }>();

  const groupedMagicItems = computed(() => {
    if (!magicItems?.length) {
      return [];
    }

    const grouped = groupBy(magicItems, 'rarity');

    return Object.keys(grouped)
      .sort()
      .map((rarity) => ({
        rarity,
        magicItems: grouped[rarity],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedMagicItems"
      :key="group.rarity"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ group.rarity }}
        </USeparator>

        <PageGrid :columns="3">
          <MagicItemLink
            v-for="magicItem in group.magicItems"
            :key="magicItem.url"
            :magic-item="magicItem"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
