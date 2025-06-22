<script setup lang="ts">
  import { GlossaryDrawer } from '~glossary/drawer';
  import { SmallLink } from '~ui/link';

  import type {
    GlossaryDetailResponse,
    GlossaryLinkResponse,
  } from '~/shared/types';

  const { glossary } = defineProps<{
    glossary: GlossaryLinkResponse;
  }>();

  const overlay = useOverlay();

  const {
    data: detail,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `glossary-${glossary.url}`),
    () => $fetch<GlossaryDetailResponse>(`/api/v2/glossary/${glossary.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(GlossaryDrawer, {
    props: computed(() => ({
      glossary: detail.value,
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
    :to="{ name: 'glossary-url', params: { url: glossary.url } }"
    :title="`${glossary.name.rus} [${glossary.name.eng}]`"
    :group="glossary.source?.group"
    :is-opened
    @open-drawer="open"
  >
    <template #default>
      {{ glossary.name.rus }}
    </template>

    <template #english>
      {{ glossary.name.eng }}
    </template>

    <template #caption>
      <span :style="{ color: 'var(--color-text-gray)' }">
        {{ glossary.tagCategory ?? '—' }}
      </span>
    </template>
  </SmallLink>
</template>
