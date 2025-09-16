<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { FeatBody } from '~feats/body';
  import type { FeatDetailResponse, FeatCreate } from '~/shared/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: FeatCreate;
  }>();

  const {
    data: feat,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<FeatDetailResponse>(`/api/v2/feats/preview`, {
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
    :title="feat?.name"
    :source="feat?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <FeatBody
      v-if="feat"
      :feat
    />
  </UiDrawer>
</template>
