<script setup lang="ts">
  import type { FeatCreate, FeatDetailResponse } from '~feats/model';

  import { FeatBody } from '~feats/body';
  import { getFeatMarkdown } from '~feats/model';
  import { UiDrawer } from '~ui/drawer';

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

  const markdown = useEntityMarkdown(feat, getFeatMarkdown);

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
    :markdown
    width="100%"
    @close="opened = false"
  >
    <FeatBody
      v-if="feat"
      :feat
    />
  </UiDrawer>
</template>
