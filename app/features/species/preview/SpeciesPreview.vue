<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { SpeciesBody } from '~species/body';
  import type { SpeciesDetailResponse, SpeciesCreate } from '~/shared/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: SpeciesCreate;
  }>();

  const {
    data: species,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<SpeciesDetailResponse>(`/api/v2/species/preview`, {
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
    :title="species?.name"
    :source="species?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <SpeciesBody
      v-if="species"
      :species
      hide-gallery
    />
  </UiDrawer>
</template>
