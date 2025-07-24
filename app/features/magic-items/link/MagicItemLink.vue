<script setup lang="ts">
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SmallLink } from '~ui/link';

  import type { MagicItemLinkResponse } from '~magic-items/types';

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

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'magic-items-url', params: { url: magicItem.url } }"
    :title="`${magicItem.name.rus} [${magicItem.name.eng}]`"
    :group="magicItem.source.group"
    :is-opened
    @open-drawer="drawer.open()"
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

      <span :style="{ color: 'var(--ui-text-highlighted)' }">
        {{ magicItem.rarity }}
      </span>
    </template>
  </SmallLink>
</template>
