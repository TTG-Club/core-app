<script setup lang="ts">
  import { MagicItemDrawer } from '~magic-items/drawer';
  import { SmallLink } from '~ui/link';

  import type {
    MagicItemDetailResponse,
    MagicItemLinkResponse,
  } from '~magic-items/types';

  const { magicItem } = defineProps<{
    magicItem: MagicItemLinkResponse;
  }>();

  const overlay = useOverlay();

  const {
    data: detail,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `magic-item-${magicItem.url}`),
    () =>
      $fetch<MagicItemDetailResponse>(`/api/v2/magic-item/${magicItem.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(MagicItemDrawer, {
    props: computed(() => ({
      magicItem: detail.value,
      isError: status.value === 'error',
      isLoading: status.value === 'pending',
      onClose: () => drawer.close(),
    })),
    destroyOnClose: true,
  });

  const isOpened = computed(() => overlay.isOpen(drawer.id));

  async function open() {
    if (status.value !== 'success') {
      await execute();
    }

    drawer.open();
  }
</script>

<template>
  <SmallLink
    :to="{ name: 'magic-items-url', params: { url: magicItem.url } }"
    :title="`${magicItem.name.rus} [${magicItem.name.eng}]`"
    :group="magicItem.source.group"
    :is-opened
    @open-drawer="open"
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

      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ magicItem.rarity }}
      </span>
    </template>
  </SmallLink>
</template>
