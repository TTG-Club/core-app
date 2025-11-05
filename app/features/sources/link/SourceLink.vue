<script setup lang="ts">
  import { SmallLink } from '~ui/link';
  import type { BackgroundLinkResponse } from '~/shared/types';
  import { SourceDrawer } from '~/features/sources/drawer';

  const { source } = defineProps<{
    source: BackgroundLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(SourceDrawer, {
    props: {
      url: source.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'sources-url', params: { url: source.url } }"
    :title="`${source.name.rus} [${source.name.eng}]`"
    :source="source.source"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ source.name.rus }}
    </template>

    <template #english>
      {{ source.name.eng }}
    </template>

    <template #caption>
      <span>
        {{ source.abilityScores }}
      </span>
    </template>
  </SmallLink>
</template>
