<script setup lang="ts">
  import type { FeatLinkResponse } from '~/shared/types';
  import { SmallLink } from '~ui/link';
  import { useDrawer } from '~/shared/composables';

  const { feat } = defineProps<{
    feat: FeatLinkResponse;
  }>();

  const { open } = useDrawer('feat-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'feats-url', params: { url: feat.url } }"
    :title="`${feat.name.rus} [${feat.name.eng}]`"
    :group="feat.source.group"
    @open-drawer="open(feat.url)"
  >
    <template #default>
      {{ feat.name.rus }}
    </template>

    <template #english>
      {{ feat.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ feat.category }}
      </span>
    </template>
  </SmallLink>
</template>
