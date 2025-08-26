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
    <div
      v-if="species"
      class="mb-4 overflow-hidden rounded-lg border border-default bg-muted py-1.5"
    >
      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted">Тип:</span>

        <span>{{ species.properties.type }}</span>
      </div>

      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted"
          >Размер:</span
        >

        <span>{{ species.properties.size }}</span>
      </div>

      <div class="flex w-full min-w-full gap-0 px-4 py-1.5">
        <span class="min-w-20 text-sm font-medium text-highlighted"
          >Скорость:</span
        >

        <span>{{ species.properties.speed }}</span>
      </div>
    </div>

    <SpeciesBody
      v-if="species"
      :species
    />
  </UiDrawer>
</template>
