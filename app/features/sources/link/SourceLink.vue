<script setup lang="ts">
  import { SourceDrawer } from '~sources/drawer';
  import { SmallLink } from '~ui/link';

  import type { SourceLinkResponse } from '~sources/types';

  const { source } = defineProps<{
    source: SourceLinkResponse;
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
    :is-opened
    :source="source.source"
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ source.name.rus }}
    </template>

    <template #english>
      {{ source.name.eng }}
    </template>
  </SmallLink>
</template>
