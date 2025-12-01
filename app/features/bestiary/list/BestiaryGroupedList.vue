<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { CreatureLink } from '~bestiary/link';
  import { PageGrid } from '~ui/page';

  import type { CreatureLinkResponse } from '~bestiary/types';

  const { creatures } = defineProps<{
    creatures: Array<CreatureLinkResponse>;
  }>();

  const groupedBestiary = computed(() => {
    if (!creatures?.length) {
      return [];
    }

    const grouped = groupBy(creatures, 'challengeRailing');

    return Object.keys(grouped)
      .sort()
      .map((challengeRailing) => ({
        challengeRailing,
        creatures: grouped[challengeRailing],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedBestiary"
      :key="group.challengeRailing"
    >
      <div class="flex flex-col gap-4">
        <USeparator>
          {{ group.challengeRailing }}
        </USeparator>

        <PageGrid :columns="3">
          <CreatureLink
            v-for="creature in group.creatures"
            :key="creature.url"
            :creature="creature"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
