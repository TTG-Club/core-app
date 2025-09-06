<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { SpellBody } from '~spells/body';
  import type { SpellDetailResponse, SpellCreate } from '~/shared/types';

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
  >
    <SpellBody
      v-if="spell"
      :spell
    />
  </UiDrawer>
</template>
