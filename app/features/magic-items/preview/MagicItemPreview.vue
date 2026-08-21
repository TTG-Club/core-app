<script setup lang="ts">
  import type {
    MagicItemCreate,
    MagicItemDetailResponse,
  } from '~magic-items/model';

  import { MagicItemBody } from '~magic-items/body';
  import { getMagicItemMarkdown } from '~magic-items/model';
  import { UiDrawer } from '~ui/drawer';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: MagicItemCreate;
  }>();

  const {
    data: magicItem,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<MagicItemDetailResponse>(`/api/v2/magic-items/preview`, {
        method: 'post',
        body: state,
      }),
    {
      lazy: true,
      server: false,
      immediate: false,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');

  const markdown = useEntityMarkdown(magicItem, getMagicItemMarkdown);

  whenever(opened, () => {
    clear();
    loadPreview();
  });
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="magicItem?.name"
    :source="magicItem?.source"
    :is-loading
    :is-error
    :markdown
    width="100%"
    @close="opened = false"
  >
    <MagicItemBody
      v-if="magicItem"
      :magic-item
    />
  </UiDrawer>
</template>
