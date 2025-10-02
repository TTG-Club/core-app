<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { ArmorBody } from '~armors/body';
  import type { ArmorDetailResponse, ArmorCreate } from '~armors/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: ArmorCreate;
  }>();

  const {
    data: armor,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<ArmorDetailResponse>(`/api/v2/item/preview`, {
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
    :title="armor?.name"
    :source="armor?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <ArmorBody
      v-if="armor"
      :armor
    />
  </UiDrawer>
</template>
