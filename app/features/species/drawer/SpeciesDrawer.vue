<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import type { SpeciesDetailResponse } from '~/shared/types';
  import { SpeciesBody } from '~species/body';
  import { DrawerComponent } from '~ui/drawer';

  const { inLineagesDrawer } = defineProps<{
    inLineagesDrawer?: boolean;
  }>();

  const { url, isOpened, close } = useDrawer(
    inLineagesDrawer ? 'species-lineage-detail' : 'species-detail',
  );

  const {
    data: species,
    status,
    execute,
    clear,
  } = await useAsyncData(
    'species-detail-drawer',
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<SpeciesDetailResponse>(`/api/v2/species/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/species/${url.value}` : undefined,
  );

  function handleUpdate(opened: boolean) {
    if (opened) {
      return;
    }

    close();
  }

  watch(isOpened, (value) => {
    if (!value) {
      return;
    }

    clear();
    execute();
  });
</script>

<template>
  <DrawerComponent
    :open="isOpened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="species?.name"
    :source="species?.source"
    :url="urlForCopy"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <SpeciesBody
      v-if="species"
      :species
    />
  </DrawerComponent>
</template>
