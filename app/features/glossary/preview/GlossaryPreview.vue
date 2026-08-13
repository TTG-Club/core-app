<script setup lang="ts">
  import type { GlossaryCreate, GlossaryDetailResponse } from '~glossary/model';

  import { GlossaryBody } from '~glossary/body';
  import { getGlossaryMarkdown } from '~glossary/model';
  import { UiDrawer } from '~ui/drawer';

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

  const markdown = useEntityMarkdown(glossary, getGlossaryMarkdown);

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
    :markdown
    width="100%"
    @close="opened = false"
  >
    <GlossaryBody
      v-if="glossary"
      :glossary
    />
  </UiDrawer>
</template>
