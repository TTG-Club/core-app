<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { SpellBody } from '~spells/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { SpellDetailResponse } from '~/shared/types';

  const { url, isOpened, close } = useDrawer('spell-detail');

  const {
    data: spell,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `spell-detail-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<SpellDetailResponse>(`/api/v2/spells/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/spells/${url.value}` : undefined,
  );

  const editUrl = computed(() => `/workshop/spells/${url.value}`);

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
    :title="spell?.name"
    :source="spell?.source"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <SpellBody
      v-if="spell"
      :spell
    />
  </DrawerComponent>
</template>
