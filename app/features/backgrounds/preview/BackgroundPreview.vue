<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { BackgroundBody } from '~backgrounds/body';
  import type { BackgroundDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    background: BackgroundDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="background?.name"
    :source="background?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <BackgroundBody
      v-if="background"
      :background
    />
  </UiDrawer>
</template>
