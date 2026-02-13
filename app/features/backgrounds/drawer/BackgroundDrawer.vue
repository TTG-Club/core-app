<script setup lang="ts">
  import { BackgroundBody } from '~backgrounds/body';
  import { UiDrawer } from '~ui/drawer';

  import type { BackgroundDetailResponse } from '~backgrounds/model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `background-${url}`),
    () => $fetch<BackgroundDetailResponse>(`/api/v2/backgrounds/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/backgrounds/${url}`);
  const editUrl = computed(() => `/workshop/backgrounds/${url}`);
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
    <BackgroundBody
      v-if="detail"
      :background="detail"
    />
  </UiDrawer>
</template>
