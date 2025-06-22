<script setup lang="ts">
  import { SpeciesDrawer } from '~species/drawer';

  import type { SpeciesDetailResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const {
    data: species,
    status,
    execute,
  } = await useAsyncData(
    computed(() => `species-${url}`),
    () => $fetch<SpeciesDetailResponse>(`/api/v2/species/${url}`),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(SpeciesDrawer, {
    props: computed(() => ({
      species: species.value,
      isError: status.value === 'error',
      isLoading: status.value === 'pending',
      onClose: () => drawer.close(),
    })),
    destroyOnClose: true,
  });

  async function open() {
    if (status.value !== 'success') {
      await execute();
    }

    drawer.open();
  }
</script>

<template>
  <button
    class="flex-[1_1_auto] cursor-pointer bg-transparent py-3 hover:bg-(--color-hover)"
    @click.left.exact.prevent.stop="open"
  >
    Предпросмотр
  </button>
</template>
