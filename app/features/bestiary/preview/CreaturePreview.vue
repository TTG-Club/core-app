<script setup lang="ts">
  import { CreatureBody } from '~bestiary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { CreatureCreate, CreatureDetailResponse } from '~bestiary/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: CreatureCreate;
  }>();

  const {
    data: creature,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<CreatureDetailResponse>(`/api/v2/bestiary/preview`, {
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
    :title="creature?.name"
    :source="creature?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <CreatureBody
      v-if="creature"
      :creature
    />
  </UiDrawer>
</template>
