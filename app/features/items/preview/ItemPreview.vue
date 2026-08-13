<script setup lang="ts">
  import type { ItemCreate, ItemDetailResponse } from '~items/model';

  import { ItemBody } from '~items/body';
  import { getItemMarkdown } from '~items/model';
  import { UiDrawer } from '~ui/drawer';

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

  const markdown = useEntityMarkdown(item, getItemMarkdown);

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
    :markdown
    width="100%"
    @close="opened = false"
  >
    <ItemBody
      v-if="item"
      :item
    />
  </UiDrawer>
</template>
