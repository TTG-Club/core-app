<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';
  import { MagicItemBody } from '~magic-items/body';
  import type { MagicItemDetailResponse } from '~magic-items/types';

  const opened = defineModel<boolean>({ required: true });

  defineProps<{
    magicItem: MagicItemDetailResponse | undefined;
    isLoading: boolean;
    isError: boolean;
  }>();
</script>

<template>
  <UiDrawer
    v-model:open="opened"
    :min-width="320"
    :max-width="BREAKPOINTS[Breakpoint.MD]"
    :title="magicItem?.name"
    :source="magicItem?.source"
    :is-loading
    :is-error
    width="100%"
  >
    <MagicItemBody
      v-if="magicItem"
      :magic-item
    />
  </UiDrawer>
</template>
