<script setup lang="ts">
  import { SpellBody } from '~spells/body';
  import { UiDrawer } from '~ui/drawer';

  import type { SpellCreate, SpellDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>('open', { required: true });

  const { state } = defineProps<{
    state: SpellCreate;
  }>();

  const {
    data: spell,
    status,
    execute: loadPreview,
    clear,
  } = useAsyncData(
    () =>
      $fetch<SpellDetailResponse>(`/api/v2/spells/preview`, {
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
    :title="spell?.name"
    :source="spell?.source"
    :is-loading
    :is-error
    width="100%"
    @close="opened = false"
  >
    <SpellBody
      v-if="spell"
      :spell
    />
  </UiDrawer>
</template>
