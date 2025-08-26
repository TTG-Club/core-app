<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { SpeciesBody } from '~species/body';
  import type { SpeciesDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    species: SpeciesDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
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
