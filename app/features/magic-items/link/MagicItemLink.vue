<script setup lang="ts">
  import { useDrawer } from '~/shared/composables';
  import { SmallLink } from '~ui/link';

  import type { MagicItemLinkResponse } from '~magic-items/types';

  const { magicItem } = defineProps<{
    magicItem: MagicItemLinkResponse;
  }>();

  const { open } = useDrawer('magic-item-detail');
</script>

<template>
  <SmallLink
    :to="{ name: 'magic-items-url', params: { url: magicItem.url } }"
    :title="`${magicItem.name.rus} [${magicItem.name.eng}]`"
    :group="magicItem.source.group"
    @open-drawer="open(magicItem.url)"
  >
    <template #default>
      {{ magicItem.name.rus }}
    </template>

    <template #english>
      {{ magicItem.name.eng }}
    </template>

    <template #caption>
      <ATag
        v-if="magicItem.attunement"
        :style="{ margin: 0 }"
      >
        Н
      </ATag>

      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ magicItem.rarity }}
      </span>
    </template>
  </SmallLink>
</template>
