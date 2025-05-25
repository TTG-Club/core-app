<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { CreatureLinkResponse } from '~/features/bestiary/types';

  const { bestiary } = defineProps<{
    bestiary: CreatureLinkResponse;
  }>();

  const { open } = useDrawer('bestiary-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'bestiary-url', params: { url: bestiary.url } }"
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
