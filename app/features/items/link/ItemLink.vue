<script setup lang="ts">
  import type { ItemLinkResponse } from '~items/model';

  import { ItemDrawer } from '~items/drawer';
  import { SmallLink } from '~ui/link';

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

  const { isOpened, handleOpen } = useSectionLink(item.url, drawer.id, () =>
    drawer.open(),
  );
</script>

<template>
  <SmallLink
    :to="{ name: 'items-url', params: { url: item.url } }"
    :title="`${item.name.rus} [${item.name.eng}]`"
    :source="item.source"
    :is-opened
    @open-drawer="handleOpen"
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
