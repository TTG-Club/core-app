<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { FeatLink } from '~feats/link';
  import { PageGrid } from '~ui/page';

  import type { FeatLinkResponse } from '~/shared/types';

  const { feats } = defineProps<{
    feats: Array<FeatLinkResponse>;
  }>();

  const groupedFeats = computed(() => {
    if (!feats?.length) {
      return [];
    }

    const grouped = groupBy(feats, 'category');

    return Object.keys(grouped)
      .sort()
      .map((category) => ({
        category,
        feats: grouped[category],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedFeats"
      :key="group.category"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ group.category }}
        </USeparator>

        <PageGrid :columns="3">
          <FeatLink
            v-for="feat in group.feats"
            :key="feat.url"
            :feat="feat"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
