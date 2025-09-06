<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { MagicItemBody } from '~magic-items/body';
  import type {
    MagicItemDetailResponse,
    MagicItemCreate,
  } from '~magic-items/types';

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
    width="100%"
  >
    <MagicItemBody
      v-if="magicItem"
      :magic-item
    />
  </UiDrawer>
</template>
