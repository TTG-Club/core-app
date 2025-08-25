<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { SpellBody } from '~spells/body';
  import type { SpellDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    spell: SpellDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
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
