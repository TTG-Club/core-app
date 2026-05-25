<script setup lang="ts">
  import type { SpeciesLinkResponse } from '~species/model';

  import { SpeciesDrawer } from '~species/drawer';
  import { CardLink } from '~ui/link';

  import { LinkLineages, LinkPreview } from './ui';

  const { species } = defineProps<{
    species: SpeciesLinkResponse;
  }>();

  const { isDesktop } = useDevice();
  const { isSplitActive } = useLayoutWidth();
  const overlay = useOverlay();

  const drawer = overlay.create(SpeciesDrawer, {
    props: {
      url: species.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(species.url, drawer.id, () =>
    drawer.open(),
  );

  const url = computed(() => `/species/${species.url}`);
</script>

<template>
  <CardLink
    :to="url"
    :name="species.name"
    :image="species.image"
    :source="species.source"
    :has-actions="species.hasLineages"
    :is-opened="isOpened"
    @open-drawer="handleOpen"
  >
    <template #actions>
      <LinkPreview
        v-if="isDesktop && !isSplitActive"
        :url="species.url"
      />

      <LinkLineages
        v-if="species.hasLineages"
        :url="species.url"
      />
    </template>
  </CardLink>
</template>
