<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import type { SpeciesDetailResponse } from '~/shared/types';
  import { SpeciesBody } from '~species/body';
  import { DrawerComponent } from '~ui/drawer';

  const props = defineProps<{
    url: string;
  }>();

  const model = defineModel<boolean>();

  const {
    data: species,
    execute,
    status,
  } = await useAsyncData(
    `spell-${props.url}`,
    () => $fetch<SpeciesDetailResponse>(`/api/v2/species/${props.url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(
    () => `${window.location.origin}/species/${props.url}`,
  );

  watch(
    model,
    (value) => {
      if (!value) {
        return;
      }

      execute();
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <DrawerComponent
    v-model:open="model"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="species?.name"
    :source="species?.source"
    :url="urlForCopy"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
  >
    <SpeciesBody
      v-if="species"
      :species
    />
  </DrawerComponent>
</template>
