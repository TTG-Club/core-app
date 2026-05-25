<script setup lang="ts">
  import type { SourceLinkResponse } from '~sources/types';

  import { SourceDrawer } from '~sources/drawer';
  import { CardLink } from '~ui/link';

  import { LinkPreview } from './ui';

  const { source } = defineProps<{
    source: SourceLinkResponse;
  }>();

  const { isDesktop } = useDevice();
  const { isSplitActive } = useLayoutWidth();
  const overlay = useOverlay();

  const drawer = overlay.create(SourceDrawer, {
    props: {
      url: source.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(source.url, drawer.id, () =>
    drawer.open(),
  );

  const url = computed(() => `/sources/${source.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="source.name"
    :image="source.image"
    :source="source.source"
    :is-opened="isOpened"
    @open-drawer="handleOpen"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop && !isSplitActive"
        :url="source.url"
      />
    </template>
  </CardLink>
</template>
