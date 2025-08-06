<script setup lang="ts">
  import { CreatureBody } from '~bestiary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { CreatureDetailResponse } from '~bestiary/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    creature: CreatureDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
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
