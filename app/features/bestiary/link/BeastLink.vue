<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { BeastLinkResponse } from '~/features/bestiary/types';

  const { bestiary } = defineProps<{
    bestiary: BeastLinkResponse;
  }>();

  const { open } = useDrawer('beastiary-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'beastiary-url', params: { url: bestiary.url } }"
    :title="`${bestiary.name.rus} [${bestiary.name.eng}]`"
    :group="bestiary.source.group"
    @open-drawer="open(bestiary.url)"
  >
    <template #default>
      {{ bestiary.name.rus }}
    </template>

    <template #english>
      {{ bestiary.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ bestiary.CR }}
      </span>
    </template>
  </SmallLink>
</template>
