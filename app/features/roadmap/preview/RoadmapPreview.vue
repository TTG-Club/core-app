<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import type { RoadmapItem, RoadmapRequest } from '~roadmap/types';
  import { MarkupRender } from '~ui/markup';

  const opened = ref<boolean>(false);

  const { state } = defineProps<{
    state: RoadmapRequest;
  }>();

  const {
    data: feature,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<RoadmapItem>(`/api/v2/roadmap/preview`, {
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
  <UButton
    label="Предпросмотр"
    color="neutral"
    variant="subtle"
    @click.left.exact.prevent="opened = true"
  />

  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="feature?.name"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <UCard
      v-if="feature?.preview"
      variant="soft"
      class="mb-2"
      :ui="{
        body: 'sm:p-4',
      }"
    >
      {{ feature.preview }}
    </UCard>

    <MarkupRender
      v-if="feature?.description"
      :render-node="feature.description"
    />
  </UiDrawer>
</template>
