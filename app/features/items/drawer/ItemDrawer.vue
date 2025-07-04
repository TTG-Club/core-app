<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { ItemBody } from '~items/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { ItemDetailResponse } from '~items/types';

  const { url, isOpened, close } = useDrawer('item-detail');

  const {
    data: item,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `item`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<ItemDetailResponse>(`/api/v2/item/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/items/${url.value}` : undefined,
  );

  const editUrl = computed(() => `/workshop/items/${url.value}`);

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
    :title="item?.name"
    :source="item?.source"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <ItemBody
      v-if="item"
      :item="item"
    />
  </DrawerComponent>
</template>
