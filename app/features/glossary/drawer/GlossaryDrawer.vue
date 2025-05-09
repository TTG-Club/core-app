<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS, useDrawer } from '~/shared/composables';
  import { GlossaryBody } from '~glossary/body';
  import { DrawerComponent } from '~ui/drawer';

  import type { GlossaryDetailResponse } from '~/shared/types';

  const { url, isOpened, close } = useDrawer('glossary-detail');

  const {
    data: glossary,
    status,
    execute,
    clear,
  } = await useAsyncData(
    `glossary-detail-drawer`,
    () => {
      if (!url.value) {
        return Promise.reject();
      }

      return $fetch<GlossaryDetailResponse>(`/api/v2/glossary/${url.value}`);
    },
    {
      server: false,
      immediate: false,
    },
  );

  const urlForCopy = computed(() =>
    isOpened.value ? `${getOrigin()}/glossary/${url.value}` : undefined,
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
    :title="glossary?.name"
    :source="glossary?.source"
    :url="urlForCopy"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
    copy-title
    @update:open="handleUpdate"
  >
    <GlossaryBody
      v-if="glossary"
      :glossary
    />
  </DrawerComponent>
</template>
