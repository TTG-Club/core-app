<script setup lang="ts">
  import { groupBy } from 'lodash-es';
  import { SpellLink } from '~spells/link';
  import { PageGrid } from '~ui/page';

  import type { SpellLinkResponse } from '~/shared/types';

  const { spells } = defineProps<{
    spells: Array<SpellLinkResponse>;
  }>();

  const groupedSpells = computed(() => {
    if (!spells?.length) {
      return [];
    }

    const grouped = groupBy(spells, 'level');

    return Object.keys(grouped)
      .map(Number)
      .sort((a, b) => a - b)
      .map((level) => ({
        level,
        spells: grouped[String(level)],
      }));
  });
</script>

<template>
  <div class="flex flex-col gap-6">
    <template
      v-for="group in groupedSpells"
      :key="group.level"
    >
      <div class="flex flex-col gap-4">
        <USeparator> Уровень {{ group.level }} </USeparator>

        <PageGrid :columns="3">
          <SpellLink
            v-for="spell in group.spells"
            :key="spell.url"
            :spell="spell"
          />
        </PageGrid>
      </div>
    </template>
  </div>
</template>
