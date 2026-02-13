<script setup lang="ts">
  import { FeatDrawer } from '~feats/drawer';
  import { SmallLink } from '~ui/link';

  import type { FeatLinkResponse } from '~feats/model';

  const { feat } = defineProps<{
    feat: FeatLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(FeatDrawer, {
    props: {
      url: feat.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'feats-url', params: { url: feat.url } }"
    :title="`${feat.name.rus} [${feat.name.eng}]`"
    :source="feat.source"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ feat.name.rus }}
    </template>

    <template #english>
      {{ feat.name.eng }}
    </template>

    <template #caption>
      <span>
        {{ feat.category }}
      </span>
    </template>
  </SmallLink>
</template>
