<script setup lang="ts">
  import { FeatBody } from '~feats/body';
  import { UiDrawer } from '~ui/drawer';

  import type { FeatDetailResponse } from '~/shared/types';

  const { feat = undefined } = defineProps<{
    feat?: FeatDetailResponse;
    isError?: boolean;
    isLoading?: boolean;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const urlForCopy = computed(() =>
    feat ? `${getOrigin()}/feats/${feat.url}` : undefined,
  );

  const editUrl = computed(() =>
    feat ? `/workshop/feats/${feat.url}` : undefined,
  );
</script>

<template>
  <UiDrawer
    :title="feat?.name"
    :source="feat?.source"
    :date-time="feat?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <FeatBody
      v-if="feat"
      :feat
    />
  </UiDrawer>
</template>
