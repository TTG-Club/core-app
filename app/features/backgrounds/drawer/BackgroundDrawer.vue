<script setup lang="ts">
  import { BackgroundBody } from '~backgrounds/body';
  import { UiDrawer } from '~ui/drawer';

  import type { BackgroundDetailResponse } from '~/shared/types';

  const { background = undefined } = defineProps<{
    background?: BackgroundDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    background ? `${getOrigin()}/backgrounds/${background.url}` : undefined,
  );

  const editUrl = computed(() =>
    background ? `/workshop/backgrounds/${background.url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :title="background?.name"
    :source="background?.source"
    :date-time="background?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <BackgroundBody
      v-if="background"
      :background
    />
  </UiDrawer>
</template>
