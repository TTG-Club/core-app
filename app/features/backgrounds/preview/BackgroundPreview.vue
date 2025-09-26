<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { BackgroundBody } from '~backgrounds/body';
  import type {
    BackgroundDetailResponse,
    BackgroundCreate,
  } from '~/shared/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: BackgroundCreate;
  }>();

  const {
    data: background,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<BackgroundDetailResponse>(`/api/v2/backgrounds/preview`, {
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
    :title="background?.name"
    :source="background?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <BackgroundBody
      v-if="background"
      :background
    />
  </UiDrawer>
</template>
