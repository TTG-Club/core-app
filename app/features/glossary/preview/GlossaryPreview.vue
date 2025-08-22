<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import type { GlossaryDetailResponse } from '~/shared/types';
  import { GlossaryBody } from '~glossary/body';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    glossary: GlossaryDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="glossary?.name"
    :source="glossary?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <GlossaryBody
      v-if="glossary"
      :glossary
    />
  </UiDrawer>
</template>
