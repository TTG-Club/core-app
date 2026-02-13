<script setup lang="ts">
  import { GlossaryBody } from '~glossary/body';
  import { UiDrawer } from '~ui/drawer';

  import type { GlossaryDetailResponse } from '~glossary/model';

  const { url } = defineProps<{
    url: string;
  }>();

  defineEmits<{
    (e: 'close'): void;
  }>();

  const { data: detail, status } = await useAsyncData(
    computed(() => `glossary-${url}`),
    () => $fetch<GlossaryDetailResponse>(`/api/v2/glossary/${url}`),
    {
      server: false,
      immediate: true,
    },
  );

  const isLoading = computed(() => status.value === 'pending');
  const isError = computed(() => status.value === 'error');
  const urlForCopy = computed(() => `${getOrigin()}/glossary/${url}`);
  const editUrl = computed(() => `/workshop/glossary/${url}`);
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
    <GlossaryBody
      v-if="detail"
      :glossary="detail"
    />
  </UiDrawer>
</template>
