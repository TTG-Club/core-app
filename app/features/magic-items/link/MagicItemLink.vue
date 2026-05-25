<script setup lang="ts">
  import type { MagicItemLinkResponse } from '~magic-items/model';

  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SmallLink } from '~ui/link';

  const { magicItem } = defineProps<{
    magicItem: MagicItemLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(MagicItemDrawer, {
    props: {
      url: magicItem.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const { isOpened, handleOpen } = useSectionLink(
    magicItem.url,
    drawer.id,
    () => drawer.open(),
  );
</script>

<template>
  <SmallLink
    :to="{ name: 'magic-items-url', params: { url: magicItem.url } }"
    :title="`${magicItem.name.rus} [${magicItem.name.eng}]`"
    :source="magicItem.source"
    :is-opened
    @open-drawer="handleOpen"
  >
    <template #default>
      {{ magicItem.name.rus }}
    </template>

    <template #english>
      {{ magicItem.name.eng }}
    </template>

    <template #caption>
      <UBadge
        v-if="magicItem.attunement"
        variant="subtle"
        color="neutral"
        size="sm"
      >
        Н
      </UBadge>

      <span>
        {{ magicItem.rarity }}
      </span>
    </template>
  </SmallLink>
</template>
