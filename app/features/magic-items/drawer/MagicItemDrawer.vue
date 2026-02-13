<script setup lang="ts">
  import { MagicItemBody } from '~magic-items/body';
  import { UiDrawer } from '~ui/drawer';

  import type { MagicItemDetailResponse } from '~magic-items/model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `magic-items-${url}`),
    () => $fetch<MagicItemDetailResponse>(`/api/v2/magic-items/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/magic-items/${url}`);
  const editUrl = computed(() => `/workshop/magic-items/${url}`);
</script>

<template>
  <UiDrawer
    :title="detail?.name"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <MagicItemBody
      v-if="detail"
      :magic-item="detail"
    />
  </UiDrawer>
</template>
