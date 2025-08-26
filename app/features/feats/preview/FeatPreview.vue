<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { FeatBody } from '~feats/body';
  import type { FeatDetailResponse } from '~/shared/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    feat: FeatDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="feat?.name"
    :source="feat?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <FeatBody
      v-if="feat"
      :feat
    />
  </UiDrawer>
</template>
