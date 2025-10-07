<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { ItemBody } from '~items/body';
  import type { ItemDetailResponse, ItemCreate } from '~items/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: ItemCreate;
  }>();

  const {
    data: item,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<ItemDetailResponse>(`/api/v2/item/preview`, {
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
    :title="item?.name"
    :source="item?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <ItemBody
      v-if="item"
      :item
    />
  </UiDrawer>
</template>
