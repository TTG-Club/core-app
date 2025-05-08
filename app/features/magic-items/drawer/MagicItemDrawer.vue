<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { MagicItemBody } from '~magic-items/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  const { url, isOpened, close } = useDrawer('magic-item-detail');

  const {
    data: magicItem,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `magicItem`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<MagicItemDetailResponse>(`/api/v2/magic-item/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/magic-items/${url.value}` : undefined,
  );

  const editUrl = computed(() => `/workshop/magic-items/${url.value}`);

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
    :title="magicItem?.name"
    :source="magicItem?.source"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <MagicItemBody
      v-if="magicItem"
      :magic-item="magicItem"
    />
  </DrawerComponent>
</template>
