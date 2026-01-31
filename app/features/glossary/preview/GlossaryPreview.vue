<script setup lang="ts">
  import { GlossaryBody } from '~glossary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { GlossaryCreate, GlossaryDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: GlossaryCreate;
  }>();

  const {
    data: glossary,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<GlossaryDetailResponse>(`/api/v2/glossary/preview`, {
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
    :title="glossary?.name"
    :source="glossary?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <GlossaryBody
      v-if="glossary"
      :glossary
    />
  </UiDrawer>
</template>
