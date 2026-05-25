<script setup lang="ts">
  import type { ClassLinkResponse } from '../model';

  import { ClassDrawer } from '~classes/drawer';
  import { CardLink } from '~ui/link';

  import { LinkPreview, LinkSubclasses } from './ui';

  const { characterClass } = defineProps<{
    characterClass: ClassLinkResponse;
  }>();

  const { isDesktop } = useDevice();
  const { isSplitActive } = useLayoutWidth();
  const overlay = useOverlay();

  const drawer = overlay.create(ClassDrawer, {
    props: {
      url: characterClass.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(
    characterClass.url,
    drawer.id,
    () => drawer.open(),
  );

  const url = computed(() => `/classes/${characterClass.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="characterClass.name"
    :image="characterClass.image"
    :source="characterClass.source"
    :has-actions="characterClass.hasSubclasses"
    :is-opened="isOpened"
    @open-drawer="handleOpen"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop && !isSplitActive"
        :url="characterClass.url"
      />

      <LinkSubclasses
        v-if="characterClass.hasSubclasses"
        :url="characterClass.url"
      />
    </template>
  </CardLink>
</template>
