<script setup lang="ts">
  import { BackgroundDrawer } from '~backgrounds/drawer';
  import { SmallLink } from '~ui/link';

  import type { BackgroundLinkResponse } from '~backgrounds/model';

  const { background } = defineProps<{
    background: BackgroundLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(BackgroundDrawer, {
    props: {
      url: background.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'backgrounds-url', params: { url: background.url } }"
    :title="`${background.name.rus} [${background.name.eng}]`"
    :source="background.source"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ background.name.rus }}
    </template>

    <template #english>
      {{ background.name.eng }}
    </template>

    <template #caption>
      <span>
        {{ background.abilityScores }}
      </span>
    </template>
  </SmallLink>
</template>
