<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { GlossaryLink } from '~glossary/link';
  import { PageGrid } from '~ui/page';

  import type { GlossaryLinkResponse } from '~/shared/types';

  const { items } = defineProps<{
    items: Array<GlossaryLinkResponse>;
  }>();

  const groupedGlossary = computed(() => {
    if (!items?.length) {
      return [];
    }

    const grouped = groupBy(items, 'tagCategory');

    return Object.keys(grouped)
      .sort()
      .map((tagCategory) => ({
        tagCategory,
        items: grouped[tagCategory],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedGlossary"
      :key="group.tagCategory"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ group.tagCategory }}
        </USeparator>

        <PageGrid :columns="3">
          <GlossaryLink
            v-for="item in group.items"
            :key="item.url"
            :glossary="item"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
