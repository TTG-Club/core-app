<script setup lang="ts">
  import { SpeciesBody } from '~species/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { species = undefined } = defineProps<{
    species?: SpeciesDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    species ? `${getOrigin()}/species/${species.url}` : undefined,
  );

  const editUrl = computed(() =>
    species ? `/workshop/species/${species.url}` : undefined,
  );
</script>

<template>
  <DrawerComponent
    :title="species?.name"
    :source="species?.source"
    :date-time="species?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <SpeciesBody
      v-if="species"
      :species
    />
  </DrawerComponent>
</template>
