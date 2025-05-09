<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { BackgroundLinkResponse } from '~/shared/types';

  const { background } = defineProps<{
    background: BackgroundLinkResponse;
  }>();

  const { open } = useDrawer('background-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'backgrounds-url', params: { url: background.url } }"
    :title="`${background.name.rus} [${background.name.eng}]`"
    :group="background.source.group"
    @open-drawer="open(background.url)"
  >
    <template #default>
      {{ background.name.rus }}
    </template>

    <template #english>
      {{ background.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ background.abilityScores }}
      </span>
    </template>
  </SmallLink>
</template>
