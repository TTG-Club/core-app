<script setup lang="ts">
  import { FeatDrawer } from '~feats/drawer';
  import { SmallLink } from '~ui/link';

  import type { FeatDetailResponse, FeatLinkResponse } from '~/shared/types';

  const { feat } = defineProps<{
    feat: FeatLinkResponse;
  }>();

  const overlay = useOverlay();

  const {
    data: detail,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `feat-${feat.url}`),
    () => $fetch<FeatDetailResponse>(`/api/v2/feat/${feat.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(FeatDrawer, {
    props: computed(() => ({
      feat: detail.value,
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
    :to="{ name: 'feats-url', params: { url: feat.url } }"
    :title="`${feat.name.rus} [${feat.name.eng}]`"
    :group="feat.source.group"
    :is-opened
    @open-drawer="open"
  >
    <template #default>
      {{ feat.name.rus }}
    </template>

    <template #english>
      {{ feat.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ feat.category }}
      </span>
    </template>
  </SmallLink>
</template>
