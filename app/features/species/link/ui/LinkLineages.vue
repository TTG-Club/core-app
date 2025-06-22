<script setup lang="ts">
  import { SpeciesLineagesDrawer } from '~species/lineages-drawer';

  import type { SpeciesLinkResponse } from '~/shared/types';

  const { url } = defineProps<{
    url: string;
  }>();

  const overlay = useOverlay();

  const { data, status, execute } = await useAsyncData(
    computed(() => `species-lineages-${url}`),
    () =>
      $fetch<Array<SpeciesLinkResponse>>(
        `/api/v2/species/${url}/lineages/search`,
      ),
    {
      server: false,
      immediate: false,
    },
  );

  const drawer = overlay.create(SpeciesLineagesDrawer, {
    props: computed(() => ({
      specieses: data.value,
      isError: status.value === 'error',
      isLoading: status.value === 'pending',
      notDetail: true,
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
    class="flex-[1_1_auto] cursor-pointer border-l border-(--color-border) bg-transparent py-3 hover:bg-(--color-hover)"
    @click.left.exact.prevent.stop="open"
  >
    Происхождения
  </button>
</template>
