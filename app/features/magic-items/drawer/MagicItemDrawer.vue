<script setup lang="ts">
  import { MagicItemBody } from '~magic-items/body';
  import { UiDrawer } from '~ui/drawer';

  import type { MagicItemDetailResponse } from '~magic-items/types';

  const { magicItem = undefined } = defineProps<{
    magicItem?: MagicItemDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    magicItem ? `${getOrigin()}/magic-item/${magicItem.url}` : undefined,
  );

  const editUrl = computed(() =>
    magicItem ? `/workshop/magic-item/${magicItem.url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :date-time="magicItem?.updatedAt"
    :source="magicItem?.source"
    :title="magicItem?.name"
    :edit-url="editUrl"
    :url="urlForCopy"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <MagicItemBody
      v-if="magicItem"
      :magic-item="magicItem"
    />
  </UiDrawer>
</template>
