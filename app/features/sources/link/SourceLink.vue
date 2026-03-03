<script setup lang="ts">
  import { SourceDrawer } from '~sources/drawer';
  import { CardLink } from '~ui/link';

  import { LinkPreview } from './ui';

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

  const { isDesktop } = useDevice();
  const url = computed(() => `/sources/${source.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="source.name"
    :image="source.image"
    :source="source.source"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop"
        :url="source.url"
      />
    </template>
  </CardLink>
</template>
