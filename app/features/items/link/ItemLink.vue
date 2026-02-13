<script setup lang="ts">
  import { ItemDrawer } from '~items/drawer';
  import { SmallLink } from '~ui/link';

  import type { ItemLinkResponse } from '~items/model';

  const { item } = defineProps<{
    item: ItemLinkResponse;
  }>();

  const overlay = useOverlay();

  const drawer = overlay.create(ItemDrawer, {
    props: {
      url: item.url,
      onClose: () => drawer.close(),
    },
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));
</script>

<template>
  <SmallLink
    :to="{ name: 'items-url', params: { url: item.url } }"
    :title="`${item.name.rus} [${item.name.eng}]`"
    :source="item.source"
    :group="item.source.group"
    :is-opened
    @open-drawer="drawer.open()"
  >
    <template #default>
      {{ item.name.rus }}
    </template>

    <template #english>
      {{ item.name.eng }}
    </template>

    <template #caption>
      {{ item.cost }}
    </template>
  </SmallLink>
</template>
