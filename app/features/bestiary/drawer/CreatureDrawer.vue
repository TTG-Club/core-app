<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { BackgroundBody } from '~backgrounds/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { BackgroundDetailResponse } from '~/shared/types';

  const { url, isOpened, close } = useDrawer('background-detail');

  const {
    data: background,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `background-detail-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<BackgroundDetailResponse>(`/api/v2/bestiary/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/bestiary/${url.value}` : undefined,
  );

  const editUrl = computed(() => `/workshop/bestiary/${url.value}`);

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
    :title="background?.name"
    :source="background?.source"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <BackgroundBody
      v-if="background"
      :background
    />
  </DrawerComponent>
</template>
