<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { FeatBody } from '~feats/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { FeatDetailResponse } from '~/shared/types';

  const { url, isOpened, close } = useDrawer('feat-detail');

  const {
    data: feat,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `feat-detail-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<FeatDetailResponse>(`/api/v2/feats/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/feats/${url.value}` : undefined,
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
    :title="feat?.name"
    :source="feat?.source"
    :url="urlForCopy"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <FeatBody
      v-if="feat"
      :feat
    />
  </DrawerComponent>
</template>
