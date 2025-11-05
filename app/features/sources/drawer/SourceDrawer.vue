<script setup lang="ts">
  import { UiDrawer } from '~ui/drawer';

  import { SourceBody } from '~/features/sources/body';
  import type { SourceDetailResponse } from '~/features/sources/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `source-${url}`),
    () => $fetch<SourceDetailResponse>(`/api/v2/source/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/sources/${url}`);
  const editUrl = computed(() => `/workshop/sources/${url}`);
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
    <SourceBody
      v-if="detail"
      :source="detail"
    />
  </UiDrawer>
</template>
