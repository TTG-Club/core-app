<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { CreatureBody } from '~bestiary/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { CreatureDetailResponse } from '~bestiary/types';

  const { url, isOpened, close } = useDrawer('bestiary-detail');

  const {
    data: creature,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `bestiary-detail-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<CreatureDetailResponse>(`/api/v2/bestiary/${url.value}`);
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
    :title="creature?.name"
    :source="creature?.source"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <CreatureBody
      v-if="creature"
      :creature
    />
  </DrawerComponent>
</template>
