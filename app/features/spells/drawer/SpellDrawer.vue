<script setup lang="ts">
  import { Breakpoint, BREAKPOINTS } from '~/shared/composables';
  import type { SpellDetailResponse } from '~/shared/types';
  import { SpellBody } from '~spells/body';
  import { DrawerComponent } from '~ui/drawer';

  const props = defineProps<{
    url: string;
  }>();

  const model = defineModel<boolean>();

  const {
    data: spell,
    execute,
    status,
  } = await useAsyncData(
    `spell-${props.url}`,
    () => $fetch<SpellDetailResponse>(`/api/v2/spells/${props.url}`),
    {
      server: false,
      immediate: false,
      lazy: true,
    },
  );

  const urlForCopy = computed(
    () => `${window.location.origin}/spells/${props.url}`,
  );

  watch(
    model,
    (value) => {
      if (!value) {
        return;
      }

      execute();
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <DrawerComponent
    v-model:open="model"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="spell?.name"
    :source="spell?.source"
    :url="urlForCopy"
    :is-loading="status === 'pending'"
    :is-error="status === 'error'"
    width="100%"
  >
    <SpellBody
      v-if="spell"
      :spell
    />
  </DrawerComponent>
</template>
