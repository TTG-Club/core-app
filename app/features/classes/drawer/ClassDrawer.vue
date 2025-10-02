<script setup lang="ts">
  import { ClassBody } from '~classes/body';
  import { UiDrawer } from '~ui/drawer';

  import type { ClassDetailResponse } from '~classes/types';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `classes-${url}`),
    () => $fetch<ClassDetailResponse>(`/api/v2/classes/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/classes/${url}`);
  const editUrl = computed(() => `/workshop/classes/${url}`);
</script>

<template>
  <UiDrawer
    :title="detail?.name.rus"
    :source="detail?.source"
    :date-time="detail?.updatedAt"
    :url="urlForCopy"
    :edit-url="editUrl"
    :is-loading
    :is-error
    copy-title
    @close="$emit('close')"
  >
    <ClassBody
      v-if="detail"
      :detail="detail"
      hide-gallery
    />
  </UiDrawer>
</template>
