<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { SourceBody } from '~/features/sources/body';
  import type {
    SourceCreate,
    SourceDetailResponse,
  } from '~/features/sources/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: SourceCreate;
  }>();

  const {
    data: source,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<SourceDetailResponse>(`/api/v2/source/preview`, {
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
    :title="source?.name"
    :source="source?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <SourceBody
      v-if="source"
      :source
    />
  </UiDrawer>
</template>
