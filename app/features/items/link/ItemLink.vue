<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { ItemLinkResponse } from '~items/types';

  const { magicItem: item } = defineProps<{
    magicItem: ItemLinkResponse;
  }>();

  const { open } = useDrawer('magic-item-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'items-url', params: { url: item.url } }"
    :title="`${item.name.rus} [${item.name.eng}]`"
    :group="item.source.group"
    @open-drawer="open(item.url)"
  >
    <template #default>
      {{ item.name.rus }}
    </template>

    <template #english>
      {{ item.name.eng }}
    </template>

    <template #caption> </template>
  </SmallLink>
</template>
